import type { SistemaAmortizacao } from '@/config/financiamento';

export interface LinhaAmortizacao {
  mes: number;
  parcela: number;
  juros: number;
  amortizacao: number;
  saldoDevedor: number;
}

function validar(pv: number, i: number, n: number) {
  if (pv < 0) throw new RangeError('O valor financiado não pode ser negativo');
  if (i < 0) throw new RangeError('A taxa não pode ser negativa');
  if (!Number.isInteger(n) || n <= 0)
    throw new RangeError('O prazo deve ser um número inteiro de meses');
}

/** Price: parcela = PV × i / (1 − (1 + i)^−n). Parcelas iguais. */
export function parcelaPrice(pv: number, i: number, n: number): number {
  validar(pv, i, n);
  if (i === 0) return pv / n;
  return (pv * i) / (1 - Math.pow(1 + i, -n));
}

/** SAC: amortização constante PV/n; parcela_k = amortização + saldo_(k−1) × i. */
export function parcelaSac(pv: number, i: number, n: number, mes: number): number {
  validar(pv, i, n);
  if (!Number.isInteger(mes) || mes < 1 || mes > n) throw new RangeError('Mês fora do prazo');
  const amortizacao = pv / n;
  const saldoAnterior = pv - amortizacao * (mes - 1);
  return amortizacao + saldoAnterior * i;
}

/** Primeira parcela do sistema escolhido (no SAC é a maior; na Price todas são iguais). */
export function primeiraParcela(
  pv: number,
  i: number,
  n: number,
  sistema: SistemaAmortizacao,
): number {
  return sistema === 'price' ? parcelaPrice(pv, i, n) : parcelaSac(pv, i, n, 1);
}

/**
 * Valor que pode ser financiado dado um limite de parcela.
 * Price: PV = parcela × (1 − (1 + i)^−n) / i.
 * SAC: a primeira parcela é a limitante: parcela = PV/n + PV × i ⇒ PV = parcela / (1/n + i).
 */
export function valorFinanciavelPorParcela(
  parcelaMaxima: number,
  i: number,
  n: number,
  sistema: SistemaAmortizacao,
): number {
  validar(0, i, n);
  if (parcelaMaxima <= 0) return 0;
  if (sistema === 'sac') return parcelaMaxima / (1 / n + i);
  if (i === 0) return parcelaMaxima * n;
  return (parcelaMaxima * (1 - Math.pow(1 + i, -n))) / i;
}

export function tabelaAmortizacao(
  pv: number,
  i: number,
  n: number,
  sistema: SistemaAmortizacao,
): LinhaAmortizacao[] {
  validar(pv, i, n);
  const linhas: LinhaAmortizacao[] = [];
  const parcelaFixa = sistema === 'price' ? parcelaPrice(pv, i, n) : 0;
  const amortizacaoFixa = pv / n;
  let saldo = pv;
  for (let mes = 1; mes <= n; mes++) {
    const juros = saldo * i;
    const amortizacao = sistema === 'price' ? parcelaFixa - juros : amortizacaoFixa;
    saldo = mes === n ? 0 : saldo - amortizacao;
    linhas.push({
      mes,
      parcela: amortizacao + juros,
      juros,
      amortizacao,
      saldoDevedor: Math.max(0, saldo),
    });
  }
  return linhas;
}

export interface ResumoAnual {
  ano: number;
  parcelaInicial: number;
  parcelaFinal: number;
  totalPago: number;
  juros: number;
  amortizacao: number;
  saldoFinal: number;
}

export function resumoAnual(tabela: LinhaAmortizacao[]): ResumoAnual[] {
  const anos: ResumoAnual[] = [];
  for (let inicio = 0; inicio < tabela.length; inicio += 12) {
    const meses = tabela.slice(inicio, inicio + 12);
    const primeira = meses[0];
    const ultima = meses[meses.length - 1];
    if (!primeira || !ultima) continue;
    anos.push({
      ano: inicio / 12 + 1,
      parcelaInicial: primeira.parcela,
      parcelaFinal: ultima.parcela,
      totalPago: meses.reduce((s, l) => s + l.parcela, 0),
      juros: meses.reduce((s, l) => s + l.juros, 0),
      amortizacao: meses.reduce((s, l) => s + l.amortizacao, 0),
      saldoFinal: ultima.saldoDevedor,
    });
  }
  return anos;
}
