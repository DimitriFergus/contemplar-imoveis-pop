-- O Auth não aceita banned_until = infinity: bloqueio por 100 anos.
create or replace function public.equipe_ativar(p_id uuid, p_ativo boolean)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not public.eh_admin() then
    raise exception 'Apenas administradores (com o app autenticador) podem fazer isso.';
  end if;
  if p_id = auth.uid() then raise exception 'Você não pode desativar a si mesmo.'; end if;
  update public.perfis set ativo = p_ativo where id = p_id;
  update auth.users
     set banned_until = case when p_ativo then null else now() + interval '100 years' end
   where id = p_id;
  -- Desativado: encerra as sessões abertas.
  if not p_ativo then delete from auth.sessions where user_id = p_id; end if;
  return case when p_ativo then 'Acesso reativado.' else 'Acesso desativado.' end;
end
$$;
