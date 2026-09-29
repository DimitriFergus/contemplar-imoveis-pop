/**
 * Custos de aquisição por município (ITBI e registro em cartório).
 *
 * Todos os valores são ESTIMATIVAS e devem ser confirmados na prefeitura e no cartório de
 * registro de imóveis do município. Alguns municípios têm alíquota reduzida de ITBI para a
 * parte financiada pelo SFH/MCMV: isso é parametrizado aqui e nunca presumido.
 */

export interface RegraITBI {
  /** Alíquota geral sobre o valor do imóvel (ou valor venal de referência, o que for maior). */
  aliquota: number;
  /**
   * Alíquota reduzida aplicada somente sobre o valor financiado pelo SFH/MCMV, quando a lei
   * municipal prevê. null = o município não tem redução (ou ainda não foi verificado).
   */
  aliquotaParteFinanciadaSFH: number | null;
  definido: boolean;
}

export interface CustosMunicipio {
  cidade: string;
  uf: string;
  itbi: RegraITBI;
  /** Percentual estimado de escritura/registro/certidões sobre o valor do imóvel. */
  registroCartorioEstimado: number;
  fonte: string;
  dataReferencia: string;
}

/** Usado quando o município do imóvel não tem regra cadastrada. */
export const CUSTOS_PADRAO: CustosMunicipio = {
  cidade: 'Padrão',
  uf: '--',
  itbi: { aliquota: 0.02, aliquotaParteFinanciadaSFH: null, definido: false },
  registroCartorioEstimado: 0.015,
  fonte: 'Estimativa genérica (A_DEFINIR: consultar prefeitura e cartório do município)',
  dataReferencia: '2026-09',
};

/** Regras por município. A_DEFINIR: cadastrar a cidade base com a lei municipal vigente. */
export const CUSTOS_POR_MUNICIPIO: CustosMunicipio[] = [
  {
    cidade: 'Cidade Exemplo',
    uf: 'EX',
    itbi: { aliquota: 0.02, aliquotaParteFinanciadaSFH: null, definido: false },
    registroCartorioEstimado: 0.015,
    fonte: 'Valores fictícios de demonstração (A_DEFINIR)',
    dataReferencia: '2026-09',
  },
];

export function custosDoMunicipio(cidade: string, uf: string): CustosMunicipio {
  const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  return (
    CUSTOS_POR_MUNICIPIO.find(
      (c) => normalizar(c.cidade) === normalizar(cidade) && normalizar(c.uf) === normalizar(uf),
    ) ?? CUSTOS_PADRAO
  );
}
