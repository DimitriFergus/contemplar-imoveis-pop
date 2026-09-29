import type { NextConfig } from 'next';

const desenvolvimento = process.env.NODE_ENV === 'development';

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
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // A imagem Open Graph dos anúncios lê a primeira foto do disco.
  outputFileTracingIncludes: {
    '/imoveis/[slug]/opengraph-image': ['./public/imoveis/**/*'],
  },
  async headers() {
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
  },
};

export default nextConfig;
