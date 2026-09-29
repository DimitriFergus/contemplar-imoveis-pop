/**
 * Listas de valores válidos, sem dependências, para poderem ser usadas em componentes
 * do navegador sem levar a biblioteca de validação (Zod) junto no pacote.
 */

export const TIPOS_IMOVEL = [
  'casa',
  'apartamento',
  'casa_condominio',
  'duplex',
  'sobrado',
  'kitnet',
] as const;
export const SITUACOES_IMOVEL = ['pronto', 'usado', 'na_planta', 'em_construcao'] as const;
export const STATUS_IMOVEL = ['disponivel', 'reservado', 'vendido'] as const;
export const TIPOS_PROXIMIDADE = ['escola', 'saude', 'mercado', 'transporte', 'lazer'] as const;

export const ORIGENS_LEAD = [
  'formulario_contato',
  'formulario_imovel',
  'agendamento_visita',
  'anuncie',
  'cabe_no_bolso',
] as const;
export const PERIODOS_VISITA = ['manha', 'tarde', 'noite'] as const;

/** Faixa de renda informada no lead: ids das faixas de src/config/financiamento.ts. */
export const FAIXAS_RENDA_LEAD = [
  'faixa1',
  'faixa2',
  'faixa3',
  'faixa4',
  'sbpe',
  'prefiro_nao_informar',
] as const;
