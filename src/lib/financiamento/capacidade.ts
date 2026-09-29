import {
  AVISO_SUBSIDIO,
  COMPROMETIMENTO_MAXIMO_RENDA,
  FAIXAS,
  PADROES_SIMULADOR,
  type FaixaFinanciamento,
  type SistemaAmortizacao,
} from '@/config/financiamento';
import { valorFinanciavelPorParcela } from './amortizacao';
import { faixaPorRenda } from './enquadramento';
import { taxaMensal } from './taxas';

/** Parcela máxima = renda × comprometimento máximo − outras dívidas mensais. */
export function parcelaMaximaPelaRenda(
  rendaFamiliar: number,
  outrasDividasMensais: number,
  comprometimento: number = COMPROMETIMENTO_MAXIMO_RENDA,
): number {
  return Math.max(0, rendaFamiliar * comprometimento - Math.max(0, outrasDividasMensais));
}

/** Poder de compra = min(valorFinanciável / cota, valorFinanciável + entrada + FGTS). Subsídio não entra. */
export function poderDeCompra(
  valorFinanciavel: number,
  entrada: number,
  fgts: number,
  cota: number,
): number {
  if (cota <= 0) throw new RangeError('Cota de financiamento inválida');
  return Math.min(
    valorFinanciavel / cota,
    valorFinanciavel + Math.max(0, entrada) + Math.max(0, fgts),
  );
}

export interface EntradaCabeNoBolso {
  rendaFamiliar: number;
  entrada: number;
  fgts: number;
  outrasDividasMensais: number;
  /** Parcela que a família considera confortável. Se menor que o máximo pela renda, prevalece. */
  parcelaDesejada?: number;
  prazoMeses: number;
  sistema: SistemaAmortizacao;
}

export interface ResultadoCabeNoBolso {
  faixa: FaixaFinanciamento;
  taxaAnual: number;
  parcelaMaximaPelaRenda: number;
  /** Parcela usada no cálculo: a menor entre a parcela máxima pela renda e a desejada. */
  parcelaConsiderada: number;
  valorFinanciavel: number;
  poderDeCompra: number;
  /** Poder de compra passa do teto do imóvel da faixa (o excedente seria SBPE, com outra taxa). */
  acimaDoTetoDaFaixa: boolean;
  avisoSubsidio: string | null;
}

export function calcularCabeNoBolso(
  e: EntradaCabeNoBolso,
  faixas: FaixaFinanciamento[] = FAIXAS,
): ResultadoCabeNoBolso {
  const faixa = faixaPorRenda(e.rendaFamiliar, faixas);
  const taxaAnual = PADROES_SIMULADOR.usarTaxaMaximaDaFaixa
    ? faixa.taxaAnualMaxima
    : faixa.taxaAnualMinima;
  const i = taxaMensal(taxaAnual, faixa.tipoTaxa);
  const maxRenda = parcelaMaximaPelaRenda(e.rendaFamiliar, e.outrasDividasMensais);
  const parcelaConsiderada =
    e.parcelaDesejada && e.parcelaDesejada > 0 ? Math.min(maxRenda, e.parcelaDesejada) : maxRenda;
  const valorFinanciavel = valorFinanciavelPorParcela(
    parcelaConsiderada,
    i,
    e.prazoMeses,
    e.sistema,
  );
  const poder = poderDeCompra(valorFinanciavel, e.entrada, e.fgts, faixa.cotaMaximaFinanciamento);
  return {
    faixa,
    taxaAnual,
    parcelaMaximaPelaRenda: maxRenda,
    parcelaConsiderada,
    valorFinanciavel,
    poderDeCompra: poder,
    acimaDoTetoDaFaixa: faixa.tetoImovel !== null && poder > faixa.tetoImovel,
    avisoSubsidio: faixa.podeTerSubsidio ? AVISO_SUBSIDIO : null,
  };
}

/** Um imóvel "cabe no bolso" quando o preço é menor ou igual ao poder de compra estimado. */
export function cabeNoBolso(precoImovel: number, poderDeCompraEstimado: number): boolean {
  return poderDeCompraEstimado > 0 && precoImovel <= poderDeCompraEstimado;
}
