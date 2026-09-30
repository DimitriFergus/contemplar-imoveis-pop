import type { StatusPainel } from '@/lib/schemas/imovel';
import type { EtapaLead } from '@/lib/supabase/tipos';

export const ROTULO_STATUS_PAINEL: Record<StatusPainel, string> = {
  rascunho: 'Rascunho',
  publicado: 'Publicado',
  reservado: 'Reservado',
  vendido: 'Vendido',
};

export const AJUDA_STATUS_PAINEL: Record<StatusPainel, string> = {
  rascunho: 'Não aparece no site. Use enquanto está preenchendo.',
  publicado: 'Aparece no site como disponível.',
  reservado: 'Aparece no site com o aviso "Reservado".',
  vendido: 'Aparece com o aviso "Vendido" e sai das buscas principais.',
};

export const COR_STATUS_PAINEL: Record<StatusPainel, string> = {
  rascunho: 'bg-muted text-foreground ring-1 ring-border',
  publicado: 'bg-sucesso-suave text-sucesso',
  reservado: 'bg-aviso-suave text-aviso',
  vendido: 'bg-marinho text-white',
};

export const ROTULO_ETAPA: Record<EtapaLead, string> = {
  novo: 'Novo',
  em_atendimento: 'Em atendimento',
  visita_agendada: 'Visita agendada',
  proposta: 'Proposta',
  ganho: 'Ganho',
  perdido: 'Perdido',
};

export const COR_ETAPA: Record<EtapaLead, string> = {
  novo: 'bg-destaque-suave text-destaque-texto',
  em_atendimento: 'bg-info-suave text-primary',
  visita_agendada: 'bg-info-suave text-primary',
  proposta: 'bg-aviso-suave text-aviso',
  ganho: 'bg-sucesso-suave text-sucesso',
  perdido: 'bg-perda-suave text-perda',
};

export const ROTULO_ORIGEM: Record<string, string> = {
  formulario_contato: 'Contato',
  formulario_imovel: 'Página do imóvel',
  agendamento_visita: 'Pedido de visita',
  anuncie: 'Anunciar imóvel',
  cabe_no_bolso: 'Cabe no Meu Bolso',
};

export const ROTULO_FAIXA_RENDA: Record<string, string> = {
  faixa1: 'Faixa 1 (até R$ 3.200)',
  faixa2: 'Faixa 2 (até R$ 5.000)',
  faixa3: 'Faixa 3 (até R$ 9.600)',
  faixa4: 'Faixa 4 (até R$ 13.000)',
  sbpe: 'Acima de R$ 13.000',
  prefiro_nao_informar: 'Preferiu não informar',
};

export const ROTULO_PERIODO: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

/** Nome amigável dos campos no histórico de alterações. */
export const ROTULO_CAMPO: Record<string, string> = {
  '(criado)': 'Cadastro criado',
  '(excluído)': 'Registro excluído',
  preco: 'Preço',
  titulo: 'Título',
  descricao: 'Descrição',
  tipo: 'Tipo',
  situacao: 'Situação',
  previsaoEntrega: 'Previsão de entrega',
  condominioMensal: 'Condomínio',
  iptuAnual: 'IPTU',
  cidade: 'Cidade',
  uf: 'UF',
  bairro: 'Bairro',
  localizacaoAproximada: 'Localização',
  quartos: 'Quartos',
  suites: 'Suítes',
  banheiros: 'Banheiros',
  vagas: 'Vagas',
  areaUtilM2: 'Área útil',
  areaTerrenoM2: 'Área do terreno',
  caracteristicas: 'Características',
  lazer: 'Lazer',
  condicoes: 'Condições de pagamento',
  fotos: 'Fotos',
  videoUrl: 'Vídeo',
  tour360Url: 'Tour 360°',
  proximidades: 'Proximidades',
  destaque: 'Destaque',
  status: 'Status',
  corretor_id: 'Corretor',
  slug: 'Endereço da página',
  exemplo: 'Exemplo',
  publicado_em: 'Data de publicação',
  etapa: 'Etapa do funil',
  observacoes: 'Observações',
  motivo_perda: 'Motivo da perda',
};
