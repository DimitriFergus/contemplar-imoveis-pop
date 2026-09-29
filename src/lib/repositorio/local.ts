import 'server-only';
import { z } from 'zod';
import { LISTAGEM } from '@/config/site';
import { aplicarFiltros, buscarEmLista, ordenar, type Filtros } from '@/lib/busca/query';
import { corretorSchema, imovelSchema } from '@/lib/schemas/imovel';
import { slugify } from '@/lib/utils/slug';
import dadosCorretores from '@/data/corretores.json';
import dadosImoveis from '@/data/imoveis.json';
import type { Imovel } from '@/types';
import { paraResumo } from './resumo';
import type { RepositorioImoveis } from './tipos';

/**
 * Implementação local: lê o JSON gerado por `npm run importar` a partir de `dados/imoveis.csv`.
 * Os dados são validados novamente aqui para nunca publicar um imóvel inconsistente.
 */
const imoveis: Imovel[] = z.array(imovelSchema).parse(dadosImoveis);
const corretores = z.array(corretorSchema).parse(dadosCorretores);
const resumos = imoveis.map(paraResumo);
const porSlug = new Map(imoveis.map((i) => [i.slug, i]));

export const repositorioLocal: RepositorioImoveis = {
  async listar() {
    return imoveis;
  },

  async listarResumos() {
    return resumos;
  },

  async obterPorSlug(slug) {
    return porSlug.get(slug) ?? null;
  },

  async obterResumosPorIds(ids) {
    const mapa = new Map(resumos.map((r) => [r.id, r]));
    return ids.map((id) => mapa.get(id)).filter((r) => r !== undefined);
  },

  async buscar(filtros: Filtros) {
    return buscarEmLista(resumos, filtros);
  },

  async contar(filtros) {
    return aplicarFiltros(resumos, filtros).length;
  },

  async destaques(limite) {
    const lista = ordenar(
      resumos.filter((r) => r.status === 'disponivel'),
      'relevancia',
    );
    return lista.slice(0, limite);
  },

  async semelhantes(imovel, limite) {
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
    return [...mesmoTipo.sort(proximidadePreco), ...outros.sort(proximidadePreco)].slice(0, limite);
  },

  async bairros() {
    const mapa = new Map<string, { nome: string; slug: string; total: number }>();
    for (const r of resumos) {
      if (r.status === 'vendido') continue;
      const slug = slugify(r.bairro);
      const atual = mapa.get(slug) ?? { nome: r.bairro, slug, total: 0 };
      atual.total++;
      mapa.set(slug, atual);
    }
    return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  },

  async obterCorretor(id) {
    return corretores.find((c) => c.id === id) ?? null;
  },
};
