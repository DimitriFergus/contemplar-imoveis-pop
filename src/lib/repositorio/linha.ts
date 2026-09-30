import type { LinhaImovel } from '@/lib/supabase/tipos';
import type { Imovel, StatusImovel } from '@/types';

/**
 * Conversão linha do banco → Imovel sem dependências pesadas (sem Zod), para poder rodar
 * também no navegador (dados ao vivo na versão estática e painel).
 */

/** Status do painel → status mostrado no site (rascunho nunca chega ao site público). */
export function statusPublico(status: LinhaImovel['status']): StatusImovel {
  return status === 'publicado' || status === 'rascunho' ? 'disponivel' : status;
}

export function statusDoPainel(status: StatusImovel): LinhaImovel['status'] {
  return status === 'disponivel' ? 'publicado' : status;
}

/** Campos que têm coluna própria no banco (o resto do anúncio fica na coluna "dados"). */
export const CAMPOS_FORA_DE_DADOS = [
  'id',
  'codigo',
  'slug',
  'fotos',
  'destaque',
  'status',
  'corretorResponsavelId',
  'exemplo',
  'publicadoEm',
  'atualizadoEm',
] as const;

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

export const COLUNAS_IMOVEL =
  'id, codigo, slug, status, corretor_id, destaque, exemplo, dados, fotos, titulo, tipo, bairro, preco, publicado_em, criado_em, atualizado_em';
