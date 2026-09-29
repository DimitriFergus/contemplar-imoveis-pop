import {
  AVISO_FORA_MCMV,
  FAIXAS,
  type FaixaFinanciamento,
  type IdFaixa,
} from '@/config/financiamento';

export function obterFaixa(id: IdFaixa, faixas: FaixaFinanciamento[] = FAIXAS): FaixaFinanciamento {
  const faixa = faixas.find((f) => f.id === id);
  if (!faixa) throw new Error(`Faixa ${id} não configurada`);
  return faixa;
}

/** A renda familiar bruta mensal define a faixa (limite máximo inclusivo). */
export function faixaPorRenda(
  rendaFamiliar: number,
  faixas: FaixaFinanciamento[] = FAIXAS,
): FaixaFinanciamento {
  if (!Number.isFinite(rendaFamiliar) || rendaFamiliar < 0) {
    throw new RangeError('Renda inválida');
  }
  // Compara em centavos para evitar erros de ponto flutuante nos limites (ex.: 3.200,01).
  const centavos = Math.round(rendaFamiliar * 100);
  const faixa = faixas.find(
    (f) => f.rendaMaxima === null || centavos <= Math.round(f.rendaMaxima * 100),
  );
  if (!faixa) throw new Error('Nenhuma faixa configurada para a renda informada');
  return faixa;
}

export interface EnquadramentoImovel {
  faixa: FaixaFinanciamento;
  dentroDoTeto: boolean;
  /** Mensagem a exibir quando o imóvel passa do teto da faixa do MCMV. */
  aviso: string | null;
}

/** Renda define a faixa; se o preço superar o teto dessa faixa, o financiamento seria pelo SBPE. */
export function enquadrarImovel(
  precoImovel: number,
  rendaFamiliar: number,
  faixas: FaixaFinanciamento[] = FAIXAS,
): EnquadramentoImovel {
  const faixa = faixaPorRenda(rendaFamiliar, faixas);
  const dentroDoTeto = faixa.tetoImovel === null || precoImovel <= faixa.tetoImovel;
  return {
    faixa,
    dentroDoTeto,
    aviso: dentroDoTeto || faixa.programa !== 'MCMV' ? null : AVISO_FORA_MCMV,
  };
}
