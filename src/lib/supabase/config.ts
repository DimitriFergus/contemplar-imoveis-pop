/**
 * Configuração pública do Supabase (URL + chave publicável). Pode ser usada no navegador.
 * Sem estas variáveis o site continua lendo os imóveis de src/data (modo arquivo).
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_CHAVE_PUBLICA =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  '';

export const SUPABASE_CONFIGURADO =
  Boolean(SUPABASE_URL && SUPABASE_CHAVE_PUBLICA) &&
  process.env.NEXT_PUBLIC_MODO_ESTATICO !== 'true';

/** Bucket do Storage com as fotos dos imóveis. */
export const BUCKET_FOTOS = 'imoveis';

/** Etiqueta de cache dos dados públicos (invalidada ao salvar no painel). */
export const TAG_IMOVEIS = 'imoveis';

export function urlPublicaFoto(caminho: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_FOTOS}/${caminho}`;
}

/** Caminho no bucket a partir da URL pública (null se a foto não estiver no Storage). */
export function caminhoDaFoto(url: string): string | null {
  const marca = `/storage/v1/object/public/${BUCKET_FOTOS}/`;
  const i = url.indexOf(marca);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marca.length));
}
