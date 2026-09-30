-- Funções usadas pelos scripts de manutenção (npm run supabase:importar), só com a chave secreta.

-- Depois de importar imóveis com código definido (CP-0001...), a numeração continua do maior.
create or replace function public.ajustar_sequencia_codigo()
returns bigint
language sql volatile security definer set search_path = ''
as $$
  select setval(
    'public.imoveis_codigo_seq',
    greatest(coalesce((select max(substring(codigo from 4)::int) from public.imoveis), 0), 1),
    (select count(*) > 0 from public.imoveis)
  )
$$;

revoke all on function public.ajustar_sequencia_codigo() from public, anon, authenticated;
grant execute on function public.ajustar_sequencia_codigo() to service_role;
