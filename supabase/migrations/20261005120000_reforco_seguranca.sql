-- ═══════════════════════════════════════════════════════════════════════════
-- Reforço de segurança (auditoria de 05/10/2026)
-- 1. Funções internas deixam de ser chamáveis por visitantes anônimos.
-- 2. proximo_codigo só para quem é da equipe (conta sem perfil não consegue esgotar a numeração).
-- 3. registrar_lead com limite por IP (IP guardado só como hash, sem dado pessoal) e limites de
--    tamanho em todos os campos.
-- 4. Links de vídeo/tour e fotos dos imóveis validados no banco (não dá para burlar o painel
--    gravando direto pela API).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Funções internas: nada para anon ─────────────────────────────────────
revoke all on function public.papel_atual() from public, anon;
revoke all on function public.eh_admin() from public, anon;
revoke all on function public.meu_corretor_id() from public, anon;
revoke all on function public.pode_editar_imovel(uuid) from public, anon;
revoke all on function public.imovel_da_pasta(text) from public, anon;
revoke all on function public.antes_de_salvar() from public, anon, authenticated;
revoke all on function public.registrar_auditoria() from public, anon, authenticated;
-- As regras RLS de quem está logado usam estas funções.
grant execute on function public.papel_atual() to authenticated, service_role;
grant execute on function public.eh_admin() to authenticated, service_role;
grant execute on function public.meu_corretor_id() to authenticated, service_role;
grant execute on function public.pode_editar_imovel(uuid) to authenticated, service_role;
grant execute on function public.imovel_da_pasta(text) to authenticated, service_role;

-- Funções criadas daqui em diante não ficam abertas para anon por padrão.
alter default privileges in schema public revoke execute on functions from public, anon;

-- ── 2. Numeração de imóveis só para a equipe ────────────────────────────────
create or replace function public.proximo_codigo()
returns text
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if public.papel_atual() is null then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  return 'CP-' || lpad(nextval('public.imoveis_codigo_seq')::text, 4, '0');
end
$$;
revoke all on function public.proximo_codigo() from public, anon;
grant execute on function public.proximo_codigo() to authenticated;

-- ── 3. Leads: limite por IP ─────────────────────────────────────────────────
create table if not exists public.limite_envios (
  id bigint generated always as identity primary key,
  chave text not null,
  criado_em timestamptz not null default now()
);
create index if not exists limite_envios_chave_idx on public.limite_envios (chave, criado_em desc);
alter table public.limite_envios enable row level security;
revoke all on public.limite_envios from anon, authenticated;
comment on table public.limite_envios is 'Contador anti-abuso dos formulários (hash do IP, apagado após 1 dia).';

-- IP de quem chamou a API (o Supabase repassa os cabeçalhos da requisição). Só o hash é usado.
create or replace function public.ip_da_requisicao()
returns text
language plpgsql stable set search_path = ''
as $$
declare
  h json;
begin
  h := nullif(current_setting('request.headers', true), '')::json;
  return coalesce(
    h ->> 'cf-connecting-ip',
    h ->> 'x-real-ip',
    btrim(split_part(h ->> 'x-forwarded-for', ',', 1)),
    'desconhecido'
  );
exception when others then
  return 'desconhecido';
end
$$;
revoke all on function public.ip_da_requisicao() from public, anon, authenticated;

create or replace function public.registrar_lead(dados jsonb)
returns uuid
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_nome text := btrim(coalesce(dados ->> 'nome', ''));
  v_whats text := regexp_replace(left(coalesce(dados ->> 'whatsapp', ''), 40), '\D', '', 'g');
  v_email text := nullif(btrim(coalesce(dados ->> 'email', '')), '');
  v_origem text := dados ->> 'origem';
  v_codigo text := nullif(upper(btrim(left(coalesce(dados ->> 'codigoImovel', ''), 20))), '');
  v_mensagem text := nullif(btrim(coalesce(dados ->> 'mensagem', '')), '');
  v_renda text := nullif(dados ->> 'rendaFamiliarFaixa', '');
  v_data text := nullif(dados ->> 'dataVisitaPreferida', '');
  v_periodo text := nullif(dados ->> 'periodoPreferido', '');
  v_utm jsonb := dados -> 'utm';
  v_ip text := encode(extensions.digest(public.ip_da_requisicao(), 'sha256'), 'hex');
  v_imovel_id uuid;
  v_corretor text;
  v_id uuid;
begin
  if dados is null or jsonb_typeof(dados) <> 'object' or length(dados::text) > 6000 then
    raise exception 'dados inválidos' using errcode = '22023';
  end if;

  -- Honeypot: campo invisível preenchido = robô (finge sucesso, não grava).
  if coalesce(dados ->> 'site', '') <> '' then
    return gen_random_uuid();
  end if;

  -- Validação (mesmas regras de src/lib/schemas/lead.ts).
  if length(v_nome) < 2 or length(v_nome) > 120 then
    raise exception 'nome inválido' using errcode = '22023';
  end if;
  if length(v_whats) >= 12 and left(v_whats, 2) = '55' then
    v_whats := substr(v_whats, 3);
  end if;
  if v_whats !~ '^[1-9]{2}9?\d{8}$' then
    raise exception 'whatsapp inválido' using errcode = '22023';
  end if;
  v_whats := '55' || v_whats;
  if v_email is not null and (length(v_email) > 160 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'e-mail inválido' using errcode = '22023';
  end if;
  if v_origem is null or v_origem not in
     ('formulario_contato', 'formulario_imovel', 'agendamento_visita', 'anuncie', 'cabe_no_bolso') then
    raise exception 'origem inválida' using errcode = '22023';
  end if;
  if coalesce(dados ->> 'consentimentoLGPD', '') <> 'true' then
    raise exception 'consentimento obrigatório' using errcode = '22023';
  end if;
  if v_codigo is not null and v_codigo !~ '^CP-\d{4}$' then
    v_codigo := null;
  end if;
  if v_renda is not null and v_renda not in
     ('faixa1', 'faixa2', 'faixa3', 'faixa4', 'sbpe', 'prefiro_nao_informar') then
    v_renda := null;
  end if;
  if v_data is not null and v_data !~ '^\d{4}-\d{2}-\d{2}$' then
    v_data := null;
  end if;
  if v_data is not null then
    begin
      if v_data::date < current_date - 1 or v_data::date > current_date + 365 then
        v_data := null;
      end if;
    exception when others then
      v_data := null;
    end;
  end if;
  if v_periodo is not null and v_periodo not in ('manha', 'tarde', 'noite') then
    v_periodo := null;
  end if;
  if v_origem = 'agendamento_visita' and (v_data is null or v_periodo is null) then
    raise exception 'escolha data e período' using errcode = '22023';
  end if;
  if v_utm is not null and (jsonb_typeof(v_utm) <> 'object' or length(v_utm::text) > 600) then
    v_utm := null;
  end if;

  -- Limites contra abuso: por IP, por WhatsApp e no total.
  delete from public.limite_envios where criado_em < now() - interval '1 day';
  if (select count(*) from public.limite_envios
      where chave = v_ip and criado_em > now() - interval '10 minutes') >= 5
     or (select count(*) from public.limite_envios where chave = v_ip) >= 30 then
    raise exception 'muitas tentativas' using errcode = 'P0001', hint = 'limite';
  end if;
  if (select count(*) from public.leads
      where whatsapp = v_whats and criado_em > now() - interval '10 minutes') >= 5 then
    raise exception 'muitas tentativas' using errcode = 'P0001', hint = 'limite';
  end if;
  if (select count(*) from public.leads where criado_em > now() - interval '1 minute') >= 60 then
    raise exception 'muitas tentativas' using errcode = 'P0001', hint = 'limite';
  end if;
  insert into public.limite_envios (chave) values (v_ip);

  if v_codigo is not null then
    select id, corretor_id into v_imovel_id, v_corretor
    from public.imoveis where codigo = v_codigo and status <> 'rascunho';
  end if;

  insert into public.leads (
    origem, nome, whatsapp, email, renda_faixa, codigo_imovel, imovel_id, mensagem,
    data_visita, periodo_visita, utm, consentimento_lgpd, etapa, corretor_id
  ) values (
    v_origem, v_nome, v_whats, v_email, v_renda, v_codigo, v_imovel_id,
    left(v_mensagem, 1500), v_data::date, v_periodo, v_utm, true, 'novo', v_corretor
  )
  returning id into v_id;
  return v_id;
end
$$;
revoke all on function public.registrar_lead(jsonb) from public;
grant execute on function public.registrar_lead(jsonb) to anon, authenticated, service_role;

-- ── 4. Conteúdo dos imóveis validado no banco ───────────────────────────────
-- Vídeo e tour 360°: só https dos serviços que o site incorpora.
create or replace function public.url_midia_valida(p_url text)
returns boolean
language sql immutable set search_path = ''
as $$
  select p_url is null or (
    length(p_url) <= 500
    and p_url ~* '^https://(www\.|m\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com|my\.matterport\.com|kuula\.co)/[^\s"''<>]*$'
  )
$$;

-- Fotos: lista de { arquivo, alt } com arquivo no Storage do Supabase ou na pasta /imoveis do site.
create or replace function public.fotos_validas(p_fotos jsonb)
returns boolean
language sql immutable set search_path = ''
as $$
  select jsonb_typeof(p_fotos) = 'array'
    and jsonb_array_length(p_fotos) <= 40
    and not exists (
      select 1 from jsonb_array_elements(p_fotos) f
      where jsonb_typeof(f) <> 'object'
         or coalesce(f ->> 'arquivo', '') !~ '^(https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/imoveis/|/imoveis/)[A-Za-z0-9/._-]+$'
         or length(coalesce(f ->> 'alt', '')) > 300
    )
$$;
revoke all on function public.url_midia_valida(text) from public, anon;
revoke all on function public.fotos_validas(jsonb) from public, anon;
grant execute on function public.url_midia_valida(text) to authenticated, service_role;
grant execute on function public.fotos_validas(jsonb) to authenticated, service_role;

-- ── 5. Localização: o banco guarda só a posição aproximada ──────────────────
-- O corretor cola a coordenada exata do Google Maps, mas ela ficaria pública na API (e com ela
-- o endereço do imóvel). Arredonda para 3 casas (~100 m), dentro do círculo de 150 m+ do mapa.
create or replace function public.arredondar_localizacao()
returns trigger
language plpgsql set search_path = ''
as $$
declare
  v_loc jsonb := new.dados -> 'localizacaoAproximada';
begin
  if jsonb_typeof(v_loc) = 'object'
     and jsonb_typeof(v_loc -> 'lat') = 'number'
     and jsonb_typeof(v_loc -> 'lng') = 'number' then
    new.dados := jsonb_set(new.dados, '{localizacaoAproximada}', v_loc || jsonb_build_object(
      'lat', round((v_loc ->> 'lat')::numeric, 3),
      'lng', round((v_loc ->> 'lng')::numeric, 3),
      'raioMetros', greatest(coalesce((v_loc ->> 'raioMetros')::numeric, 0), 150)::int
    ));
  end if;
  return new;
end
$$;
revoke all on function public.arredondar_localizacao() from public, anon, authenticated;

drop trigger if exists imoveis_localizacao on public.imoveis;
create trigger imoveis_localizacao before insert or update on public.imoveis
  for each row execute function public.arredondar_localizacao();

-- Arredonda os imóveis já cadastrados (antes das novas regras de conteúdo abaixo).
update public.imoveis set dados = dados
where case
  when jsonb_typeof(dados #> '{localizacaoAproximada,lat}') = 'number'
   and jsonb_typeof(dados #> '{localizacaoAproximada,lng}') = 'number'
  then (dados #>> '{localizacaoAproximada,lat}')::numeric <> round((dados #>> '{localizacaoAproximada,lat}')::numeric, 3)
    or (dados #>> '{localizacaoAproximada,lng}')::numeric <> round((dados #>> '{localizacaoAproximada,lng}')::numeric, 3)
  else false
end;

-- "not valid": vale para tudo que for gravado daqui em diante, sem travar registros antigos.
alter table public.imoveis drop constraint if exists imoveis_midia_segura;
alter table public.imoveis add constraint imoveis_midia_segura check (
  public.url_midia_valida(dados ->> 'videoUrl') and public.url_midia_valida(dados ->> 'tour360Url')
) not valid;
alter table public.imoveis drop constraint if exists imoveis_fotos_seguras;
alter table public.imoveis add constraint imoveis_fotos_seguras check (
  public.fotos_validas(fotos)
) not valid;
alter table public.imoveis drop constraint if exists imoveis_dados_tamanho;
alter table public.imoveis add constraint imoveis_dados_tamanho check (
  jsonb_typeof(dados) = 'object' and length(dados::text) <= 50000
) not valid;
