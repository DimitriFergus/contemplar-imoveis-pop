import 'server-only';
import { SUPABASE_CONFIGURADO } from '@/lib/supabase/config';
import { clienteServico, servicoConfigurado } from '@/lib/supabase/servidor';
import type { Lead } from '@/types';

/**
 * Grava o lead na tabela "leads" (CRM do painel). O lead vai para o corretor responsável pelo
 * imóvel de interesse; sem imóvel, fica para o admin distribuir.
 * Retorna false quando o banco não está configurado.
 */
export function bancoDeLeadsAtivo(): boolean {
  return SUPABASE_CONFIGURADO && servicoConfigurado();
}

export async function gravarLeadNoBanco(lead: Lead): Promise<boolean> {
  if (!bancoDeLeadsAtivo()) return false;
  const supabase = clienteServico();

  let imovel: { id: string; corretor_id: string } | null = null;
  if (lead.codigoImovel) {
    const { data } = await supabase
      .from('imoveis')
      .select('id, corretor_id')
      .eq('codigo', lead.codigoImovel)
      .maybeSingle();
    imovel = data;
  }

  const { error } = await supabase.from('leads').insert({
    id: lead.id,
    criado_em: lead.criadoEm,
    origem: lead.origem,
    nome: lead.nome,
    whatsapp: lead.whatsapp,
    email: lead.email ?? null,
    renda_faixa: lead.rendaFamiliarFaixa ?? null,
    codigo_imovel: lead.codigoImovel ?? null,
    imovel_id: imovel?.id ?? null,
    mensagem: lead.mensagem ?? null,
    data_visita: lead.dataVisitaPreferida ?? null,
    periodo_visita: lead.periodoPreferido ?? null,
    utm: lead.utm && Object.keys(lead.utm).length > 0 ? lead.utm : null,
    consentimento_lgpd: lead.consentimentoLGPD,
    etapa: 'novo',
    corretor_id: imovel?.corretor_id ?? null,
  });
  if (error) throw new Error(error.message);
  return true;
}
