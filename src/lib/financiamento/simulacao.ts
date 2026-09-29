import {
  COTA_MAXIMA_FINANCIAMENTO,
  SEGUROS_E_TAXA_ADM_ESTIMADOS,
  type SistemaAmortizacao,
  type TipoTaxa,
} from '@/config/financiamento';
import {
  resumoAnual,
  tabelaAmortizacao,
  type LinhaAmortizacao,
  type ResumoAnual,
} from './amortizacao';
import { taxaMensal } from './taxas';

export interface EntradaFinanciamento {
  valorImovel: number;
  entrada: number;
  fgts: number;
  taxaAnual: number;
  tipoTaxa: TipoTaxa;
  prazoMeses: number;
  sistema: SistemaAmortizacao;
  cotaMaxima?: number;
}

export interface ValorFinanciado {
  /** PV = preço − entrada − FGTS (nunca negativo). */
  solicitado: number;
  /** PV efetivamente financiado, limitado a preço × cota. */
  financiado: number;
  limitadoPelaCota: boolean;
  /** Recursos próprios mínimos (entrada + FGTS) exigidos pela cota de financiamento. */
  entradaMinimaNecessaria: number;
}

export function calcularValorFinanciado(
  valorImovel: number,
  entrada: number,
  fgts: number,
  cotaMaxima: number = COTA_MAXIMA_FINANCIAMENTO,
): ValorFinanciado {
  if (valorImovel < 0 || entrada < 0 || fgts < 0) {
    throw new RangeError('Valores não podem ser negativos');
  }
  const solicitado = Math.max(0, valorImovel - entrada - fgts);
  const limite = valorImovel * cotaMaxima;
  return {
    solicitado,
    financiado: Math.min(solicitado, limite),
    limitadoPelaCota: solicitado > limite,
    entradaMinimaNecessaria: valorImovel - limite,
  };
}

/** Seguros (MIP/DFI) e taxa de administração estimados, exibidos à parte da parcela. */
export function segurosEstimadosMensais(valorFinanciado: number): number {
  if (valorFinanciado <= 0) return 0;
  return (
    valorFinanciado * SEGUROS_E_TAXA_ADM_ESTIMADOS.percentualMensalSobreFinanciado +
    SEGUROS_E_TAXA_ADM_ESTIMADOS.taxaAdministracaoMensal
  );
}

export interface ResultadoFinanciamento {
  valores: ValorFinanciado;
  taxaMensal: number;
  primeiraParcela: number;
  ultimaParcela: number;
  totalJuros: number;
  totalPago: number;
  segurosEstimadosMensais: number;
  tabela: LinhaAmortizacao[];
  resumoAnual: ResumoAnual[];
}

export function simularFinanciamento(e: EntradaFinanciamento): ResultadoFinanciamento {
  const valores = calcularValorFinanciado(e.valorImovel, e.entrada, e.fgts, e.cotaMaxima);
  const i = taxaMensal(e.taxaAnual, e.tipoTaxa);
  const tabela =
    valores.financiado > 0 ? tabelaAmortizacao(valores.financiado, i, e.prazoMeses, e.sistema) : [];
  const totalJuros = tabela.reduce((s, l) => s + l.juros, 0);
  return {
    valores,
    taxaMensal: i,
    primeiraParcela: tabela[0]?.parcela ?? 0,
    ultimaParcela: tabela[tabela.length - 1]?.parcela ?? 0,
    totalJuros,
    totalPago: valores.financiado + totalJuros,
    segurosEstimadosMensais: segurosEstimadosMensais(valores.financiado),
    tabela,
    resumoAnual: resumoAnual(tabela),
  };
}
