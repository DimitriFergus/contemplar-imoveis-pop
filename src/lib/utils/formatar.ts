const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlSemCentavos = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});
const numero = new Intl.NumberFormat('pt-BR');
const percentual = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** R$ 1.401,65 — arredondamento só na exibição. */
export function formatarBRL(valor: number): string {
  return brl.format(valor).replace(/ /g, ' ');
}

/** R$ 215.000 — para preços de imóveis. */
export function formatarPreco(valor: number): string {
  return brlSemCentavos.format(valor).replace(/ /g, ' ');
}

/** "R$ 215 mil" — forma curta para marcadores de mapa e chips. */
export function formatarPrecoCurto(valor: number): string {
  if (valor >= 1_000_000) return `R$ ${numero.format(Math.round(valor / 100_000) / 10)} mi`;
  if (valor >= 1_000) return `R$ ${numero.format(Math.round(valor / 1_000))} mil`;
  return formatarPreco(valor);
}

export function formatarNumero(valor: number): string {
  return numero.format(valor);
}

export function formatarPercentual(valor: number): string {
  return percentual.format(valor);
}

export function formatarArea(m2: number): string {
  return `${numero.format(m2)} m²`;
}

export function formatarDistancia(metros: number): string {
  if (metros < 1_000) return `${Math.round(metros / 10) * 10} m`;
  return `${numero.format(Math.round(metros / 100) / 10)} km`;
}

export function formatarPrazo(meses: number): string {
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  if (resto === 0) return `${anos} anos (${meses} meses)`;
  return `${meses} meses`;
}

/** "2027-06" ou ISO → "junho de 2027". */
export function formatarMesAno(data: string): string {
  const [ano, mes] = data.split('-').map(Number);
  if (!ano || !mes) return data;
  return new Date(Date.UTC(ano, mes - 1, 15)).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

/**
 * "12.345,67", "215.000" ou "12345.67" → número. Retorna NaN se inválido.
 * Pontos seguidos de grupos de 3 dígitos são tratados como separador de milhar.
 */
export function lerNumeroBR(texto: string): number {
  const limpo = texto.replace(/[R$\s ]/g, '');
  if (!limpo) return Number.NaN;
  let normalizado = limpo;
  if (limpo.includes(',')) normalizado = limpo.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(limpo)) normalizado = limpo.replace(/\./g, '');
  return Number(normalizado);
}

export function plural(qtd: number, singular: string, pluralForma: string): string {
  return `${qtd} ${qtd === 1 ? singular : pluralForma}`;
}
