import { CAMPOS_FORA_DE_DADOS, imovelSchema, type StatusPainel } from '@/lib/schemas/imovel';
import type { LinhaImovel } from '@/lib/supabase/tipos';
import type { Imovel, StatusImovel } from '@/types';

/** Status do painel → status mostrado no site (rascunho nunca chega ao site público). */
export function statusPublico(status: StatusPainel): StatusImovel {
  return status === 'publicado' || status === 'rascunho' ? 'disponivel' : status;
}

export function statusDoPainel(status: StatusImovel): StatusPainel {
  return status === 'disponivel' ? 'publicado' : status;
}

/** Linha do banco → objeto Imovel, no mesmo formato do site (sem validar). */
export function linhaParaImovel(l: LinhaImovel): Imovel {
  return {
    ...(l.dados as Omit<Imovel, (typeof CAMPOS_FORA_DE_DADOS)[number]>),
    id: l.codigo.toLowerCase(),
    codigo: l.codigo,
    slug: l.slug,
    fotos: l.fotos,
    destaque: l.destaque,
    status: statusPublico(l.status),
    corretorResponsavelId: l.corretor_id,
    exemplo: l.exemplo,
    publicadoEm: l.publicado_em ?? l.criado_em,
    atualizadoEm: l.atualizado_em,
  };
}

/** Converte e valida com o mesmo schema do site; devolve null (e registra) se estiver inválido. */
export function linhaParaImovelValido(l: LinhaImovel): Imovel | null {
  const r = imovelSchema.safeParse(linhaParaImovel(l));
  if (r.success) return r.data;
  console.error(
    `[repositorio] imóvel ${l.codigo} ignorado por dados inválidos:`,
    r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
  );
  return null;
}

/** Objeto do imóvel → conteúdo da coluna "dados" (sem os campos que têm coluna própria). */
export function imovelParaDados(i: object): Record<string, unknown> {
  const dados: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(i)) {
    if ((CAMPOS_FORA_DE_DADOS as readonly string[]).includes(chave)) continue;
    if (valor === undefined) continue;
    dados[chave] = valor;
  }
  return dados;
}
