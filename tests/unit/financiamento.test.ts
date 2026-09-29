import { describe, expect, it } from 'vitest';
import {
  COMPROMETIMENTO_MAXIMO_RENDA,
  COTA_MAXIMA_FINANCIAMENTO,
  FAIXAS,
  PREMISSAS_PARCELA_ANUNCIO,
} from '@/config/financiamento';
import {
  cabeNoBolso,
  calcularCabeNoBolso,
  calcularCustoAquisicao,
  calcularValorFinanciado,
  enquadrarImovel,
  faixaPorRenda,
  parcelaEstimadaAnuncio,
  parcelaMaximaPelaRenda,
  parcelaPrice,
  parcelaSac,
  poderDeCompra,
  primeiraParcela,
  resumoAnual,
  simularFinanciamento,
  tabelaAmortizacao,
  taxaMensal,
  valorFinanciavelPorParcela,
} from '@/lib/financiamento';

/**
 * Caso de controle: PV R$ 200.000, taxa EFETIVA de 8,16% a.a., 420 meses.
 * Valores esperados calculados com aritmética decimal de 50 dígitos (Python `decimal`),
 * conferidos contra a fórmula de calculadora financeira (HP 12C: n=420, i=0,65582%, PV=200000):
 *   i mensal      = 0,655819693655928%
 *   Price         = R$ 1.401,65 (1401,65268273214)
 *   SAC 1ª        = R$ 1.787,83 (1787,82986350233)
 *   SAC última    = R$ 479,31   (479,313427112647)
 *   Juros Price   = R$ 388.694,13
 *   Juros SAC     = R$ 276.100,09
 */
const CONTROLE = { pv: 200_000, taxaAnual: 0.0816, n: 420 };

describe('taxaMensal', () => {
  it('converte taxa nominal dividindo por 12', () => {
    expect(taxaMensal(0.12, 'nominal')).toBeCloseTo(0.01, 12);
  });

  it('converte taxa efetiva pela raiz 12ª', () => {
    expect(taxaMensal(CONTROLE.taxaAnual, 'efetiva')).toBeCloseTo(0.0065581969365593, 13);
    expect(taxaMensal(0.1268250301319698, 'efetiva')).toBeCloseTo(0.01, 12);
  });

  it('rejeita taxa negativa', () => {
    expect(() => taxaMensal(-0.01, 'nominal')).toThrow(RangeError);
  });
});

describe('Price — caso de controle', () => {
  const i = taxaMensal(CONTROLE.taxaAnual, 'efetiva');

  it('parcela de R$ 1.401,65', () => {
    expect(parcelaPrice(CONTROLE.pv, i, CONTROLE.n)).toBeCloseTo(1401.6526827321, 6);
  });

  it('tabela zera o saldo e soma juros esperados', () => {
    const tabela = tabelaAmortizacao(CONTROLE.pv, i, CONTROLE.n, 'price');
    expect(tabela).toHaveLength(420);
    expect(tabela.at(-1)?.saldoDevedor).toBe(0);
    const amortizado = tabela.reduce((s, l) => s + l.amortizacao, 0);
    expect(amortizado).toBeCloseTo(CONTROLE.pv, 4);
    const juros = tabela.reduce((s, l) => s + l.juros, 0);
    expect(juros).toBeCloseTo(388694.1267474993, 3);
    // Parcelas iguais
    expect(tabela[0]?.parcela).toBeCloseTo(tabela[419]?.parcela ?? 0, 6);
  });

  it('com taxa zero divide o valor pelo prazo', () => {
    expect(parcelaPrice(12_000, 0, 12)).toBe(1_000);
  });
});

describe('SAC — caso de controle', () => {
  const i = taxaMensal(CONTROLE.taxaAnual, 'efetiva');

  it('primeira parcela de R$ 1.787,83 e última de R$ 479,31', () => {
    expect(parcelaSac(CONTROLE.pv, i, CONTROLE.n, 1)).toBeCloseTo(1787.8298635023, 6);
    expect(parcelaSac(CONTROLE.pv, i, CONTROLE.n, CONTROLE.n)).toBeCloseTo(479.3134271126, 6);
  });

  it('tabela tem amortização constante e juros totais esperados', () => {
    const tabela = tabelaAmortizacao(CONTROLE.pv, i, CONTROLE.n, 'sac');
    expect(tabela[0]?.amortizacao).toBeCloseTo(200_000 / 420, 8);
    expect(tabela[200]?.amortizacao).toBeCloseTo(200_000 / 420, 8);
    expect(tabela.at(-1)?.saldoDevedor).toBe(0);
    expect(tabela.reduce((s, l) => s + l.juros, 0)).toBeCloseTo(276100.0910291457, 3);
    expect(tabela[0]?.parcela).toBeCloseTo(primeiraParcela(CONTROLE.pv, i, CONTROLE.n, 'sac'), 8);
  });

  it('rejeita mês fora do prazo', () => {
    expect(() => parcelaSac(1000, 0.01, 10, 11)).toThrow(RangeError);
  });
});

describe('valorFinanciavelPorParcela', () => {
  const i = taxaMensal(CONTROLE.taxaAnual, 'efetiva');

  it('é o inverso da Price', () => {
    expect(valorFinanciavelPorParcela(1401.6526827321, i, 420, 'price')).toBeCloseTo(200_000, 3);
  });

  it('no SAC usa a primeira parcela como limitante', () => {
    expect(valorFinanciavelPorParcela(1787.8298635023, i, 420, 'sac')).toBeCloseTo(200_000, 3);
  });

  it('retorna zero para parcela não positiva', () => {
    expect(valorFinanciavelPorParcela(0, i, 420, 'price')).toBe(0);
    expect(valorFinanciavelPorParcela(-10, i, 420, 'sac')).toBe(0);
  });
});

describe('enquadramento de faixa nos limites exatos', () => {
  it.each([
    [0, 'faixa1'],
    [3_200.0, 'faixa1'],
    [3_200.01, 'faixa2'],
    [5_000.0, 'faixa2'],
    [5_000.01, 'faixa3'],
    [9_600.0, 'faixa3'],
    [9_600.01, 'faixa4'],
    [13_000.0, 'faixa4'],
    [13_000.01, 'sbpe'],
    [50_000, 'sbpe'],
  ])('renda R$ %d → %s', (renda, esperado) => {
    expect(faixaPorRenda(renda).id).toBe(esperado);
  });

  it('rejeita renda negativa ou inválida', () => {
    expect(() => faixaPorRenda(-1)).toThrow(RangeError);
    expect(() => faixaPorRenda(Number.NaN)).toThrow(RangeError);
  });

  it('avisa quando o imóvel passa do teto da faixa', () => {
    const faixa2 = FAIXAS.find((f) => f.id === 'faixa2');
    const teto = faixa2?.tetoImovel ?? 0;
    expect(enquadrarImovel(teto, 4_000).aviso).toBeNull();
    const acima = enquadrarImovel(teto + 1, 4_000);
    expect(acima.dentroDoTeto).toBe(false);
    expect(acima.aviso).toMatch(/fora do MCMV/);
  });

  it('não avisa MCMV para quem já está no SBPE', () => {
    expect(enquadrarImovel(900_000, 20_000).aviso).toBeNull();
  });
});

describe('valor financiado e cota', () => {
  it('PV = preço − entrada − FGTS quando dentro da cota', () => {
    const v = calcularValorFinanciado(200_000, 30_000, 20_000);
    expect(v.financiado).toBe(150_000);
    expect(v.limitadoPelaCota).toBe(false);
  });

  it('limita à cota e informa a entrada mínima', () => {
    const v = calcularValorFinanciado(200_000, 5_000, 0);
    expect(v.solicitado).toBe(195_000);
    expect(v.financiado).toBeCloseTo(200_000 * COTA_MAXIMA_FINANCIAMENTO, 6);
    expect(v.limitadoPelaCota).toBe(true);
    expect(v.entradaMinimaNecessaria).toBeCloseTo(200_000 * (1 - COTA_MAXIMA_FINANCIAMENTO), 6);
  });

  it('nunca financia valor negativo', () => {
    expect(calcularValorFinanciado(100_000, 90_000, 30_000).financiado).toBe(0);
  });
});

describe('simularFinanciamento', () => {
  it('reproduz o caso de controle pela simulação completa', () => {
    const r = simularFinanciamento({
      valorImovel: 250_000,
      entrada: 30_000,
      fgts: 20_000,
      taxaAnual: CONTROLE.taxaAnual,
      tipoTaxa: 'efetiva',
      prazoMeses: 420,
      sistema: 'price',
    });
    expect(r.valores.financiado).toBe(200_000);
    expect(r.primeiraParcela).toBeCloseTo(1401.6526827321, 6);
    expect(r.ultimaParcela).toBeCloseTo(1401.6526827321, 6);
    expect(r.totalJuros).toBeCloseTo(388694.1267474993, 3);
    expect(r.totalPago).toBeCloseTo(588694.1267474993, 3);
    expect(r.resumoAnual).toHaveLength(35);
    expect(r.segurosEstimadosMensais).toBeGreaterThan(0);
  });

  it('sem valor financiado não gera parcelas', () => {
    const r = simularFinanciamento({
      valorImovel: 100_000,
      entrada: 100_000,
      fgts: 0,
      taxaAnual: 0.08,
      tipoTaxa: 'nominal',
      prazoMeses: 360,
      sistema: 'sac',
    });
    expect(r.tabela).toHaveLength(0);
    expect(r.primeiraParcela).toBe(0);
  });

  it('resumo anual soma o total pago da tabela', () => {
    const tabela = tabelaAmortizacao(100_000, 0.007, 30, 'sac');
    const anos = resumoAnual(tabela);
    expect(anos).toHaveLength(3);
    expect(anos[2]?.saldoFinal).toBe(0);
    const total = anos.reduce((s, a) => s + a.totalPago, 0);
    expect(total).toBeCloseTo(
      tabela.reduce((s, l) => s + l.parcela, 0),
      6,
    );
  });
});

describe('Cabe no Meu Bolso', () => {
  it('parcela máxima = renda × comprometimento − dívidas', () => {
    expect(parcelaMaximaPelaRenda(4_000, 200)).toBeCloseTo(
      4_000 * COMPROMETIMENTO_MAXIMO_RENDA - 200,
      8,
    );
    expect(parcelaMaximaPelaRenda(1_000, 5_000)).toBe(0);
  });

  it('poder de compra é o menor entre financiável/cota e financiável + recursos próprios', () => {
    expect(poderDeCompra(160_000, 10_000, 0, 0.8)).toBe(170_000);
    expect(poderDeCompra(160_000, 100_000, 0, 0.8)).toBeCloseTo(200_000, 8);
  });

  it('calcula o resultado completo e não soma subsídio', () => {
    const r = calcularCabeNoBolso({
      rendaFamiliar: 3_000,
      entrada: 10_000,
      fgts: 15_000,
      outrasDividasMensais: 0,
      prazoMeses: 420,
      sistema: 'price',
    });
    expect(r.faixa.id).toBe('faixa1');
    expect(r.parcelaConsiderada).toBeCloseTo(900, 8);
    const i = taxaMensal(r.taxaAnual, r.faixa.tipoTaxa);
    const financiavel = valorFinanciavelPorParcela(900, i, 420, 'price');
    expect(r.valorFinanciavel).toBeCloseTo(financiavel, 6);
    expect(r.poderDeCompra).toBeCloseTo(Math.min(financiavel / 0.8, financiavel + 25_000), 6);
    expect(r.avisoSubsidio).toMatch(/subsídio/);
  });

  it('parcela desejada menor que o máximo prevalece', () => {
    const r = calcularCabeNoBolso({
      rendaFamiliar: 6_000,
      entrada: 0,
      fgts: 0,
      outrasDividasMensais: 0,
      parcelaDesejada: 1_000,
      prazoMeses: 360,
      sistema: 'sac',
    });
    expect(r.parcelaConsiderada).toBe(1_000);
    expect(r.avisoSubsidio).toBeNull();
  });

  it('cabeNoBolso compara preço e poder de compra', () => {
    expect(cabeNoBolso(200_000, 200_000)).toBe(true);
    expect(cabeNoBolso(200_001, 200_000)).toBe(false);
    expect(cabeNoBolso(1, 0)).toBe(false);
  });
});

describe('custo total de aquisição', () => {
  it('soma recursos próprios, ITBI e cartório estimados', () => {
    const c = calcularCustoAquisicao({
      preco: 200_000,
      entrada: 40_000,
      fgts: 0,
      cidade: 'Cidade Exemplo',
      uf: 'EX',
    });
    const aliquota = c.regras.itbi.aliquota;
    const aliquotaFin = c.regras.itbi.aliquotaParteFinanciadaSFH ?? aliquota;
    expect(c.valorFinanciado).toBe(160_000);
    expect(c.recursosProprios).toBe(40_000);
    expect(c.itbi).toBeCloseTo(40_000 * aliquota + 160_000 * aliquotaFin, 6);
    expect(c.registroCartorio).toBeCloseTo(200_000 * c.regras.registroCartorioEstimado, 6);
    expect(c.totalDesembolsoInicial).toBeCloseTo(40_000 + c.itbi + c.registroCartorio, 6);
  });

  it('usa a regra padrão para município não cadastrado', () => {
    const c = calcularCustoAquisicao({
      preco: 100_000,
      entrada: 20_000,
      fgts: 0,
      cidade: 'Inexistente',
      uf: 'ZZ',
    });
    expect(c.regras.cidade).toBe('Padrão');
  });
});

describe('parcela estimada do anúncio', () => {
  it('usa as premissas configuradas', () => {
    const r = parcelaEstimadaAnuncio(200_000);
    expect(r.valorFinanciado).toBeCloseTo(
      200_000 * (1 - PREMISSAS_PARCELA_ANUNCIO.percentualEntrada),
      6,
    );
    expect(r.faixaReferencia.id).toBe('faixa3');
    const i = taxaMensal(r.taxaAnual, r.faixaReferencia.tipoTaxa);
    expect(r.parcela).toBeCloseTo(
      primeiraParcela(
        r.valorFinanciado,
        i,
        PREMISSAS_PARCELA_ANUNCIO.prazoMeses,
        PREMISSAS_PARCELA_ANUNCIO.sistema,
      ),
      8,
    );
  });

  it('muda de faixa de referência acima do teto da Faixa 3', () => {
    expect(parcelaEstimadaAnuncio(450_000).faixaReferencia.id).toBe('faixa4');
    expect(parcelaEstimadaAnuncio(2_000_000).faixaReferencia.id).toBe('sbpe');
  });
});
