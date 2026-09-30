import type { StatusPainel } from '@/lib/schemas/imovel';
import type { Foto, Imovel, TipoProximidade } from '@/types';

/**
 * Estado do formulário de imóvel do painel e conversão para o formato do schema.
 * Sem 'use client': usado tanto nas páginas (servidor) quanto no formulário (navegador).
 */

/** Estado do formulário: números ficam como texto enquanto a pessoa digita. */
export interface RascunhoImovel {
  titulo: string;
  descricao: string;
  tipo: Imovel['tipo'];
  situacao: Imovel['situacao'];
  previsaoEntrega: string;
  preco: string;
  condominioMensal: string;
  iptuAnual: string;
  cidade: string;
  uf: string;
  bairro: string;
  lat: string;
  lng: string;
  raioMetros: string;
  quartos: string;
  suites: string;
  banheiros: string;
  vagas: string;
  areaUtilM2: string;
  areaTerrenoM2: string;
  caracteristicas: string;
  lazer: string;
  condicoes: Imovel['condicoes'];
  fotos: Foto[];
  videoUrl: string;
  tour360Url: string;
  proximidades: { tipo: TipoProximidade; nome: string; distanciaMetros: string }[];
  destaque: boolean;
  status: StatusPainel;
  corretorResponsavelId: string;
}

const texto = (v: number | undefined) => (v === undefined ? '' : String(v));

export function rascunhoDeImovel(i: Imovel, status: StatusPainel): RascunhoImovel {
  return {
    titulo: i.titulo,
    descricao: i.descricao,
    tipo: i.tipo,
    situacao: i.situacao,
    previsaoEntrega: i.previsaoEntrega ?? '',
    preco: texto(i.preco),
    condominioMensal: texto(i.condominioMensal),
    iptuAnual: texto(i.iptuAnual),
    cidade: i.cidade,
    uf: i.uf,
    bairro: i.bairro,
    lat: texto(i.localizacaoAproximada.lat),
    lng: texto(i.localizacaoAproximada.lng),
    raioMetros: texto(i.localizacaoAproximada.raioMetros),
    quartos: texto(i.quartos),
    suites: texto(i.suites),
    banheiros: texto(i.banheiros),
    vagas: texto(i.vagas),
    areaUtilM2: texto(i.areaUtilM2),
    areaTerrenoM2: texto(i.areaTerrenoM2),
    caracteristicas: i.caracteristicas.join('\n'),
    lazer: i.lazer.join('\n'),
    condicoes: i.condicoes,
    fotos: i.fotos,
    videoUrl: i.videoUrl ?? '',
    tour360Url: i.tour360Url ?? '',
    proximidades: i.proximidades.map((p) => ({ ...p, distanciaMetros: String(p.distanciaMetros) })),
    destaque: i.destaque,
    status,
    corretorResponsavelId: i.corretorResponsavelId,
  };
}

export function rascunhoVazio(padrao: {
  cidade: string;
  uf: string;
  corretorId: string;
}): RascunhoImovel {
  return {
    titulo: '',
    descricao: '',
    tipo: 'casa',
    situacao: 'usado',
    previsaoEntrega: '',
    preco: '',
    condominioMensal: '',
    iptuAnual: '',
    cidade: padrao.cidade,
    uf: padrao.uf,
    bairro: '',
    lat: '',
    lng: '',
    raioMetros: '400',
    quartos: '2',
    suites: '0',
    banheiros: '1',
    vagas: '1',
    areaUtilM2: '',
    areaTerrenoM2: '',
    caracteristicas: '',
    lazer: '',
    condicoes: {
      aceitaMCMV: true,
      aceitaFGTS: true,
      aceitaSBPE: true,
      aceitaConsorcio: false,
      aceitaPermuta: false,
      entradaFacilitada: false,
    },
    fotos: [],
    videoUrl: '',
    tour360Url: '',
    proximidades: [],
    destaque: false,
    status: 'rascunho',
    corretorResponsavelId: padrao.corretorId,
  };
}

/**
 * Texto digitado → número (ou undefined). Aceita "R$ 180.000,00", "180.000", "180000",
 * "65,5 m²". Com `milhar`, "180.000" é cento e oitenta mil (ponto separando milhar);
 * latitude e longitude usam `milhar = false`, porque lá o ponto é a casa decimal.
 */
function numero(v: string, milhar = true): number | undefined {
  const limpo = v.replace(/R\$|m²|m2|\s/gi, '');
  if (!limpo) return undefined;
  let normalizado: string;
  if (/,\d+$/.test(limpo) && (milhar || !limpo.includes('.')))
    normalizado = limpo.replace(/\./g, '').replace(',', '.');
  else if (milhar && /^-?\d{1,3}(\.\d{3})+$/.test(limpo)) normalizado = limpo.replace(/\./g, '');
  else normalizado = limpo.replace(/,/g, '.');
  return Number(normalizado);
}

const lista = (v: string) =>
  v
    .split(/\n|;|\|/)
    .map((s) => s.trim())
    .filter(Boolean);

const opcional = (v: string) => (v.trim() ? v.trim() : undefined);

export function paraEntrada(r: RascunhoImovel) {
  return {
    titulo: r.titulo.trim(),
    descricao: r.descricao.trim(),
    tipo: r.tipo,
    situacao: r.situacao,
    previsaoEntrega: opcional(r.previsaoEntrega),
    preco: numero(r.preco),
    condominioMensal: numero(r.condominioMensal),
    iptuAnual: numero(r.iptuAnual),
    cidade: r.cidade.trim(),
    uf: r.uf.trim().toUpperCase(),
    bairro: r.bairro.trim(),
    localizacaoAproximada: {
      // Arredondado (~100 m) para não expor o endereço exato no site.
      lat: arredondar(numero(r.lat, false)),
      lng: arredondar(numero(r.lng, false)),
      raioMetros: numero(r.raioMetros),
    },
    quartos: numero(r.quartos),
    suites: numero(r.suites),
    banheiros: numero(r.banheiros),
    vagas: numero(r.vagas),
    areaUtilM2: numero(r.areaUtilM2),
    areaTerrenoM2: numero(r.areaTerrenoM2),
    caracteristicas: lista(r.caracteristicas),
    lazer: lista(r.lazer),
    condicoes: r.condicoes,
    fotos: r.fotos.map((f, n) => ({
      arquivo: f.arquivo,
      // Sem descrição digitada, usa o título (texto para leitores de tela e para o Google).
      alt: f.alt.trim() || `${r.titulo.trim() || 'Imóvel'} - foto ${n + 1}`,
    })),
    videoUrl: opcional(r.videoUrl),
    tour360Url: opcional(r.tour360Url),
    proximidades: r.proximidades.map((p) => ({
      tipo: p.tipo,
      nome: p.nome.trim(),
      distanciaMetros: numero(p.distanciaMetros),
    })),
    destaque: r.destaque,
    status: r.status,
    corretorResponsavelId: r.corretorResponsavelId,
  };
}

function arredondar(v: number | undefined) {
  return v === undefined || Number.isNaN(v) ? v : Math.round(v * 1000) / 1000;
}
