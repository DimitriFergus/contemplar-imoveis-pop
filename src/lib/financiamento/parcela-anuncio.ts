import { FAIXAS, PREMISSAS_PARCELA_ANUNCIO, type FaixaFinanciamento } from '@/config/financiamento';
import { primeiraParcela } from './amortizacao';
import { taxaMensal } from './taxas';

export interface ParcelaAnuncio {
  parcela: number;
  taxaAnual: number;
  faixaReferencia: FaixaFinanciamento;
  valorFinanciado: number;
}

/** Faixa usada como referência de taxa: a primeira da lista cujo teto comporta o preço. */
export function faixaReferenciaAnuncio(
  preco: number,
  faixas: FaixaFinanciamento[] = FAIXAS,
): FaixaFinanciamento {
  const candidatas = PREMISSAS_PARCELA_ANUNCIO.faixasReferencia
    .map((id) => faixas.find((f) => f.id === id))
    .filter((f): f is FaixaFinanciamento => Boolean(f));
  const faixa =
    candidatas.find((f) => f.tetoImovel === null || preco <= f.tetoImovel) ?? candidatas.at(-1);
  if (!faixa) throw new Error('Faixas de referência do anúncio não configuradas');
  return faixa;
}

/**
 * "Parcelas a partir de": estimativa com as premissas de PREMISSAS_PARCELA_ANUNCIO.
 * No SAC usa a primeira parcela (a maior), para não subestimar o valor.
 */
export function parcelaEstimadaAnuncio(
  preco: number,
  faixas: FaixaFinanciamento[] = FAIXAS,
): ParcelaAnuncio {
  const p = PREMISSAS_PARCELA_ANUNCIO;
  const faixa = faixaReferenciaAnuncio(preco, faixas);
  const taxaAnual = p.usarTaxaMaxima ? faixa.taxaAnualMaxima : faixa.taxaAnualMinima;
  const i = taxaMensal(taxaAnual, faixa.tipoTaxa);
  const valorFinanciado = preco * (1 - p.percentualEntrada);
  return {
    parcela: primeiraParcela(valorFinanciado, i, p.prazoMeses, p.sistema),
    taxaAnual,
    faixaReferencia: faixa,
    valorFinanciado,
  };
}
