import type { TipoTaxa } from '@/config/financiamento';

/**
 * Converte a taxa anual em taxa mensal.
 * - nominal: i = taxaAnual / 12
 * - efetiva: i = (1 + taxaAnual)^(1/12) - 1
 */
export function taxaMensal(taxaAnual: number, tipo: TipoTaxa): number {
  if (taxaAnual < 0) throw new RangeError('A taxa anual não pode ser negativa');
  return tipo === 'nominal' ? taxaAnual / 12 : Math.pow(1 + taxaAnual, 1 / 12) - 1;
}
