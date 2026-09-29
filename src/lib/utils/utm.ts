export const CHAVES_UTM = ['source', 'medium', 'campaign', 'content', 'term'] as const;
export type ChaveUTM = (typeof CHAVES_UTM)[number];
export type UTM = Partial<Record<ChaveUTM, string>>;

/** Lê utm_source, utm_medium etc. de uma query string. Retorna null se não houver nenhuma. */
export function extrairUTM(params: URLSearchParams): UTM | null {
  const utm: UTM = {};
  for (const chave of CHAVES_UTM) {
    const valor = params.get(`utm_${chave}`)?.trim().slice(0, 100);
    if (valor) utm[chave] = valor;
  }
  return Object.keys(utm).length > 0 ? utm : null;
}

/** "instagram / anuncio / lancamento-setembro" */
export function descreverOrigem(utm?: UTM | null): string {
  if (!utm) return '';
  return [utm.source, utm.medium, utm.campaign].filter(Boolean).join(' / ');
}
