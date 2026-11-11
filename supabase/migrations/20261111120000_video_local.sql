-- Vídeo do imóvel: além do YouTube, aceita um arquivo MP4 na pasta /imoveis do próprio site
-- (mesma regra de src/lib/utils/url-segura.ts → videoPermitido). Tour 360° continua igual.
create or replace function public.video_valido(p_url text)
returns boolean
language sql immutable set search_path = ''
as $$
  select public.url_midia_valida(p_url) or (
    length(p_url) <= 500
    and position('..' in p_url) = 0
    and p_url ~ '^/imoveis/[A-Za-z0-9/._-]+\.mp4$'
  )
$$;
revoke all on function public.video_valido(text) from public, anon;
grant execute on function public.video_valido(text) to authenticated, service_role;

alter table public.imoveis drop constraint if exists imoveis_midia_segura;
alter table public.imoveis add constraint imoveis_midia_segura check (
  public.video_valido(dados ->> 'videoUrl') and public.url_midia_valida(dados ->> 'tour360Url')
) not valid;
