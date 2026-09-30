import type { BairroComTotal } from '@/lib/repositorio/tipos';
import { slugify } from '@/lib/utils/slug';
import type { ImovelResumo } from '@/types';

/** Bairros com total de imóveis (sem os vendidos), mesma regra do repositório. */
export function bairrosDe(resumos: ImovelResumo[]): BairroComTotal[] {
  const mapa = new Map<string, BairroComTotal>();
  for (const r of resumos) {
    if (r.status === 'vendido') continue;
    const slug = slugify(r.bairro);
    const atual = mapa.get(slug) ?? { nome: r.bairro, slug, total: 0 };
    atual.total++;
    mapa.set(slug, atual);
  }
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
