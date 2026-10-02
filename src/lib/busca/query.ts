import { LISTAGEM } from '@/config/site';
import { SITUACOES_IMOVEL, TIPOS_IMOVEL } from '@/lib/constantes';
import {
  ROTULO_CONDICAO_CURTO,
  ROTULO_SITUACAO,
  ROTULO_TIPO_PLURAL,
  type ChaveCondicao,
} from '@/lib/rotulos';
import { formatarBRL, formatarPrecoCurto } from '@/lib/utils/formatar';
import { slugify } from '@/lib/utils/slug';
import type { ImovelResumo, SituacaoImovel, TipoImovel } from '@/types';

/**
 * Busca de imóveis sem dependências pesadas (roda no servidor e no navegador):
 * leitura dos filtros da URL, filtragem, ordenação, paginação e chips.
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

const CONDICOES = [
  'aceitaMCMV',
  'aceitaFGTS',
  'aceitaSBPE',
  'aceitaConsorcio',
  'aceitaPermuta',
  'entradaFacilitada',
] as const satisfies readonly ChaveCondicao[];

/** Lista separada por vírgula → só os valores válidos. */
function listaDe<T extends string>(texto: string | undefined, validos: readonly T[]): T[] {
  return (texto ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is T => (validos as readonly string[]).includes(s));
}

function numeroPositivo(texto: string | undefined): number | undefined {
  if (!texto) return undefined;
  const n = Number(texto);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function inteiroEntre(texto: string | undefined, min: number, max: number): number | undefined {
  const n = numeroPositivo(texto);
  return n !== undefined && Number.isInteger(n) && n >= min && n <= max ? n : undefined;
}

type ParamsEntrada = URLSearchParams | Record<string, string | string[] | undefined>;

/** Lê os filtros da URL, ignorando valores inválidos. */
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
  const ordens = ORDENACOES.map((o) => o.valor) as readonly string[];
  return {
    tipo: listaDe(bruto.tipo, TIPOS_IMOVEL),
    situacao: listaDe(bruto.situacao, SITUACOES_IMOVEL),
    bairro: bruto.bairro ? slugify(bruto.bairro) || undefined : undefined,
    precoMin: numeroPositivo(bruto.precoMin),
    precoMax: numeroPositivo(bruto.precoMax),
    parcelaMax: numeroPositivo(bruto.parcelaMax),
    quartos: inteiroEntre(bruto.quartos, 1, 10),
    banheiros: inteiroEntre(bruto.banheiros, 1, 10),
    vagas: inteiroEntre(bruto.vagas, 1, 10),
    areaMin: numeroPositivo(bruto.areaMin),
    condicoes: listaDe(bruto.condicoes, CONDICOES),
    bolso: numeroPositivo(bruto.bolso),
    ordem: bruto.ordem && ordens.includes(bruto.ordem) ? (bruto.ordem as Ordenacao) : undefined,
    pagina: inteiroEntre(bruto.pagina, 1, Number.MAX_SAFE_INTEGER),
    visao: bruto.visao === 'lista' || bruto.visao === 'mapa' ? bruto.visao : undefined,
  };
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

/**
 * Imóveis da esteira "Imóveis em destaque" da página inicial: todos os disponíveis cadastrados
 * pela equipe (não exemplo) entram, do mais novo para o mais antigo; os de exemplo só
 * completam a esteira até o mínimo de `minimo` cartões.
 */
export function selecionarDestaques(imoveis: ImovelResumo[], minimo = 8): ImovelResumo[] {
  const disponiveis = imoveis.filter((r) => r.status === 'disponivel');
  const reais = ordenar(
    disponiveis.filter((r) => !r.exemplo),
    'recentes',
  );
  const exemplos = ordenar(
    disponiveis.filter((r) => r.exemplo),
    'relevancia',
  );
  return [...reais, ...exemplos.slice(0, Math.max(0, minimo - reais.length))];
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

export interface ResultadoBusca extends Pagina<ImovelResumo> {
  /** Todos os resultados filtrados (sem paginação), usados no mapa. */
  todos: ImovelResumo[];
}

/** Filtra, ordena e pagina uma lista de imóveis. */
export function buscarEmLista(lista: ImovelResumo[], f: Filtros): ResultadoBusca {
  const todos = ordenar(aplicarFiltros(lista, f), f.ordem);
  return { ...paginar(todos, f.pagina ?? 1), todos };
}
