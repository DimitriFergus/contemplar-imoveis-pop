-- ═══════════════════════════════════════════════════════════════════════════
-- Contemplar Imóveis Pop · Fase 1.5 · Estrutura inicial
-- Perfis (admin/corretor), corretores, imóveis, leads (funil) e auditoria.
-- Todas as tabelas com RLS. Regra geral: corretor vê/edita só o que é dele;
-- admin (com MFA verificado, aal2) vê tudo.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Tipos ────────────────────────────────────────────────────────────────────
create type public.papel_usuario as enum ('admin', 'corretor');
create type public.status_imovel as enum ('rascunho', 'publicado', 'reservado', 'vendido');
create type public.etapa_lead as enum (
  'novo', 'em_atendimento', 'visita_agendada', 'proposta', 'ganho', 'perdido'
);

-- ── Corretores (dados públicos exibidos no anúncio) ─────────────────────────
create table public.corretores (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nome text not null check (length(nome) >= 2),
  creci text not null default 'A_DEFINIR',
  whatsapp text not null default 'A_DEFINIR',
  foto text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
comment on table public.corretores is 'Cartão público do corretor exibido nos anúncios.';

-- ── Perfis (usuários da área administrativa) ────────────────────────────────
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null,
  papel public.papel_usuario not null default 'corretor',
  corretor_id text references public.corretores (id) on update cascade on delete set null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create unique index perfis_corretor_unico on public.perfis (corretor_id) where corretor_id is not null;
comment on table public.perfis is 'Quem pode entrar em /admin e com qual papel.';

-- ── Imóveis ──────────────────────────────────────────────────────────────────
create sequence public.imoveis_codigo_seq start 1;

create table public.imoveis (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default ('CP-' || lpad(nextval('public.imoveis_codigo_seq')::text, 4, '0'))
    check (codigo ~ '^CP-\d{4}$'),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status public.status_imovel not null default 'rascunho',
  corretor_id text not null references public.corretores (id) on update cascade,
  destaque boolean not null default false,
  exemplo boolean not null default false,
  -- Conteúdo do anúncio, no mesmo formato validado pelo schema Zod (src/lib/schemas/imovel.ts).
  dados jsonb not null,
  -- Fotos em ordem: [{ arquivo (URL pública), alt }]
  fotos jsonb not null default '[]'::jsonb check (jsonb_typeof(fotos) = 'array'),
  -- Colunas derivadas para listar e filtrar no painel.
  titulo text generated always as (dados ->> 'titulo') stored,
  tipo text generated always as (dados ->> 'tipo') stored,
  bairro text generated always as (dados ->> 'bairro') stored,
  preco numeric(14, 2) generated always as ((dados ->> 'preco')::numeric) stored,
  publicado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid references auth.users (id) on delete set null default auth.uid(),
  atualizado_por uuid references auth.users (id) on delete set null default auth.uid()
);
create index imoveis_status_idx on public.imoveis (status);
create index imoveis_corretor_idx on public.imoveis (corretor_id);

-- ── Leads (CRM) ──────────────────────────────────────────────────────────────
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  origem text not null,
  nome text not null,
  whatsapp text not null,
  email text,
  renda_faixa text,
  codigo_imovel text,
  imovel_id uuid references public.imoveis (id) on delete set null,
  mensagem text,
  data_visita date,
  periodo_visita text,
  utm jsonb,
  consentimento_lgpd boolean not null default false,
  etapa public.etapa_lead not null default 'novo',
  corretor_id text references public.corretores (id) on update cascade on delete set null,
  motivo_perda text,
  observacoes text,
  atualizado_por uuid references auth.users (id) on delete set null
);
create index leads_etapa_idx on public.leads (etapa);
create index leads_corretor_idx on public.leads (corretor_id);
create index leads_criado_idx on public.leads (criado_em desc);

-- ── Auditoria ────────────────────────────────────────────────────────────────
create table public.auditoria (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  tabela text not null,
  registro_id uuid not null,
  usuario_id uuid references auth.users (id) on delete set null,
  usuario_nome text,
  campo text not null,
  valor_antigo text,
  valor_novo text
);
create index auditoria_registro_idx on public.auditoria (tabela, registro_id, criado_em desc);
create index auditoria_campo_idx on public.auditoria (campo, criado_em desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- Funções de permissão (security definer: leem perfis sem depender de RLS)
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.papel_atual()
returns public.papel_usuario
language sql stable security definer set search_path = ''
as $$
  select papel from public.perfis where id = auth.uid() and ativo
$$;

-- Admin só vale com MFA verificado na sessão (aal2).
create or replace function public.eh_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select papel = 'admin' from public.perfis where id = auth.uid() and ativo)
      and (auth.jwt() ->> 'aal') = 'aal2',
    false)
$$;

create or replace function public.meu_corretor_id()
returns text
language sql stable security definer set search_path = ''
as $$
  select corretor_id from public.perfis where id = auth.uid() and ativo
$$;

create or replace function public.pode_editar_imovel(p_imovel uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.imoveis i
    where i.id = p_imovel
      and (public.eh_admin() or (i.corretor_id is not null and i.corretor_id = public.meu_corretor_id()))
  )
$$;

-- Próximo código livre (CP-0000) para montar o slug antes de salvar.
create or replace function public.proximo_codigo()
returns text
language sql volatile security definer set search_path = ''
as $$
  select 'CP-' || lpad(nextval('public.imoveis_codigo_seq')::text, 4, '0')
$$;

revoke all on function public.proximo_codigo() from public, anon;
grant execute on function public.proximo_codigo() to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- Gatilhos
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.antes_de_salvar()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.atualizado_em := now();
    new.atualizado_por := coalesce(auth.uid(), new.atualizado_por);
    -- Campos de controle não podem ser alterados pela API.
    new.criado_em := old.criado_em;
    if tg_table_name = 'imoveis' then
      new.criado_por := old.criado_por;
      new.codigo := old.codigo;
      new.publicado_em := coalesce(old.publicado_em, new.publicado_em);
    end if;
  end if;
  if tg_table_name = 'imoveis' then
    if new.status <> 'rascunho' and new.publicado_em is null then
      new.publicado_em := now();
    end if;
  end if;
  return new;
end
$$;

create trigger imoveis_antes before insert or update on public.imoveis
  for each row execute function public.antes_de_salvar();
create trigger leads_antes before update on public.leads
  for each row execute function public.antes_de_salvar();

-- Registra campo a campo o que mudou (valores de "dados" são expandidos: preco, titulo...).
create or replace function public.registrar_auditoria()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  antigo jsonb;
  novo jsonb;
  chave text;
  nome_usuario text;
  ignorar text[] := array['atualizado_em', 'atualizado_por', 'criado_em', 'criado_por'];
begin
  select nome into nome_usuario from public.perfis where id = auth.uid();
  nome_usuario := coalesce(nome_usuario, case when auth.uid() is null then 'Sistema' end);

  if tg_op = 'INSERT' then
    insert into public.auditoria (tabela, registro_id, usuario_id, usuario_nome, campo)
    values (tg_table_name, new.id, auth.uid(), nome_usuario, '(criado)');
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.auditoria (tabela, registro_id, usuario_id, usuario_nome, campo)
    values (tg_table_name, old.id, auth.uid(), nome_usuario, '(excluído)');
    return old;
  end if;

  antigo := to_jsonb(old);
  novo := to_jsonb(new);
  if tg_table_name = 'imoveis' then
    -- As colunas derivadas repetem campos de "dados": comparamos só dentro de "dados".
    antigo := (antigo - 'dados' - 'titulo' - 'tipo' - 'bairro' - 'preco') || coalesce(old.dados, '{}'::jsonb);
    novo := (novo - 'dados' - 'titulo' - 'tipo' - 'bairro' - 'preco') || coalesce(new.dados, '{}'::jsonb);
  end if;

  for chave in
    select k from (select jsonb_object_keys(antigo) as k union select jsonb_object_keys(novo)) s
  loop
    continue when chave = any (ignorar);
    if (antigo -> chave) is distinct from (novo -> chave) then
      insert into public.auditoria (tabela, registro_id, usuario_id, usuario_nome, campo, valor_antigo, valor_novo)
      values (tg_table_name, new.id, auth.uid(), nome_usuario, chave,
              left(antigo ->> chave, 4000), left(novo ->> chave, 4000));
    end if;
  end loop;
  return new;
end
$$;

create trigger imoveis_auditoria after insert or update or delete on public.imoveis
  for each row execute function public.registrar_auditoria();
create trigger leads_auditoria after update or delete on public.leads
  for each row execute function public.registrar_auditoria();

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.corretores enable row level security;
alter table public.perfis enable row level security;
alter table public.imoveis enable row level security;
alter table public.leads enable row level security;
alter table public.auditoria enable row level security;

-- Corretores: cartão público legível por todos; só admin altera.
create policy "corretores: leitura pública" on public.corretores
  for select to anon, authenticated using (true);
create policy "corretores: admin insere" on public.corretores
  for insert to authenticated with check (public.eh_admin());
create policy "corretores: admin altera" on public.corretores
  for update to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "corretores: admin exclui" on public.corretores
  for delete to authenticated using (public.eh_admin());

-- Perfis: cada um vê o próprio; admin vê e gerencia todos.
create policy "perfis: ver o próprio" on public.perfis
  for select to authenticated using (id = auth.uid() or public.eh_admin());
create policy "perfis: admin insere" on public.perfis
  for insert to authenticated with check (public.eh_admin());
create policy "perfis: admin altera" on public.perfis
  for update to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "perfis: admin exclui" on public.perfis
  for delete to authenticated using (public.eh_admin() and id <> auth.uid());

-- Imóveis: o site público (anon) vê só o que não é rascunho.
create policy "imoveis: site público" on public.imoveis
  for select to anon using (status <> 'rascunho');
create policy "imoveis: equipe vê os seus" on public.imoveis
  for select to authenticated
  using (public.eh_admin() or corretor_id = public.meu_corretor_id());
create policy "imoveis: equipe cadastra os seus" on public.imoveis
  for insert to authenticated
  with check (public.eh_admin() or corretor_id = public.meu_corretor_id());
create policy "imoveis: equipe altera os seus" on public.imoveis
  for update to authenticated
  using (public.eh_admin() or corretor_id = public.meu_corretor_id())
  with check (public.eh_admin() or corretor_id = public.meu_corretor_id());
create policy "imoveis: exclusão" on public.imoveis
  for delete to authenticated
  using (public.eh_admin() or (corretor_id = public.meu_corretor_id() and status = 'rascunho'));

-- Leads: entram pelo servidor do site (chave secreta); equipe vê/atualiza os seus.
create policy "leads: equipe vê os seus" on public.leads
  for select to authenticated
  using (public.eh_admin() or corretor_id = public.meu_corretor_id());
create policy "leads: equipe atualiza os seus" on public.leads
  for update to authenticated
  using (public.eh_admin() or corretor_id = public.meu_corretor_id())
  with check (public.eh_admin() or corretor_id = public.meu_corretor_id());
create policy "leads: admin exclui (LGPD)" on public.leads
  for delete to authenticated using (public.eh_admin());

-- Auditoria: só leitura, e só do que a pessoa pode ver.
create policy "auditoria: leitura" on public.auditoria
  for select to authenticated
  using (
    public.eh_admin()
    or (tabela = 'imoveis' and public.pode_editar_imovel(registro_id))
    or (tabela = 'leads' and exists (
      select 1 from public.leads l where l.id = registro_id and l.corretor_id = public.meu_corretor_id()))
  );

-- Privilégios explícitos (não dependem dos padrões do projeto) e mínimos:
-- anon só lê imóveis e corretores; auditoria nunca é escrita pela API; leads entram só pelo servidor.
grant usage on schema public to anon, authenticated, service_role;
revoke all on public.corretores, public.perfis, public.imoveis, public.leads, public.auditoria
  from anon, authenticated;
grant select on public.imoveis, public.corretores to anon;
grant select, insert, update, delete on public.imoveis, public.corretores, public.perfis to authenticated;
grant select, update, delete on public.leads to authenticated;
grant select on public.auditoria to authenticated;
grant all on public.corretores, public.perfis, public.imoveis, public.leads, public.auditoria
  to service_role;
grant usage, select on sequence public.imoveis_codigo_seq to authenticated, service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- Storage: fotos dos imóveis (bucket público para leitura; escrita por RLS)
-- Caminho dos arquivos: <id do imóvel>/<nome>.webp
-- ═══════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imoveis', 'imoveis', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.imovel_da_pasta(p_nome text)
returns uuid
language plpgsql stable set search_path = ''
as $$
begin
  return (storage.foldername(p_nome))[1]::uuid;
exception when others then
  return null;
end
$$;

create policy "fotos: enviar para imóvel próprio" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'imoveis' and public.pode_editar_imovel(public.imovel_da_pasta(name)));
create policy "fotos: alterar de imóvel próprio" on storage.objects
  for update to authenticated
  using (bucket_id = 'imoveis' and public.pode_editar_imovel(public.imovel_da_pasta(name)));
create policy "fotos: apagar de imóvel próprio" on storage.objects
  for delete to authenticated
  using (bucket_id = 'imoveis' and public.pode_editar_imovel(public.imovel_da_pasta(name)));
create policy "fotos: listar de imóvel próprio" on storage.objects
  for select to authenticated
  using (bucket_id = 'imoveis' and public.pode_editar_imovel(public.imovel_da_pasta(name)));
