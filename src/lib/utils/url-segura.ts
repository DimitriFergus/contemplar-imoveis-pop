/**
 * Links que vêm do banco são dados de usuário: só aceitamos os formatos que o site sabe exibir.
 * As mesmas regras valem no banco (supabase/migrations/20261005120000_reforco_seguranca.sql).
 */

/** Vídeo e tour 360°: https dos serviços que o site incorpora. */
const MIDIA_PERMITIDA =
  /^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com|my\.matterport\.com|kuula\.co)\/[^\s"'<>]*$/i;

/** Fotos: Storage do Supabase (bucket "imoveis") ou a pasta /imoveis do próprio site. */
const FOTO_PERMITIDA =
  /^(https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/imoveis\/|\/imoveis\/)[A-Za-z0-9/._-]+$/;

export function urlMidiaPermitida(url: string | null | undefined): url is string {
  return typeof url === 'string' && url.length <= 500 && MIDIA_PERMITIDA.test(url);
}

export function fotoPermitida(arquivo: unknown): arquivo is string {
  return typeof arquivo === 'string' && FOTO_PERMITIDA.test(arquivo);
}
