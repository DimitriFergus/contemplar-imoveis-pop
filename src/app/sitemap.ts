import type { MetadataRoute } from 'next';
import { SITE } from '@/config/site';
import { repositorio } from '@/lib/repositorio';
import { SLUG_CATEGORIA_TIPO } from '@/lib/rotulos';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [imoveis, bairros] = await Promise.all([repositorio.listar(), repositorio.bairros()]);
  const tipos = new Set(imoveis.map((i) => i.tipo));
  const agora = new Date();
  const estaticas = [
    '',
    '/imoveis',
    '/simulador',
    '/minha-casa-minha-vida',
    '/como-comprar',
    '/anuncie',
    '/sobre',
    '/contato',
    '/politica-de-privacidade',
    '/termos-de-uso',
  ];
  return [
    ...estaticas.map((p) => ({
      url: `${SITE.url}${p}`,
      lastModified: agora,
      changeFrequency: 'weekly' as const,
      priority: p === '' ? 1 : 0.7,
    })),
    ...[...tipos].map((t) => ({
      url: `${SITE.url}/imoveis/${SLUG_CATEGORIA_TIPO[t]}`,
      lastModified: agora,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...bairros.map((b) => ({
      url: `${SITE.url}/imoveis/bairro/${b.slug}`,
      lastModified: agora,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
    ...imoveis.map((i) => ({
      url: `${SITE.url}/imoveis/${i.slug}`,
      lastModified: new Date(i.atualizadoEm),
      changeFrequency: 'weekly' as const,
      priority: i.status === 'disponivel' ? 0.9 : 0.4,
      images: i.fotos.slice(0, 1).map((f) => `${SITE.url}${f.arquivo}`),
    })),
  ];
}
