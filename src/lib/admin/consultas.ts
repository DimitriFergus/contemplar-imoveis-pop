import type { SupabaseClient } from '@supabase/supabase-js';
import { COLUNAS_IMOVEL } from '@/lib/repositorio/linha';
import type {
  LinhaAuditoria,
  LinhaCorretor,
  LinhaImovel,
  LinhaLead,
  LinhaPerfil,
} from '@/lib/supabase/tipos';

/** Consultas do painel. Rodam com a sessão de quem está logado (RLS decide o que aparece). */

export type ImovelDaLista = Omit<LinhaImovel, 'dados' | 'publicado_em' | 'criado_em'>;

function termoSeguro(busca?: string) {
  return busca?.replace(/[%,()*]/g, ' ').trim() || '';
}

export async function listarImoveisPainel(
  supabase: SupabaseClient,
  filtros: { status?: string; busca?: string; corretor?: string },
): Promise<ImovelDaLista[]> {
  let q = supabase
    .from('imoveis')
    .select(
      'id, codigo, slug, status, corretor_id, destaque, exemplo, fotos, titulo, tipo, bairro, preco, atualizado_em',
    )
    .order('atualizado_em', { ascending: false })
    .limit(500);
  if (filtros.status) q = q.eq('status', filtros.status);
  if (filtros.corretor) q = q.eq('corretor_id', filtros.corretor);
  const termo = termoSeguro(filtros.busca);
  if (termo) q = q.or(`titulo.ilike.%${termo}%,bairro.ilike.%${termo}%,codigo.ilike.%${termo}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as ImovelDaLista[];
}

/** null = não existe ou a pessoa não tem acesso (as duas coisas parecem iguais, de propósito). */
export async function obterImovelPainel(
  supabase: SupabaseClient,
  id: string,
): Promise<LinhaImovel | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await supabase
    .from('imoveis')
    .select(COLUNAS_IMOVEL)
    .eq('id', id)
    .maybeSingle<LinhaImovel>();
  return data;
}

export async function listarCorretores(supabase: SupabaseClient): Promise<LinhaCorretor[]> {
  const { data } = await supabase
    .from('corretores')
    .select('id, nome, creci, whatsapp, foto, ativo')
    .order('nome');
  return (data ?? []) as LinhaCorretor[];
}

export async function listarPerfis(supabase: SupabaseClient): Promise<LinhaPerfil[]> {
  const { data } = await supabase
    .from('perfis')
    .select('id, nome, email, papel, corretor_id, ativo, criado_em')
    .order('nome');
  return (data ?? []) as LinhaPerfil[];
}

export async function historico(
  supabase: SupabaseClient,
  filtro: { tabela?: 'imoveis' | 'leads'; id?: string; campo?: string; limite?: number },
): Promise<LinhaAuditoria[]> {
  let q = supabase
    .from('auditoria')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(filtro.limite ?? 200);
  if (filtro.tabela) q = q.eq('tabela', filtro.tabela);
  if (filtro.id) q = q.eq('registro_id', filtro.id);
  if (filtro.campo) q = q.eq('campo', filtro.campo);
  const { data } = await q;
  return (data ?? []) as LinhaAuditoria[];
}

export const COLUNAS_LEAD =
  'id, criado_em, atualizado_em, origem, nome, whatsapp, email, renda_faixa, codigo_imovel, imovel_id, mensagem, data_visita, periodo_visita, utm, consentimento_lgpd, etapa, corretor_id, motivo_perda, observacoes';

export async function listarLeads(
  supabase: SupabaseClient,
  filtros: { etapa?: string; busca?: string; corretor?: string; limite?: number },
): Promise<LinhaLead[]> {
  let q = supabase
    .from('leads')
    .select(COLUNAS_LEAD)
    .order('criado_em', { ascending: false })
    .limit(filtros.limite ?? 1000);
  if (filtros.etapa) q = q.eq('etapa', filtros.etapa);
  if (filtros.corretor === 'sem') q = q.is('corretor_id', null);
  else if (filtros.corretor) q = q.eq('corretor_id', filtros.corretor);
  const termo = termoSeguro(filtros.busca);
  if (termo)
    q = q.or(`nome.ilike.%${termo}%,whatsapp.ilike.%${termo}%,codigo_imovel.ilike.%${termo}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as LinhaLead[];
}

export async function obterLead(supabase: SupabaseClient, id: string): Promise<LinhaLead | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await supabase
    .from('leads')
    .select(COLUNAS_LEAD)
    .eq('id', id)
    .maybeSingle<LinhaLead>();
  return data;
}
