import type { NextConfig } from 'next';

const desenvolvimento = process.env.NODE_ENV === 'development';
/** Versão estática para o GitHub Pages (definida no workflow .github/workflows/pages.yml). */
const estatico = process.env.NEXT_PUBLIC_MODO_ESTATICO === 'true';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Política de segurança de conteúdo: só o próprio site, tiles do OpenStreetMap e vídeos incorporados. */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${desenvolvimento ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tile.openstreetmap.org",
  "font-src 'self'",
  `connect-src 'self'${desenvolvimento ? ' ws: wss:' : ''}`,
  'frame-src https://www.youtube-nocookie.com https://my.matterport.com https://kuula.co',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(estatico && { output: 'export' as const, basePath, trailingSlash: true }),
  images: {
    formats: ['image/avif', 'image/webp'],
    // Sem servidor de imagens no GitHub Pages.
    unoptimized: estatico,
  },
  // A imagem Open Graph dos anúncios lê a primeira foto do disco.
  outputFileTracingIncludes: {
    '/imoveis/[slug]/opengraph-image': ['./public/imoveis/**/*'],
  },
  // Cabeçalhos HTTP só existem com servidor (Vercel/Node); o GitHub Pages não os aplica.
  ...(!estatico && { headers: cabecalhos }),
};

async function cabecalhos() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'Content-Security-Policy', value: csp },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(), payment=()',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ],
    },
    {
      source: '/imoveis/:codigo/:arquivo(.*\\.(?:svg|jpg|jpeg|png|webp|avif))',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
      ],
    },
  ];
}

export default nextConfig;
