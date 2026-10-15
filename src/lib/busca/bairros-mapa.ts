import { slugify } from '@/lib/utils/slug';
import type { ImovelResumo } from '@/types';

export interface BairroComLocalizacao {
  nome: string;
  slug: string;
  total: number;
  lat: number;
  lng: number;
}

/** Bairros com total de imóveis e centro aproximado (média das localizações), para o mapa de regiões. */
export function bairrosComLocalizacao(resumos: ImovelResumo[]): BairroComLocalizacao[] {
  const mapa = new Map<
    string,
    { nome: string; total: number; somaLat: number; somaLng: number }
  >();
  for (const r of resumos) {
    if (r.status === 'vendido') continue;
    const slug = slugify(r.bairro);
    const atual = mapa.get(slug) ?? { nome: r.bairro, total: 0, somaLat: 0, somaLng: 0 };
    atual.total++;
    atual.somaLat += r.localizacaoAproximada.lat;
    atual.somaLng += r.localizacaoAproximada.lng;
    mapa.set(slug, atual);
  }
  return [...mapa.entries()]
    .map(([slug, v]) => ({
      nome: v.nome,
      slug,
      total: v.total,
      lat: v.somaLat / v.total,
      lng: v.somaLng / v.total,
    }))
    .sort((a, b) => b.total - a.total);
}
