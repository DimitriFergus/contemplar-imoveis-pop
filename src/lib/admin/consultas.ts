import 'server-only';
import { notFound } from 'next/navigation';
import { COLUNAS_IMOVEL } from '@/lib/repositorio/supabase';
import type {
  LinhaAuditoria,
  LinhaCorretor,
  LinhaImovel,
  LinhaLead,
  LinhaPerfil,
} from '@/lib/supabase/tipos';
import type { SessaoValida } from './sessao';

type Cliente = SessaoValida['supabase'];

/** Imóveis que a pessoa pode ver no painel (RLS: corretor só os seus; admin todos). */
export async function listarImoveisPainel(
  supabase: Cliente,
  filtros: { status?: string; busca?: string; corretor?: string },
) {
  let q = supabase
    .from('imoveis')
    .select(
      'id, codigo, slug, status, corretor_id, destaque, exemplo, fotos, titulo, tipo, bairro, preco, atualizado_em',
    )
    .order('atualizado_em', { ascending: false })
    .limit(500);
  if (filtros.status) q = q.eq('status', filtros.status);
  if (filtros.corretor) q = q.eq('corretor_id', filtros.corretor);
  if (filtros.busca) {
    const termo = filtros.busca.replace(/[%,()]/g, ' ').trim();
    if (termo) q = q.or(`titulo.ilike.%${termo}%,bairro.ilike.%${termo}%,codigo.ilike.%${termo}%`);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as Omit<LinhaImovel, 'dados' | 'publicado_em' | 'criado_em'>[];
}

export async function obterImovelPainel(supabase: Cliente, id: string): Promise<LinhaImovel> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await supabase
    .from('imoveis')
    .select(COLUNAS_IMOVEL)
    .eq('id', id)
    .maybeSingle<LinhaImovel>();
  if (!data) notFound();
  return data;
}

export async function listarCorretores(supabase: Cliente): Promise<LinhaCorretor[]> {
  const { data } = await supabase
    .from('corretores')
    .select('id, nome, creci, whatsapp, foto, ativo')
    .order('nome');
  return (data ?? []) as LinhaCorretor[];
}

export async function listarPerfis(supabase: Cliente): Promise<LinhaPerfil[]> {
  const { data } = await supabase
    .from('perfis')
    .select('id, nome, email, papel, corretor_id, ativo, criado_em')
    .order('nome');
  return (data ?? []) as LinhaPerfil[];
}

export async function historicoDoRegistro(
  supabase: Cliente,
  tabela: 'imoveis' | 'leads',
  id: string,
): Promise<LinhaAuditoria[]> {
  const { data } = await supabase
    .from('auditoria')
    .select('*')
    .eq('tabela', tabela)
    .eq('registro_id', id)
    .order('criado_em', { ascending: false })
    .limit(200);
  return (data ?? []) as LinhaAuditoria[];
}

export const COLUNAS_LEAD =
  'id, criado_em, atualizado_em, origem, nome, whatsapp, email, renda_faixa, codigo_imovel, imovel_id, mensagem, data_visita, periodo_visita, utm, consentimento_lgpd, etapa, corretor_id, motivo_perda, observacoes';

export async function listarLeads(
  supabase: Cliente,
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
  if (filtros.busca) {
    const termo = filtros.busca.replace(/[%,()]/g, ' ').trim();
    if (termo)
      q = q.or(`nome.ilike.%${termo}%,whatsapp.ilike.%${termo}%,codigo_imovel.ilike.%${termo}%`);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as LinhaLead[];
}
