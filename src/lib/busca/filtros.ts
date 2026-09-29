import { z } from 'zod';
import { ORDENACOES, type Filtros, type Ordenacao } from './query';

export { ORDENACOES, paraQueryString, type Filtros, type Ordenacao } from './query';
import { LISTAGEM } from '@/config/site';
import {
  ROTULO_CONDICAO_CURTO,
  ROTULO_SITUACAO,
  ROTULO_TIPO_PLURAL,
  type ChaveCondicao,
} from '@/lib/rotulos';
import { SITUACOES_IMOVEL, TIPOS_IMOVEL } from '@/lib/constantes';
import { formatarBRL, formatarPrecoCurto } from '@/lib/utils/formatar';
import { slugify } from '@/lib/utils/slug';
import type { ImovelResumo } from '@/types';

const CONDICOES = [
  'aceitaMCMV',
  'aceitaFGTS',
  'aceitaSBPE',
  'aceitaConsorcio',
  'aceitaPermuta',
  'entradaFacilitada',
] as const satisfies readonly ChaveCondicao[];

/** Lista separada por vírgula → array de valores válidos (ignora os inválidos). */
function listaDe<T extends string>(valores: readonly T[]) {
  return z
    .string()
    .optional()
    .transform((v) =>
      (v ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter((s): s is T => (valores as readonly string[]).includes(s)),
    );
}

const numeroPositivo = z.coerce.number().positive().optional().catch(undefined);
const inteiroMinimo = z.coerce.number().int().min(1).max(10).optional().catch(undefined);

export const filtrosSchema = z.object({
  tipo: listaDe(TIPOS_IMOVEL),
  situacao: listaDe(SITUACOES_IMOVEL),
  bairro: z
    .string()
    .optional()
    .transform((v) => (v ? slugify(v) : undefined)),
  precoMin: numeroPositivo,
  precoMax: numeroPositivo,
  parcelaMax: numeroPositivo,
  quartos: inteiroMinimo,
  banheiros: inteiroMinimo,
  vagas: inteiroMinimo,
  areaMin: numeroPositivo,
  condicoes: listaDe(CONDICOES),
  /** Poder de compra do "Cabe no meu bolso" (apenas o valor calculado, sem dados pessoais). */
  bolso: numeroPositivo,
  ordem: z
    .enum(ORDENACOES.map((o) => o.valor) as [Ordenacao, ...Ordenacao[]])
    .optional()
    .catch(undefined),
  pagina: z.coerce.number().int().min(1).optional().catch(undefined),
  visao: z.enum(['lista', 'mapa']).optional().catch(undefined),
});

type ParamsEntrada = URLSearchParams | Record<string, string | string[] | undefined>;

export function lerFiltros(params: ParamsEntrada): Filtros {
  const bruto: Record<string, string> = {};
  if (params instanceof URLSearchParams) {
    params.forEach((valor, chave) => {
      if (valor !== '') bruto[chave] = bruto[chave] ? `${bruto[chave]},${valor}` : valor;
    });
  } else {
    for (const [chave, valor] of Object.entries(params)) {
      const texto = Array.isArray(valor) ? valor.join(',') : valor;
      if (texto) bruto[chave] = texto;
    }
  }
  const filtros: Filtros = filtrosSchema.parse(bruto);
  return filtros;
}

export function aplicarFiltros(imoveis: ImovelResumo[], f: Filtros): ImovelResumo[] {
  return imoveis.filter((i) => {
    if (i.status === 'vendido') return false;
    if (f.tipo.length && !f.tipo.includes(i.tipo)) return false;
    if (f.situacao.length && !f.situacao.includes(i.situacao)) return false;
    if (f.bairro && slugify(i.bairro) !== f.bairro) return false;
    if (f.precoMin && i.preco < f.precoMin) return false;
    if (f.precoMax && i.preco > f.precoMax) return false;
    if (f.parcelaMax && i.parcelaEstimada > f.parcelaMax) return false;
    if (f.quartos && i.quartos < f.quartos) return false;
    if (f.banheiros && i.banheiros < f.banheiros) return false;
    if (f.vagas && i.vagas < f.vagas) return false;
    if (f.areaMin && i.areaUtilM2 < f.areaMin) return false;
    if (f.condicoes.some((c) => !i.condicoes[c])) return false;
    if (f.bolso && i.preco > f.bolso) return false;
    return true;
  });
}

const pesoStatus = (i: ImovelResumo) => (i.status === 'disponivel' ? 0 : 1);

export function ordenar(imoveis: ImovelResumo[], ordem: Ordenacao = 'relevancia'): ImovelResumo[] {
  const lista = [...imoveis];
  const porData = (a: ImovelResumo, b: ImovelResumo) => b.publicadoEm.localeCompare(a.publicadoEm);
  const comparadores: Record<Ordenacao, (a: ImovelResumo, b: ImovelResumo) => number> = {
    relevancia: (a, b) =>
      pesoStatus(a) - pesoStatus(b) || Number(b.destaque) - Number(a.destaque) || porData(a, b),
    menor_preco: (a, b) => a.preco - b.preco,
    menor_parcela: (a, b) => a.parcelaEstimada - b.parcelaEstimada,
    recentes: porData,
    maior_area: (a, b) => b.areaUtilM2 - a.areaUtilM2,
  };
  return lista.sort((a, b) => comparadores[ordem](a, b) || a.codigo.localeCompare(b.codigo));
}

export interface Pagina<T> {
  itens: T[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export function paginar<T>(lista: T[], pagina = 1, porPagina = LISTAGEM.porPagina): Pagina<T> {
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const atual = Math.min(Math.max(1, pagina), totalPaginas);
  return {
    itens: lista.slice((atual - 1) * porPagina, atual * porPagina),
    total: lista.length,
    pagina: atual,
    totalPaginas,
  };
}

export interface ChipFiltro {
  chave: string;
  rotulo: string;
  /** Filtros sem este item (para montar o link de remoção). */
  semEste: Partial<Filtros>;
}

/** Filtros ativos como "chips" removíveis. `nomesBairros` traduz slug → nome. */
export function chipsAtivos(f: Filtros, nomesBairros: Record<string, string> = {}): ChipFiltro[] {
  const base: Partial<Filtros> = { ...f, pagina: undefined };
  const chips: ChipFiltro[] = [];
  const sem = (alteracao: Partial<Filtros>) => ({ ...base, ...alteracao });

  for (const t of f.tipo)
    chips.push({
      chave: `tipo-${t}`,
      rotulo: ROTULO_TIPO_PLURAL[t],
      semEste: sem({ tipo: f.tipo.filter((x) => x !== t) }),
    });
  for (const s of f.situacao)
    chips.push({
      chave: `situacao-${s}`,
      rotulo: ROTULO_SITUACAO[s],
      semEste: sem({ situacao: f.situacao.filter((x) => x !== s) }),
    });
  if (f.bairro)
    chips.push({
      chave: 'bairro',
      rotulo: nomesBairros[f.bairro] ?? f.bairro,
      semEste: sem({ bairro: undefined }),
    });
  if (f.precoMin)
    chips.push({
      chave: 'precoMin',
      rotulo: `A partir de ${formatarPrecoCurto(f.precoMin)}`,
      semEste: sem({ precoMin: undefined }),
    });
  if (f.precoMax)
    chips.push({
      chave: 'precoMax',
      rotulo: `Até ${formatarPrecoCurto(f.precoMax)}`,
      semEste: sem({ precoMax: undefined }),
    });
  if (f.parcelaMax)
    chips.push({
      chave: 'parcelaMax',
      rotulo: `Parcela até ${formatarBRL(f.parcelaMax).replace(',00', '')}`,
      semEste: sem({ parcelaMax: undefined }),
    });
  if (f.quartos)
    chips.push({
      chave: 'quartos',
      rotulo: `${f.quartos}+ quartos`,
      semEste: sem({ quartos: undefined }),
    });
  if (f.banheiros)
    chips.push({
      chave: 'banheiros',
      rotulo: `${f.banheiros}+ banheiros`,
      semEste: sem({ banheiros: undefined }),
    });
  if (f.vagas)
    chips.push({ chave: 'vagas', rotulo: `${f.vagas}+ vagas`, semEste: sem({ vagas: undefined }) });
  if (f.areaMin)
    chips.push({
      chave: 'areaMin',
      rotulo: `A partir de ${f.areaMin} m²`,
      semEste: sem({ areaMin: undefined }),
    });
  for (const c of f.condicoes)
    chips.push({
      chave: `condicao-${c}`,
      rotulo: ROTULO_CONDICAO_CURTO[c],
      semEste: sem({ condicoes: f.condicoes.filter((x) => x !== c) }),
    });
  if (f.bolso)
    chips.push({ chave: 'bolso', rotulo: 'Cabe no meu bolso', semEste: sem({ bolso: undefined }) });
  return chips;
}

export function contarFiltrosAtivos(f: Filtros): number {
  return chipsAtivos(f).length;
}
