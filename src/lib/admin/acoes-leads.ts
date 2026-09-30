'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { ETAPAS_LEAD, type EtapaLead } from '@/lib/supabase/tipos';
import { exigirSessao } from './sessao';

export async function moverLead(
  id: string,
  etapa: EtapaLead,
): Promise<{ ok: boolean; mensagem?: string }> {
  const { supabase } = await exigirSessao();
  if (!ETAPAS_LEAD.includes(etapa)) return { ok: false, mensagem: 'Etapa inválida.' };
  const { data, error } = await supabase
    .from('leads')
    .update({ etapa })
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error || !data) return { ok: false, mensagem: 'Não foi possível mover o lead.' };
  revalidatePath('/admin/leads');
  revalidatePath('/admin');
  return { ok: true };
}

const atualizacaoSchema = z.object({
  etapa: z.enum(ETAPAS_LEAD),
  observacoes: z.string().trim().max(5000),
  motivo_perda: z.string().trim().max(300),
  corretor_id: z.string().optional(),
});

export interface EstadoLead {
  ok?: string;
  erro?: string;
}

export async function atualizarLead(
  id: string,
  _: EstadoLead,
  form: FormData,
): Promise<EstadoLead> {
  const { supabase, ehAdmin } = await exigirSessao();
  const r = atualizacaoSchema.safeParse({
    etapa: form.get('etapa'),
    observacoes: form.get('observacoes') ?? '',
    motivo_perda: form.get('motivo_perda') ?? '',
    corretor_id: form.get('corretor_id') ?? undefined,
  });
  if (!r.success) return { erro: 'Confira os campos.' };
  if (r.data.etapa === 'perdido' && !r.data.motivo_perda)
    return { erro: 'Informe o motivo da perda (ajuda a melhorar o atendimento).' };

  const mudancas: Record<string, unknown> = {
    etapa: r.data.etapa,
    observacoes: r.data.observacoes || null,
    motivo_perda: r.data.etapa === 'perdido' ? r.data.motivo_perda : null,
  };
  // Só o admin distribui leads entre corretores.
  if (ehAdmin && r.data.corretor_id !== undefined)
    mudancas.corretor_id = r.data.corretor_id || null;

  const { data, error } = await supabase
    .from('leads')
    .update(mudancas)
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error || !data) return { erro: 'Não foi possível salvar. Você tem acesso a este lead?' };
  revalidatePath('/admin/leads');
  revalidatePath(`/admin/leads/${id}`);
  return { ok: 'Lead atualizado.' };
}

/** Exclusão definitiva (pedido do titular dos dados, LGPD). Somente admin. */
export async function excluirLead(id: string) {
  const { supabase } = await exigirSessao({ apenasAdmin: true });
  await supabase.from('leads').delete().eq('id', id);
  revalidatePath('/admin/leads');
  redirect('/admin/leads?aviso=excluido');
}
