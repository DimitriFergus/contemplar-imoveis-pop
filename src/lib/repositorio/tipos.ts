import type { Filtros, Pagina } from '@/lib/busca/filtros';
import type { Corretor, Imovel, ImovelResumo } from '@/types';

export interface BairroComTotal {
  nome: string;
  slug: string;
  total: number;
}

export interface ResultadoBusca extends Pagina<ImovelResumo> {
  /** Todos os resultados filtrados (sem paginação), usados no mapa. */
  todos: ImovelResumo[];
}

/**
 * Contrato de acesso aos dados. As páginas dependem só desta interface.
 * Fase 1: implementação local (arquivos). Fase 2: Supabase ou CMS, sem mudar as páginas.
 */
export interface RepositorioImoveis {
  listar(): Promise<Imovel[]>;
  listarResumos(): Promise<ImovelResumo[]>;
  obterPorSlug(slug: string): Promise<Imovel | null>;
  obterResumosPorIds(ids: string[]): Promise<ImovelResumo[]>;
  buscar(filtros: Filtros): Promise<ResultadoBusca>;
  contar(filtros: Filtros): Promise<number>;
  destaques(limite: number): Promise<ImovelResumo[]>;
  semelhantes(imovel: Imovel, limite: number): Promise<ImovelResumo[]>;
  bairros(): Promise<BairroComTotal[]>;
  obterCorretor(id: string): Promise<Corretor | null>;
}
