-- Gestão da equipe direto no banco (sem Edge Function): o painel chama estas funções com a
-- sessão de quem está logado e cada uma confere se é administrador com MFA (eh_admin()).
-- Rodam como security definer porque precisam escrever em auth.users.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists unaccent with schema extensions;

create or replace function public.equipe_criar(
  p_nome text,
  p_email text,
  p_senha text,
  p_papel text default 'corretor',
  p_creci text default '',
  p_whatsapp text default ''
)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_nome text := btrim(coalesce(p_nome, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_papel public.papel_usuario := case when p_papel = 'admin' then 'admin' else 'corretor' end;
  v_whats text := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');
  v_id uuid := gen_random_uuid();
  v_base text;
  v_corretor text;
  n int := 2;
begin
  if not public.eh_admin() then
    raise exception 'Apenas administradores (com o app autenticador) podem fazer isso.';
  end if;
  if length(v_nome) < 3 then raise exception 'Informe o nome completo'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido'; end if;
  if length(coalesce(p_senha, '')) < 10 then
    raise exception 'A senha provisória precisa ter pelo menos 10 caracteres';
  end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'Já existe um usuário com este e-mail.';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, reauthentication_token, phone_change, phone_change_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_senha, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nome', v_nome), now(), now(),
    '', '', '', '', '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  values (
    gen_random_uuid(), v_id, v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  -- Cartão público do corretor (nome, CRECI e WhatsApp nos anúncios), com id único.
  v_base := coalesce(nullif(regexp_replace(lower(extensions.unaccent(v_nome)), '[^a-z0-9]+', '-', 'g'), ''), 'corretor');
  v_base := btrim(v_base, '-');
  v_corretor := v_base;
  while exists (select 1 from public.corretores where id = v_corretor) loop
    v_corretor := v_base || '-' || n;
    n := n + 1;
  end loop;
  insert into public.corretores (id, nome, creci, whatsapp)
  values (
    v_corretor, v_nome,
    coalesce(nullif(btrim(coalesce(p_creci, '')), ''), 'A_DEFINIR'),
    case when v_whats = '' then 'A_DEFINIR'
         when v_whats like '55%' then v_whats else '55' || v_whats end
  );
  insert into public.perfis (id, nome, email, papel, corretor_id)
  values (v_id, v_nome, v_email, v_papel, v_corretor);

  return v_nome || ' já pode entrar no painel com o e-mail ' || v_email ||
         ' e a senha provisória. Peça para trocar a senha em "Minha conta".';
end
$$;

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
     set banned_until = case when p_ativo then null else 'infinity'::timestamptz end
   where id = p_id;
  -- Desativado: encerra as sessões abertas.
  if not p_ativo then delete from auth.sessions where user_id = p_id; end if;
  return case when p_ativo then 'Acesso reativado.' else 'Acesso desativado.' end;
end
$$;

create or replace function public.equipe_senha(p_id uuid, p_senha text)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not public.eh_admin() then
    raise exception 'Apenas administradores (com o app autenticador) podem fazer isso.';
  end if;
  if length(coalesce(p_senha, '')) < 10 then raise exception 'Mínimo de 10 caracteres.'; end if;
  update auth.users
     set encrypted_password = extensions.crypt(p_senha, extensions.gen_salt('bf')),
         updated_at = now()
   where id = p_id;
  if not found then raise exception 'Usuário não encontrado.'; end if;
  return 'Senha provisória definida. Envie para a pessoa por um canal seguro.';
end
$$;

revoke all on function public.equipe_criar(text, text, text, text, text, text) from public, anon;
revoke all on function public.equipe_ativar(uuid, boolean) from public, anon;
revoke all on function public.equipe_senha(uuid, text) from public, anon;
grant execute on function public.equipe_criar(text, text, text, text, text, text) to authenticated;
grant execute on function public.equipe_ativar(uuid, boolean) to authenticated;
grant execute on function public.equipe_senha(uuid, text) to authenticated;
