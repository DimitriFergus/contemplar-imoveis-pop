import type { MetadataRoute } from 'next';
import { SITE } from '@/config/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.nome,
    short_name: SITE.nomeCurto,
    description: SITE.descricao,
    start_url: '/',
    display: 'standalone',
    background_color: '#fffdf9',
    theme_color: '#041a4b',
    lang: 'pt-BR',
    icons: [
      { src: '/icon.png', sizes: '64x64', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
