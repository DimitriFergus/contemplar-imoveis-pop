import type {
  CondicoesPagamento,
  SituacaoImovel,
  StatusImovel,
  TipoImovel,
  TipoProximidade,
} from '@/types';

export const ROTULO_TIPO: Record<TipoImovel, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  casa_condominio: 'Casa em condomínio',
  duplex: 'Duplex',
  sobrado: 'Sobrado',
  kitnet: 'Kitnet',
};

export const ROTULO_TIPO_PLURAL: Record<TipoImovel, string> = {
  casa: 'Casas',
  apartamento: 'Apartamentos',
  casa_condominio: 'Casas em condomínio',
  duplex: 'Duplex',
  sobrado: 'Sobrados',
  kitnet: 'Kitnets',
};

/** Rotas de categoria por tipo: /imoveis/casas etc. */
export const SLUG_CATEGORIA_TIPO: Record<TipoImovel, string> = {
  casa: 'casas',
  apartamento: 'apartamentos',
  casa_condominio: 'casas-em-condominio',
  duplex: 'duplex',
  sobrado: 'sobrados',
  kitnet: 'kitnets',
};

export const ROTULO_SITUACAO: Record<SituacaoImovel, string> = {
  pronto: 'Pronto para morar',
  usado: 'Usado',
  na_planta: 'Na planta',
  em_construcao: 'Em construção',
};

export const ROTULO_STATUS: Record<StatusImovel, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  vendido: 'Vendido',
};

export const ROTULO_PROXIMIDADE: Record<TipoProximidade, string> = {
  escola: 'Escola',
  saude: 'Saúde',
  mercado: 'Mercado',
  transporte: 'Transporte',
  lazer: 'Lazer',
};

export type ChaveCondicao = keyof CondicoesPagamento;

export const ROTULO_CONDICAO: Record<ChaveCondicao, string> = {
  aceitaMCMV: 'Aceita MCMV',
  aceitaFGTS: 'Use seu FGTS',
  aceitaSBPE: 'Aceita financiamento SBPE',
  aceitaConsorcio: 'Aceita consórcio (carta contemplada)',
  aceitaPermuta: 'Aceita permuta',
  entradaFacilitada: 'Entrada facilitada',
};

/** Rótulo curto usado em filtros e chips. */
export const ROTULO_CONDICAO_CURTO: Record<ChaveCondicao, string> = {
  aceitaMCMV: 'MCMV',
  aceitaFGTS: 'FGTS',
  aceitaSBPE: 'SBPE',
  aceitaConsorcio: 'Consórcio',
  aceitaPermuta: 'Permuta',
  entradaFacilitada: 'Entrada facilitada',
};
