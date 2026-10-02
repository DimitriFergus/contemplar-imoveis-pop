import { LISTAGEM } from '@/config/site';
import {
  aplicarFiltros,
  buscarEmLista,
  selecionarDestaques,
  type Filtros,
} from '@/lib/busca/query';
import { slugify } from '@/lib/utils/slug';
import type { Corretor, Imovel, ImovelResumo } from '@/types';
import { paraResumo } from './resumo';
import type { RepositorioImoveis } from './tipos';

export interface DadosCarregados {
  imoveis: Imovel[];
  corretores: Corretor[];
}

interface Indice extends DadosCarregados {
  resumos: ImovelResumo[];
  porSlug: Map<string, Imovel>;
}

function indexar({ imoveis, corretores }: DadosCarregados): Indice {
  return {
    imoveis,
    corretores,
    resumos: imoveis.map(paraResumo),
    porSlug: new Map(imoveis.map((i) => [i.slug, i])),
  };
}

/**
 * Regras de busca, destaques e semelhantes aplicadas sobre a lista completa em memória.
 * Servem tanto para os arquivos locais quanto para o Supabase (o catálogo é pequeno).
 */
export function criarRepositorioEmMemoria(
  carregar: () => Promise<DadosCarregados>,
): RepositorioImoveis {
  const indices = new WeakMap<DadosCarregados, Indice>();
  const dados = async () => {
    const carregados = await carregar();
    let indice = indices.get(carregados);
    if (!indice) {
      indice = indexar(carregados);
      indices.set(carregados, indice);
    }
    return indice;
  };

  return {
    async listar() {
      return (await dados()).imoveis;
    },

    async listarResumos() {
      return (await dados()).resumos;
    },

    async obterPorSlug(slug) {
      return (await dados()).porSlug.get(slug) ?? null;
    },

    async obterResumosPorIds(ids) {
      const mapa = new Map((await dados()).resumos.map((r) => [r.id, r]));
      return ids.map((id) => mapa.get(id)).filter((r) => r !== undefined);
    },

    async buscar(filtros: Filtros) {
      return buscarEmLista((await dados()).resumos, filtros);
    },

    async contar(filtros) {
      return aplicarFiltros((await dados()).resumos, filtros).length;
    },

    async destaques(limite) {
      return selecionarDestaques((await dados()).resumos, limite);
    },

    async semelhantes(imovel, limite) {
      const { resumos } = await dados();
      const variacao = LISTAGEM.variacaoPrecoSemelhantes;
      const candidatos = resumos.filter(
        (r) =>
          r.id !== imovel.id &&
          r.status === 'disponivel' &&
          r.preco >= imovel.preco * (1 - variacao) &&
          r.preco <= imovel.preco * (1 + variacao),
      );
      const mesmoTipo = candidatos.filter((r) => r.tipo === imovel.tipo);
      const outros = candidatos.filter((r) => r.tipo !== imovel.tipo);
      const proximidadePreco = (a: { preco: number }, b: { preco: number }) =>
        Math.abs(a.preco - imovel.preco) - Math.abs(b.preco - imovel.preco);
      return [...mesmoTipo.sort(proximidadePreco), ...outros.sort(proximidadePreco)].slice(
        0,
        limite,
      );
    },

    async bairros() {
      const mapa = new Map<string, { nome: string; slug: string; total: number }>();
      for (const r of (await dados()).resumos) {
        if (r.status === 'vendido') continue;
        const slug = slugify(r.bairro);
        const atual = mapa.get(slug) ?? { nome: r.bairro, slug, total: 0 };
        atual.total++;
        mapa.set(slug, atual);
      }
      return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    },

    async obterCorretor(id) {
      return (await dados()).corretores.find((c) => c.id === id) ?? null;
    },
  };
}
