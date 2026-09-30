/** Linhas das tabelas (supabase/migrations). Mantidas à mão para não depender de geração de tipos. */
import type { Foto } from '@/types';
import type { StatusPainel } from '@/lib/schemas/imovel';

export type Papel = 'admin' | 'corretor';

export const ETAPAS_LEAD = [
  'novo',
  'em_atendimento',
  'visita_agendada',
  'proposta',
  'ganho',
  'perdido',
] as const;
export type EtapaLead = (typeof ETAPAS_LEAD)[number];

export interface LinhaPerfil {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  corretor_id: string | null;
  ativo: boolean;
  criado_em: string;
}

export interface LinhaCorretor {
  id: string;
  nome: string;
  creci: string;
  whatsapp: string;
  foto: string | null;
  ativo: boolean;
}

export interface LinhaImovel {
  id: string;
  codigo: string;
  slug: string;
  status: StatusPainel;
  corretor_id: string;
  destaque: boolean;
  exemplo: boolean;
  dados: Record<string, unknown>;
  fotos: Foto[];
  titulo: string | null;
  tipo: string | null;
  bairro: string | null;
  preco: number | null;
  publicado_em: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface LinhaLead {
  id: string;
  criado_em: string;
  atualizado_em: string;
  origem: string;
  nome: string;
  whatsapp: string;
  email: string | null;
  renda_faixa: string | null;
  codigo_imovel: string | null;
  imovel_id: string | null;
  mensagem: string | null;
  data_visita: string | null;
  periodo_visita: string | null;
  utm: Record<string, string> | null;
  consentimento_lgpd: boolean;
  etapa: EtapaLead;
  corretor_id: string | null;
  motivo_perda: string | null;
  observacoes: string | null;
}

export interface LinhaAuditoria {
  id: number;
  criado_em: string;
  tabela: 'imoveis' | 'leads';
  registro_id: string;
  usuario_id: string | null;
  usuario_nome: string | null;
  campo: string;
  valor_antigo: string | null;
  valor_novo: string | null;
}
