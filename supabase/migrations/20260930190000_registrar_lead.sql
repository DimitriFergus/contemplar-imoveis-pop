-- Leads enviados direto do navegador (site estático no GitHub Pages, sem servidor).
-- A tabela continua fechada para o público: a única porta de entrada é esta função, que
-- valida os dados, limita abusos e entrega o lead ao corretor do imóvel.

create or replace function public.registrar_lead(dados jsonb)
returns uuid
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_nome text := btrim(coalesce(dados ->> 'nome', ''));
  v_whats text := regexp_replace(coalesce(dados ->> 'whatsapp', ''), '\D', '', 'g');
  v_email text := nullif(btrim(coalesce(dados ->> 'email', '')), '');
  v_origem text := dados ->> 'origem';
  v_codigo text := nullif(upper(btrim(coalesce(dados ->> 'codigoImovel', ''))), '');
  v_mensagem text := nullif(btrim(coalesce(dados ->> 'mensagem', '')), '');
  v_renda text := nullif(dados ->> 'rendaFamiliarFaixa', '');
  v_data text := nullif(dados ->> 'dataVisitaPreferida', '');
  v_periodo text := nullif(dados ->> 'periodoPreferido', '');
  v_utm jsonb := dados -> 'utm';
  v_imovel_id uuid;
  v_corretor text;
  v_id uuid;
begin
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
  if coalesce((dados ->> 'consentimentoLGPD')::boolean, false) is not true then
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
  if v_periodo is not null and v_periodo not in ('manha', 'tarde', 'noite') then
    v_periodo := null;
  end if;
  if v_origem = 'agendamento_visita' and (v_data is null or v_periodo is null) then
    raise exception 'escolha data e período' using errcode = '22023';
  end if;
  if v_utm is not null and (jsonb_typeof(v_utm) <> 'object' or length(v_utm::text) > 600) then
    v_utm := null;
  end if;

  -- Limites contra abuso: por WhatsApp e no total.
  if (select count(*) from public.leads
      where whatsapp = v_whats and criado_em > now() - interval '10 minutes') >= 5 then
    raise exception 'muitas tentativas' using errcode = 'P0001', hint = 'limite';
  end if;
  if (select count(*) from public.leads where criado_em > now() - interval '1 minute') >= 60 then
    raise exception 'muitas tentativas' using errcode = 'P0001', hint = 'limite';
  end if;

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
