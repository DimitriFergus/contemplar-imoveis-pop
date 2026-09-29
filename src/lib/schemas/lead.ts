import { z } from 'zod';

import { FAIXAS_RENDA_LEAD, ORIGENS_LEAD, PERIODOS_VISITA } from '@/lib/constantes';

export { FAIXAS_RENDA_LEAD, ORIGENS_LEAD, PERIODOS_VISITA };

/** Aceita (11) 91234-5678, 11912345678 ou +55 11 91234-5678. Normaliza para só dígitos com 55. */
export const whatsappSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .transform((v) => (v.length >= 12 && v.startsWith('55') ? v.slice(2) : v))
  .refine((v) => /^[1-9]{2}9?\d{8}$/.test(v), 'Informe um WhatsApp válido com DDD')
  .transform((v) => `55${v}`);

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const utmSchema = z
  .object({
    source: textoOpcional(100),
    medium: textoOpcional(100),
    campaign: textoOpcional(100),
    content: textoOpcional(100),
    term: textoOpcional(100),
  })
  .partial();

/** Dados enviados pelo navegador para POST /api/leads. */
export const leadEntradaSchema = z
  .object({
    origem: z.enum(ORIGENS_LEAD),
    nome: z.string().trim().min(2, 'Informe seu nome').max(120),
    whatsapp: whatsappSchema,
    email: z
      .union([z.literal(''), z.email('E-mail inválido').max(160)])
      .optional()
      .transform((v) => (v ? v : undefined)),
    rendaFamiliarFaixa: z.enum(FAIXAS_RENDA_LEAD).optional(),
    codigoImovel: z
      .string()
      .regex(/^CP-\d{4}$/)
      .optional(),
    mensagem: textoOpcional(1500),
    dataVisitaPreferida: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    periodoPreferido: z.enum(PERIODOS_VISITA).optional(),
    utm: utmSchema.optional(),
    consentimentoLGPD: z.literal(true, 'É preciso concordar com a Política de Privacidade'),
    /** Honeypot: campo invisível para pessoas. Se vier preenchido, é robô. */
    site: z.string().max(0).optional(),
  })
  .superRefine((lead, ctx) => {
    if (lead.origem === 'agendamento_visita') {
      if (!lead.dataVisitaPreferida)
        ctx.addIssue({
          code: 'custom',
          path: ['dataVisitaPreferida'],
          message: 'Escolha uma data',
        });
      if (!lead.periodoPreferido)
        ctx.addIssue({ code: 'custom', path: ['periodoPreferido'], message: 'Escolha um período' });
    }
  });

export type LeadEntrada = z.input<typeof leadEntradaSchema>;
export type LeadValidado = z.output<typeof leadEntradaSchema>;
