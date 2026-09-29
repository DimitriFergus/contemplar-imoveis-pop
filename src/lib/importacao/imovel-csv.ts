import {
  imovelSchema,
  SITUACOES_IMOVEL,
  STATUS_IMOVEL,
  TIPOS_IMOVEL,
  TIPOS_PROXIMIDADE,
} from '@/lib/schemas/imovel';
import { ROTULO_SITUACAO, ROTULO_TIPO } from '@/lib/rotulos';
import { lerNumeroBR } from '@/lib/utils/formatar';
import { slugify, slugImovel } from '@/lib/utils/slug';
import type { Imovel } from '@/types';

/**
 * Colunas da planilha `dados/imoveis.csv`, na ordem do modelo.
 * Listas usam "|" como separador. Sim/não aceita: sim, não, s, n, x (marcado), 1, 0.
 */
export const COLUNAS_CSV = [
  'codigo',
  'titulo',
  'descricao',
  'tipo',
  'situacao',
  'previsao_entrega',
  'preco',
  'condominio_mensal',
  'iptu_anual',
  'cidade',
  'uf',
  'bairro',
  'latitude',
  'longitude',
  'raio_metros',
  'quartos',
  'suites',
  'banheiros',
  'vagas',
  'area_util_m2',
  'area_terreno_m2',
  'caracteristicas',
  'lazer',
  'aceita_mcmv',
  'aceita_fgts',
  'aceita_sbpe',
  'aceita_consorcio',
  'aceita_permuta',
  'entrada_facilitada',
  'descricao_fotos',
  'video_url',
  'tour360_url',
  'proximidades',
  'destaque',
  'status',
  'corretor_id',
  'exemplo',
  'publicado_em',
  'atualizado_em',
] as const;

export type ColunaCSV = (typeof COLUNAS_CSV)[number];

const OBRIGATORIAS: ColunaCSV[] = [
  'codigo',
  'titulo',
  'descricao',
  'tipo',
  'situacao',
  'preco',
  'cidade',
  'uf',
  'bairro',
  'latitude',
  'longitude',
  'quartos',
  'banheiros',
  'area_util_m2',
  'status',
  'corretor_id',
];

/** Nomes amigáveis de campos para as mensagens de erro do schema. */
const CAMPO_PARA_COLUNA: Record<string, ColunaCSV> = {
  previsaoEntrega: 'previsao_entrega',
  condominioMensal: 'condominio_mensal',
  iptuAnual: 'iptu_anual',
  localizacaoAproximada: 'latitude',
  areaUtilM2: 'area_util_m2',
  areaTerrenoM2: 'area_terreno_m2',
  corretorResponsavelId: 'corretor_id',
  videoUrl: 'video_url',
  tour360Url: 'tour360_url',
  publicadoEm: 'publicado_em',
  atualizadoEm: 'atualizado_em',
  fotos: 'descricao_fotos',
};

export interface ResultadoLinha {
  imovel: Imovel | null;
  erros: string[];
  avisos: string[];
}

function lerSimNao(valor: string): boolean | null {
  const v = slugify(valor);
  if (['sim', 's', 'x', '1', 'true', 'verdadeiro'].includes(v)) return true;
  if (['nao', 'n', '0', 'false', 'falso', ''].includes(v)) return false;
  return null;
}

function lerLista(valor: string): string[] {
  return valor
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Aceita o código ("casa_condominio") ou o nome ("Casa em condomínio"). */
function lerEnum<T extends string>(
  valor: string,
  opcoes: readonly T[],
  rotulos?: Record<T, string>,
): T | null {
  const v = slugify(valor).replace(/-/g, '_');
  const direto = opcoes.find((o) => o === v);
  if (direto) return direto;
  if (rotulos) {
    const porRotulo = opcoes.find((o) => slugify(rotulos[o]).replace(/-/g, '_') === v);
    if (porRotulo) return porRotulo;
  }
  return null;
}

const arredondarCoordenada = (n: number | undefined) =>
  n === undefined ? n : Math.round(n * 1000) / 1000;

/** "2026-09-01" ou "01/09/2026" → ISO. */
function lerData(valor: string): string | null {
  const br = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const iso = br ? `${br[3]}-${br[2]}-${br[1]}` : valor;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

export function converterLinha(
  dados: Record<string, string>,
  linha: number,
  fotos: string[],
  hojeIso: string = new Date().toISOString(),
): ResultadoLinha {
  const codigo = (dados.codigo ?? '').toUpperCase();
  const prefixo = `Linha ${linha}${codigo ? `, ${codigo}` : ''}`;
  const erros: string[] = [];
  const avisos: string[] = [];
  const v = (c: ColunaCSV) => (dados[c] ?? '').trim();

  for (const c of OBRIGATORIAS) if (!v(c)) erros.push(`${prefixo}: campo '${c}' vazio`);

  const numero = (c: ColunaCSV, opcional = true): number | undefined => {
    if (!v(c)) return opcional ? undefined : Number.NaN;
    const n = lerNumeroBR(v(c));
    if (Number.isNaN(n)) erros.push(`${prefixo}: campo '${c}' não é um número ("${v(c)}")`);
    return n;
  };
  const simNao = (c: ColunaCSV): boolean => {
    const b = lerSimNao(v(c));
    if (b === null) {
      erros.push(`${prefixo}: campo '${c}' deve ser "sim" ou "não" ("${v(c)}")`);
      return false;
    }
    return b;
  };
  const data = (c: ColunaCSV): string => {
    if (!v(c)) return hojeIso;
    const d = lerData(v(c));
    if (!d) erros.push(`${prefixo}: campo '${c}' não é uma data válida ("${v(c)}")`);
    return d ?? hojeIso;
  };

  if (erros.length) return { imovel: null, erros, avisos };

  const tipo = lerEnum(v('tipo'), TIPOS_IMOVEL, ROTULO_TIPO);
  if (!tipo)
    erros.push(
      `${prefixo}: campo 'tipo' inválido ("${v('tipo')}"). Use: ${TIPOS_IMOVEL.join(', ')}`,
    );
  const situacao = lerEnum(v('situacao'), SITUACOES_IMOVEL, ROTULO_SITUACAO);
  if (!situacao)
    erros.push(
      `${prefixo}: campo 'situacao' inválido ("${v('situacao')}"). Use: ${SITUACOES_IMOVEL.join(', ')}`,
    );
  const status = lerEnum(v('status'), STATUS_IMOVEL);
  if (!status)
    erros.push(
      `${prefixo}: campo 'status' inválido ("${v('status')}"). Use: ${STATUS_IMOVEL.join(', ')}`,
    );

  const proximidades = lerLista(v('proximidades')).map((item) => {
    const [tipoP = '', nome = '', distancia = ''] = item.split(':').map((s) => s.trim());
    const tipoProx = lerEnum(tipoP, TIPOS_PROXIMIDADE);
    const metros = lerNumeroBR(distancia);
    if (!tipoProx || !nome || Number.isNaN(metros)) {
      erros.push(
        `${prefixo}: proximidade inválida ("${item}"). Formato: tipo: nome: distância em metros`,
      );
    }
    return { tipo: tipoProx ?? 'escola', nome, distanciaMetros: Math.round(metros) };
  });

  const descricoesFotos = lerLista(v('descricao_fotos'));
  const titulo = v('titulo');
  if (fotos.length === 0)
    avisos.push(`${prefixo}: nenhuma foto encontrada em public/imoveis/${codigo}/`);
  if (descricoesFotos.length < fotos.length)
    avisos.push(
      `${prefixo}: ${fotos.length - descricoesFotos.length} foto(s) sem descrição em 'descricao_fotos'; usada descrição genérica`,
    );

  const candidato = {
    id: codigo.toLowerCase(),
    codigo,
    slug: slugImovel(titulo, codigo),
    titulo,
    descricao: v('descricao'),
    tipo,
    situacao,
    previsaoEntrega: v('previsao_entrega') || undefined,
    preco: numero('preco', false),
    condominioMensal: numero('condominio_mensal'),
    iptuAnual: numero('iptu_anual'),
    cidade: v('cidade'),
    uf: v('uf').toUpperCase(),
    bairro: v('bairro'),
    // Coordenadas arredondadas (~100 m) para nunca expor o ponto exato do imóvel.
    localizacaoAproximada: {
      lat: arredondarCoordenada(numero('latitude', false)),
      lng: arredondarCoordenada(numero('longitude', false)),
      raioMetros: numero('raio_metros') ?? 400,
    },
    quartos: numero('quartos', false),
    suites: numero('suites') ?? 0,
    banheiros: numero('banheiros', false),
    vagas: numero('vagas') ?? 0,
    areaUtilM2: numero('area_util_m2', false),
    areaTerrenoM2: numero('area_terreno_m2'),
    caracteristicas: lerLista(v('caracteristicas')),
    lazer: lerLista(v('lazer')),
    condicoes: {
      aceitaMCMV: simNao('aceita_mcmv'),
      aceitaFGTS: simNao('aceita_fgts'),
      aceitaSBPE: simNao('aceita_sbpe'),
      aceitaConsorcio: simNao('aceita_consorcio'),
      aceitaPermuta: simNao('aceita_permuta'),
      entradaFacilitada: simNao('entrada_facilitada'),
    },
    fotos: fotos.map((arquivo, i) => ({
      arquivo,
      alt: descricoesFotos[i] ?? `Foto ${i + 1} do imóvel ${codigo}: ${titulo}`,
    })),
    videoUrl: v('video_url') || undefined,
    tour360Url: v('tour360_url') || undefined,
    proximidades,
    destaque: simNao('destaque'),
    status,
    corretorResponsavelId: v('corretor_id'),
    exemplo: simNao('exemplo'),
    publicadoEm: data('publicado_em'),
    atualizadoEm: data('atualizado_em'),
  };

  if (erros.length) return { imovel: null, erros, avisos };

  const resultado = imovelSchema.safeParse(candidato);
  if (!resultado.success) {
    for (const issue of resultado.error.issues) {
      const campo = String(issue.path[0] ?? '');
      const coluna = CAMPO_PARA_COLUNA[campo] ?? campo;
      erros.push(`${prefixo}: campo '${coluna}' ${issue.message}`);
    }
    return { imovel: null, erros, avisos };
  }
  return { imovel: resultado.data, erros, avisos };
}

/** Converte um imóvel de volta para uma linha da planilha (usado pelo gerador de exemplos). */
export function imovelParaLinha(i: Imovel): Record<ColunaCSV, string> {
  const sn = (b: boolean) => (b ? 'sim' : 'não');
  const num = (n?: number) => (n === undefined ? '' : String(n).replace('.', ','));
  return {
    codigo: i.codigo,
    titulo: i.titulo,
    descricao: i.descricao,
    tipo: i.tipo,
    situacao: i.situacao,
    previsao_entrega: i.previsaoEntrega ?? '',
    preco: String(i.preco),
    condominio_mensal: num(i.condominioMensal),
    iptu_anual: num(i.iptuAnual),
    cidade: i.cidade,
    uf: i.uf,
    bairro: i.bairro,
    latitude: num(i.localizacaoAproximada.lat),
    longitude: num(i.localizacaoAproximada.lng),
    raio_metros: String(i.localizacaoAproximada.raioMetros),
    quartos: String(i.quartos),
    suites: String(i.suites),
    banheiros: String(i.banheiros),
    vagas: String(i.vagas),
    area_util_m2: num(i.areaUtilM2),
    area_terreno_m2: num(i.areaTerrenoM2),
    caracteristicas: i.caracteristicas.join(' | '),
    lazer: i.lazer.join(' | '),
    aceita_mcmv: sn(i.condicoes.aceitaMCMV),
    aceita_fgts: sn(i.condicoes.aceitaFGTS),
    aceita_sbpe: sn(i.condicoes.aceitaSBPE),
    aceita_consorcio: sn(i.condicoes.aceitaConsorcio),
    aceita_permuta: sn(i.condicoes.aceitaPermuta),
    entrada_facilitada: sn(i.condicoes.entradaFacilitada),
    descricao_fotos: i.fotos.map((f) => f.alt).join(' | '),
    video_url: i.videoUrl ?? '',
    tour360_url: i.tour360Url ?? '',
    proximidades: i.proximidades
      .map((p) => `${p.tipo}: ${p.nome}: ${p.distanciaMetros}`)
      .join(' | '),
    destaque: sn(i.destaque),
    status: i.status,
    corretor_id: i.corretorResponsavelId,
    exemplo: sn(i.exemplo),
    publicado_em: i.publicadoEm.slice(0, 10),
    atualizado_em: i.atualizadoEm.slice(0, 10),
  };
}
