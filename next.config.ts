import type { NextConfig } from 'next';
import { montarCsp } from './src/config/seguranca';

const desenvolvimento = process.env.NODE_ENV === 'development';
/** Versão estática para o GitHub Pages (definida no workflow .github/workflows/pages.yml). */
const estatico = process.env.NEXT_PUBLIC_MODO_ESTATICO === 'true';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
/** Origem do Supabase (fotos no Storage, login e envio de fotos pelo painel). */
const supabase = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
      : null;
  } catch {
    return null;
  }
})();
const csp = montarCsp({ desenvolvimento });

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(estatico && { output: 'export' as const, basePath, trailingSlash: true }),
  images: {
    formats: ['image/avif', 'image/webp'],
    // Sem servidor de imagens no GitHub Pages.
    unoptimized: estatico,
    // Fotos enviadas pelo painel ficam no Storage do Supabase.
    remotePatterns: supabase
      ? [
          {
            protocol: supabase.protocol.replace(':', '') as 'https' | 'http',
            hostname: supabase.hostname,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
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
