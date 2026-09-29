/**
 * Parâmetros de financiamento habitacional (Minha Casa, Minha Vida e SBPE).
 *
 * IMPORTANTE: valores de referência de setembro/2026. Devem ser revalidados no site da
 * Caixa (caixa.gov.br) e do Ministério das Cidades (gov.br/cidades) antes da publicação
 * e sempre que o programa for atualizado. Nenhum cálculo do site usa números fora deste arquivo.
 */

export type TipoTaxa = 'nominal' | 'efetiva';
export type SistemaAmortizacao = 'sac' | 'price';
export type IdFaixa = 'faixa1' | 'faixa2' | 'faixa3' | 'faixa4' | 'sbpe';

export interface FaixaFinanciamento {
  id: IdFaixa;
  nome: string;
  programa: 'MCMV' | 'SBPE';
  /** Renda familiar bruta mensal (área urbana). `rendaMaxima` null = sem limite. */
  rendaMinima: number;
  rendaMaxima: number | null;
  /** Teto do valor do imóvel na faixa. null = conforme regras do SFH. */
  tetoImovel: number | null;
  /** Faixa de taxa anual de referência (a taxa real depende de região e cotista FGTS). */
  taxaAnualMinima: number;
  taxaAnualMaxima: number;
  tipoTaxa: TipoTaxa;
  cotaMaximaFinanciamento: number;
  /** Faixas com possibilidade de subsídio (desconto) do governo, sujeito a análise oficial. */
  podeTerSubsidio: boolean;
  descricaoSimples: string;
}

export const REFERENCIA_FINANCIAMENTO = {
  dataReferencia: '2026-09',
  fonte:
    'Caixa Econômica Federal e Ministério das Cidades — regras do Programa Minha Casa, Minha Vida (área urbana) e condições de mercado do SBPE',
  observacao:
    'Valores aproximados para simulação ilustrativa. Revalidar no site da Caixa e do Ministério das Cidades antes da publicação. Taxas variam por região, cotista do FGTS e perfil do cliente.',
} as const;

/**
 * Teto de valor do imóvel para Faixas 1 e 2 no município base. Varia de R$ 210 mil a R$ 275 mil
 * conforme o município. A_DEFINIR após consulta oficial; usamos o menor valor como padrão
 * conservador enquanto `definido` for false.
 */
export const TETO_FAIXA_1_2_MUNICIPIO = { valor: 210_000, definido: false } as const;

export const COTA_MAXIMA_FINANCIAMENTO = 0.8;
export const COTA_MAXIMA_FINANCIAMENTO_FAIXA_4 = 0.8;
export const COTA_MAXIMA_FINANCIAMENTO_SBPE = 0.8;
export const COMPROMETIMENTO_MAXIMO_RENDA = 0.3;
export const PRAZO_MAXIMO_MESES = 420;
export const PRAZO_MINIMO_MESES = 60;

/**
 * Seguros obrigatórios (MIP e DFI) e taxa de administração estimados. São exibidos
 * separadamente da parcela de juros e amortização, sempre como estimativa.
 */
export const SEGUROS_E_TAXA_ADM_ESTIMADOS = {
  /** Percentual mensal aproximado sobre o valor financiado (MIP + DFI). */
  percentualMensalSobreFinanciado: 0.0003,
  /** Taxa de administração mensal estimada, em reais. */
  taxaAdministracaoMensal: 25,
  observacao:
    'Estimativa. MIP varia com a idade dos compradores, DFI com o valor do imóvel; a taxa de administração depende do banco.',
} as const;

export const FAIXAS: FaixaFinanciamento[] = [
  {
    id: 'faixa1',
    nome: 'Faixa 1',
    programa: 'MCMV',
    rendaMinima: 0,
    rendaMaxima: 3_200,
    tetoImovel: TETO_FAIXA_1_2_MUNICIPIO.valor,
    taxaAnualMinima: 0.04,
    taxaAnualMaxima: 0.045,
    tipoTaxa: 'nominal',
    cotaMaximaFinanciamento: COTA_MAXIMA_FINANCIAMENTO,
    podeTerSubsidio: true,
    descricaoSimples:
      'Para famílias com renda de até R$ 3.200 por mês. Tem as menores taxas de juros.',
  },
  {
    id: 'faixa2',
    nome: 'Faixa 2',
    programa: 'MCMV',
    rendaMinima: 3_200.01,
    rendaMaxima: 5_000,
    tetoImovel: TETO_FAIXA_1_2_MUNICIPIO.valor,
    taxaAnualMinima: 0.0475,
    taxaAnualMaxima: 0.07,
    tipoTaxa: 'nominal',
    cotaMaximaFinanciamento: COTA_MAXIMA_FINANCIAMENTO,
    podeTerSubsidio: true,
    descricaoSimples: 'Para famílias com renda de R$ 3.200,01 a R$ 5.000 por mês.',
  },
  {
    id: 'faixa3',
    nome: 'Faixa 3',
    programa: 'MCMV',
    rendaMinima: 5_000.01,
    rendaMaxima: 9_600,
    tetoImovel: 400_000,
    taxaAnualMinima: 0.0766,
    taxaAnualMaxima: 0.0816,
    tipoTaxa: 'nominal',
    cotaMaximaFinanciamento: COTA_MAXIMA_FINANCIAMENTO,
    podeTerSubsidio: false,
    descricaoSimples: 'Para famílias com renda de R$ 5.000,01 a R$ 9.600 por mês.',
  },
  {
    id: 'faixa4',
    nome: 'Faixa 4 (Classe Média)',
    programa: 'MCMV',
    rendaMinima: 9_600.01,
    rendaMaxima: 13_000,
    tetoImovel: 600_000,
    taxaAnualMinima: 0.1,
    taxaAnualMaxima: 0.1,
    tipoTaxa: 'nominal',
    cotaMaximaFinanciamento: COTA_MAXIMA_FINANCIAMENTO_FAIXA_4,
    podeTerSubsidio: false,
    descricaoSimples: 'Para famílias com renda de R$ 9.600,01 a R$ 13.000 por mês.',
  },
  {
    id: 'sbpe',
    nome: 'Fora do MCMV (SBPE)',
    programa: 'SBPE',
    rendaMinima: 13_000.01,
    rendaMaxima: null,
    tetoImovel: null,
    /** Taxa de mercado de referência (A_DEFINIR: revalidar com os bancos parceiros). */
    taxaAnualMinima: 0.115,
    taxaAnualMaxima: 0.125,
    tipoTaxa: 'efetiva',
    cotaMaximaFinanciamento: COTA_MAXIMA_FINANCIAMENTO_SBPE,
    podeTerSubsidio: false,
    descricaoSimples:
      'Financiamento com recursos da poupança, para rendas acima do MCMV ou imóveis acima do teto do programa.',
  },
];

/**
 * Premissas da "parcela a partir de" exibida nos cards e anúncios. Aparecem por extenso
 * na nota de rodapé (asterisco) de cada parcela.
 */
export const PREMISSAS_PARCELA_ANUNCIO = {
  percentualEntrada: 0.2,
  prazoMeses: PRAZO_MAXIMO_MESES,
  sistema: 'price' as SistemaAmortizacao,
  /**
   * Faixas usadas como referência de taxa, em ordem: usa-se a primeira cujo teto comporta
   * o preço do imóvel. Faixa 3 como referência é conservadora para o público popular.
   */
  faixasReferencia: ['faixa3', 'faixa4', 'sbpe'] as IdFaixa[],
  /** Usa a taxa máxima da faixa (estimativa conservadora). */
  usarTaxaMaxima: true,
};

/** Valores iniciais dos simuladores. */
export const PADROES_SIMULADOR = {
  prazoMeses: PRAZO_MAXIMO_MESES,
  sistema: 'sac' as SistemaAmortizacao,
  percentualEntrada: 0.2,
  valorImovelInicial: 200_000,
  opcoesPrazoMeses: [120, 180, 240, 300, 360, 420],
  /** No "Cabe no Meu Bolso", usa a taxa máxima da faixa (estimativa conservadora). */
  usarTaxaMaximaDaFaixa: true,
};

/** Regras gerais de uso do FGTS na compra (conferir no site da Caixa). */
export const REGRAS_FGTS = {
  anosMinimosTrabalhoCarteira: 3,
  observacao: 'Somando todos os períodos de trabalho com carteira assinada, em qualquer empresa.',
} as const;

export const AVISO_SIMULACAO =
  'Simulação ilustrativa com base em parâmetros de referência. Não constitui proposta de crédito. Taxas, prazos, subsídios, seguros e aprovação dependem da análise da instituição financeira e das regras vigentes do programa.';

export const AVISO_SUBSIDIO =
  'Pela sua renda, você pode ter direito a subsídio do governo; o valor depende de análise oficial.';

export const AVISO_FORA_MCMV = 'Este imóvel pode ser financiado fora do MCMV (SBPE).';
