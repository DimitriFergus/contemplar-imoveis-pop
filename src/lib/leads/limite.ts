/**
 * Limite de requisições simples em memória (janela deslizante por IP).
 * Suficiente para a Fase 1. Em produção com várias instâncias (serverless), trocar por um
 * armazenamento compartilhado (ex.: Upstash Redis / Vercel KV) — ver docs/PENDENCIAS.md.
 */
const registros = new Map<string, number[]>();

export function permitirRequisicao(
  chave: string,
  max: number,
  janelaMs: number,
  agora = Date.now(),
): boolean {
  const recentes = (registros.get(chave) ?? []).filter((t) => agora - t < janelaMs);
  if (recentes.length >= max) {
    registros.set(chave, recentes);
    return false;
  }
  recentes.push(agora);
  registros.set(chave, recentes);
  if (registros.size > 10_000) {
    for (const [k, ts] of registros)
      if (ts.every((t) => agora - t >= janelaMs)) registros.delete(k);
  }
  return true;
}

export function limparLimites() {
  registros.clear();
}
