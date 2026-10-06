/**
 * Política de segurança de conteúdo (CSP): só o próprio site, tiles do OpenStreetMap, o Supabase
 * e os vídeos/tours incorporados. Usada como cabeçalho HTTP (servidor) e como <meta> na versão
 * estática do GitHub Pages, que não permite configurar cabeçalhos.
 */
export function montarCsp({
  desenvolvimento = false,
  comoMeta = false,
}: { desenvolvimento?: boolean; comoMeta?: boolean } = {}): string {
  const origemSupabase = (() => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      return url ? ` ${new URL(url).origin}` : '';
    } catch {
      return '';
    }
  })();
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${desenvolvimento ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://tile.openstreetmap.org${origemSupabase}`,
    "font-src 'self'",
    `connect-src 'self'${origemSupabase}${desenvolvimento ? ' ws: wss:' : ''}`,
    'frame-src https://www.google.com https://www.youtube-nocookie.com https://my.matterport.com https://kuula.co',
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    // frame-ancestors não vale em <meta>: na versão estática o painel se protege por script.
    ...(comoMeta ? [] : ["frame-ancestors 'none'"]),
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}
