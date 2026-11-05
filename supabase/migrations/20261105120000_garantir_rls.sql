-- Garantia de segurança: RLS ligado em todas as tabelas do schema public e nenhuma
-- leitura/escrita direta de dados sensíveis pela chave pública (anon).
-- O site grava leads só pela função registrar_lead (security definer, com validação e limites).
-- Idempotente: pode rodar quantas vezes quiser.

-- 1) Liga o RLS em qualquer tabela do schema public que ainda esteja sem.
do $$
declare
  t record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
  loop
    execute format('alter table public.%I enable row level security', t.relname);
    raise notice 'RLS ligado em public.%', t.relname;
  end loop;
end
$$;

-- 2) Visitante anônimo não acessa tabelas sensíveis diretamente.
revoke all on public.leads, public.perfis, public.auditoria, public.limite_envios from anon;

-- 3) No site público, anônimo só lê imóveis publicados e corretores (as policies filtram).
revoke insert, update, delete, truncate, references, trigger
  on public.imoveis, public.corretores from anon;

-- 4) Tabelas criadas no futuro não ganham acesso automático do anon.
alter default privileges in schema public revoke all on tables from anon;
