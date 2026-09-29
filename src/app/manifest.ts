import type { MetadataRoute } from 'next';
import { BASE_PATH, SITE } from '@/config/site';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.nome,
    short_name: SITE.nomeCurto,
    description: SITE.descricao,
    start_url: `${BASE_PATH}/`,
    display: 'standalone',
    background_color: '#fffdf9',
    theme_color: '#041a4b',
    lang: 'pt-BR',
    icons: [
      { src: `${BASE_PATH}/icon.png`, sizes: '64x64', type: 'image/png' },
      { src: `${BASE_PATH}/apple-icon.png`, sizes: '180x180', type: 'image/png' },
    ],
  };
}
