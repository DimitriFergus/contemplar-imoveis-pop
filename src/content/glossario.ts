import { COMPROMETIMENTO_MAXIMO_RENDA, COTA_MAXIMA_FINANCIAMENTO } from '@/config/financiamento';
import { formatarPercentual } from '@/lib/utils/formatar';

export interface TermoGlossario {
  termo: string;
  explicacao: string;
}

/** Explicações em linguagem simples para termos técnicos (ícone "?" ao lado do termo). */
export const GLOSSARIO = {
  sac: {
    termo: 'SAC',
    explicacao:
      'Sistema de Amortização Constante. As parcelas começam mais altas e vão diminuindo todo mês. No total, você paga menos juros do que na Price.',
  },
  price: {
    termo: 'Tabela Price',
    explicacao:
      'Sistema em que as parcelas são iguais do começo ao fim (sem contar seguros e correção). A primeira parcela é menor que no SAC, mas o total de juros é maior.',
  },
  cota: {
    termo: 'Cota de financiamento',
    explicacao: `É a parte do valor do imóvel que o banco pode financiar. Hoje, em geral, até ${formatarPercentual(COTA_MAXIMA_FINANCIAMENTO)}. O restante é pago com entrada e/ou FGTS.`,
  },
  itbi: {
    termo: 'ITBI',
    explicacao:
      'Imposto sobre Transmissão de Bens Imóveis. É cobrado pela prefeitura quando o imóvel muda de dono. O valor e as regras variam por cidade.',
  },
  fgts: {
    termo: 'FGTS',
    explicacao:
      'Fundo de Garantia do Tempo de Serviço. Quem trabalha ou trabalhou com carteira assinada pode usar o saldo para dar entrada, amortizar ou quitar o imóvel, seguindo as regras da Caixa.',
  },
  mcmv: {
    termo: 'Minha Casa, Minha Vida (MCMV)',
    explicacao:
      'Programa do Governo Federal que facilita a compra do primeiro imóvel, com juros menores e, em algumas faixas de renda, desconto (subsídio).',
  },
  sbpe: {
    termo: 'SBPE',
    explicacao:
      'Financiamento com recursos da poupança, para quem tem renda acima do MCMV ou quer um imóvel acima do teto do programa. As taxas costumam ser maiores.',
  },
  subsidio: {
    termo: 'Subsídio',
    explicacao:
      'Desconto dado pelo governo em algumas faixas do MCMV. O valor depende da renda, da cidade e de análise oficial; não é garantido.',
  },
  comprometimento: {
    termo: 'Comprometimento de renda',
    explicacao: `Quanto da renda da família pode ir para a parcela. Os bancos costumam aceitar até ${formatarPercentual(COMPROMETIMENTO_MAXIMO_RENDA)} da renda bruta.`,
  },
  seguros: {
    termo: 'Seguros MIP e DFI',
    explicacao:
      'Seguros obrigatórios no financiamento: MIP (morte e invalidez) protege a família; DFI (danos físicos ao imóvel) protege a casa. São cobrados junto com a parcela.',
  },
  registro: {
    termo: 'Registro em cartório',
    explicacao:
      'Etapa que coloca o imóvel oficialmente no seu nome, no Cartório de Registro de Imóveis. Tem custo, que varia por estado.',
  },
  taxaNominal: {
    termo: 'Taxa nominal',
    explicacao: 'Taxa anual informada pelo banco que, dividida por 12, dá a taxa de cada mês.',
  },
  taxaEfetiva: {
    termo: 'Taxa efetiva',
    explicacao:
      'Taxa anual que já considera os juros sobre juros de cada mês. É um pouco maior que a nominal para o mesmo financiamento.',
  },
  poderCompra: {
    termo: 'Poder de compra',
    explicacao:
      'Estimativa do valor de imóvel que cabe no seu orçamento, somando o que o banco pode financiar pela sua renda com sua entrada e FGTS.',
  },
  cartaContemplada: {
    termo: 'Carta de consórcio contemplada',
    explicacao:
      'Crédito de consórcio já liberado para compra. Alguns vendedores aceitam como forma de pagamento.',
  },
  permuta: {
    termo: 'Permuta',
    explicacao:
      'Quando parte do pagamento é feita com outro bem, como um imóvel ou veículo, se o vendedor aceitar.',
  },
  amortizacao: {
    termo: 'Amortização',
    explicacao: 'É a parte da parcela que abate a dívida. A outra parte são os juros.',
  },
  avaliacao: {
    termo: 'Avaliação do imóvel',
    explicacao:
      'Vistoria feita por um engenheiro do banco para conferir o imóvel e definir o valor que pode ser financiado.',
  },
} satisfies Record<string, TermoGlossario>;

export type ChaveGlossario = keyof typeof GLOSSARIO;
