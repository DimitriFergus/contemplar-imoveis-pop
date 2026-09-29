import {
  COMPROMETIMENTO_MAXIMO_RENDA,
  PADROES_SIMULADOR,
  type FaixaFinanciamento,
} from '@/config/financiamento';
import { primeiraParcela, valorFinanciavelPorParcela } from './amortizacao';
import { parcelaMaximaPelaRenda } from './capacidade';
import { taxaMensal } from './taxas';

export interface LimiteDaFaixa {
  /** Renda usada no cálculo: o topo da faixa (ou o piso, no SBPE, que não tem teto de renda). */
  rendaReferencia: number;
  taxaAnual: number;
  parcelaMaxima: number;
  valorFinanciavel: number;
  /** Maior preço de imóvel compatível com a renda, respeitando o teto da faixa. */
  precoMaximo: number;
  /** Entrada (dinheiro + FGTS) necessária para o imóvel de preço máximo. */
  entradaEstimada: number;
  limitadoPeloTeto: boolean;
}

const taxaDaFaixa = (faixa: FaixaFinanciamento) =>
  PADROES_SIMULADOR.usarTaxaMaximaDaFaixa ? faixa.taxaAnualMaxima : faixa.taxaAnualMinima;

/**
 * Quanto de imóvel uma família no topo da faixa consegue financiar, usando os padrões do
 * simulador (prazo e sistema) e a cota máxima de financiamento da faixa.
 */
export function limiteImovelPorFaixa(faixa: FaixaFinanciamento): LimiteDaFaixa {
  const renda = faixa.rendaMaxima ?? faixa.rendaMinima;
  const taxaAnual = taxaDaFaixa(faixa);
  const i = taxaMensal(taxaAnual, faixa.tipoTaxa);
  const parcelaMaxima = parcelaMaximaPelaRenda(renda, 0);
  const valorFinanciavel = valorFinanciavelPorParcela(
    parcelaMaxima,
    i,
    PADROES_SIMULADOR.prazoMeses,
    PADROES_SIMULADOR.sistema,
  );
  const pelaRenda = valorFinanciavel / faixa.cotaMaximaFinanciamento;
  const limitadoPeloTeto = faixa.tetoImovel !== null && pelaRenda > faixa.tetoImovel;
  const precoMaximo = limitadoPeloTeto ? (faixa.tetoImovel ?? pelaRenda) : pelaRenda;
  return {
    rendaReferencia: renda,
    taxaAnual,
    parcelaMaxima,
    valorFinanciavel,
    precoMaximo,
    entradaEstimada: precoMaximo * (1 - faixa.cotaMaximaFinanciamento),
    limitadoPeloTeto,
  };
}

/** Parcela de um imóvel na taxa da faixa e a renda familiar mínima sugerida para ela. */
export function condicoesNaFaixa(preco: number, faixa: FaixaFinanciamento) {
  const i = taxaMensal(taxaDaFaixa(faixa), faixa.tipoTaxa);
  const parcela = primeiraParcela(
    preco * faixa.cotaMaximaFinanciamento,
    i,
    PADROES_SIMULADOR.prazoMeses,
    PADROES_SIMULADOR.sistema,
  );
  return { parcela, rendaMinima: parcela / COMPROMETIMENTO_MAXIMO_RENDA };
}
