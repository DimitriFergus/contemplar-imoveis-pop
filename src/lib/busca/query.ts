import type { ChaveCondicao } from '@/lib/rotulos';
import type { SituacaoImovel, TipoImovel } from '@/types';

/**
 * Parte da busca que roda também no navegador (sem Zod): tipos, ordenações e a
 * serialização dos filtros na URL. A leitura/validação fica em ./filtros (servidor).
 */

export const ORDENACOES = [
  { valor: 'relevancia', rotulo: 'Mais relevantes' },
  { valor: 'menor_preco', rotulo: 'Menor preço' },
  { valor: 'menor_parcela', rotulo: 'Menor parcela' },
  { valor: 'recentes', rotulo: 'Mais recentes' },
  { valor: 'maior_area', rotulo: 'Maior área' },
] as const;

export type Ordenacao = (typeof ORDENACOES)[number]['valor'];

export interface Filtros {
  tipo: TipoImovel[];
  situacao: SituacaoImovel[];
  bairro?: string;
  precoMin?: number;
  precoMax?: number;
  parcelaMax?: number;
  quartos?: number;
  banheiros?: number;
  vagas?: number;
  areaMin?: number;
  condicoes: ChaveCondicao[];
  /** Poder de compra do "Cabe no meu bolso" (apenas o valor calculado, sem dados pessoais). */
  bolso?: number;
  ordem?: Ordenacao;
  pagina?: number;
  visao?: 'lista' | 'mapa';
}

/** Serializa para query string, omitindo valores vazios e padrões. */
export function paraQueryString(filtros: Partial<Filtros>): string {
  const p = new URLSearchParams();
  const ordem: (keyof Filtros)[] = [
    'tipo',
    'situacao',
    'bairro',
    'precoMin',
    'precoMax',
    'parcelaMax',
    'quartos',
    'banheiros',
    'vagas',
    'areaMin',
    'condicoes',
    'bolso',
    'ordem',
    'visao',
    'pagina',
  ];
  for (const chave of ordem) {
    const valor = filtros[chave];
    if (valor === undefined || valor === null) continue;
    if (Array.isArray(valor)) {
      if (valor.length > 0) p.set(chave, valor.join(','));
    } else if (chave === 'ordem' && valor === 'relevancia') continue;
    else if (chave === 'visao' && valor === 'lista') continue;
    else if (chave === 'pagina' && valor === 1) continue;
    else p.set(chave, String(chave === 'bolso' ? Math.round(Number(valor)) : valor));
  }
  const texto = p.toString().replace(/%2C/g, ',');
  return texto ? `?${texto}` : '';
}
