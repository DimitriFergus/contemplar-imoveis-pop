import { z } from 'zod';

import { urlMidiaPermitida } from '@/lib/utils/url-segura';
import { SITUACOES_IMOVEL, STATUS_IMOVEL, TIPOS_IMOVEL, TIPOS_PROXIMIDADE } from '@/lib/constantes';

export { SITUACOES_IMOVEL, STATUS_IMOVEL, TIPOS_IMOVEL, TIPOS_PROXIMIDADE };

export const tipoImovelSchema = z.enum(TIPOS_IMOVEL);
export const situacaoImovelSchema = z.enum(SITUACOES_IMOVEL);

const dataIso = z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'data inválida');

export const fotoSchema = z.object({
  arquivo: z.string().min(1),
  alt: z.string().min(5, 'descrição da foto (alt) muito curta').max(300),
});

export const proximidadeSchema = z.object({
  tipo: z.enum(TIPOS_PROXIMIDADE),
  nome: z.string().min(2),
  distanciaMetros: z.number().int().positive(),
});

export const imovelBaseSchema = z.object({
  id: z.string().min(1),
  codigo: z.string().regex(/^CP-\d{4}$/, 'código deve seguir o formato CP-0000'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug inválido'),
  titulo: z.string().min(10).max(90),
  descricao: z.string().min(40),
  tipo: tipoImovelSchema,
  situacao: situacaoImovelSchema,
  previsaoEntrega: z.string().optional(),
  preco: z.number().positive(),
  condominioMensal: z.number().nonnegative().optional(),
  iptuAnual: z.number().nonnegative().optional(),
  cidade: z.string().min(2),
  uf: z.string().length(2),
  bairro: z.string().min(2),
  localizacaoAproximada: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    raioMetros: z.number().int().min(150, 'raio mínimo de 150 m para não expor o endereço'),
  }),
  quartos: z.number().int().min(0).max(10),
  suites: z.number().int().min(0).max(10),
  banheiros: z.number().int().min(1).max(10),
  vagas: z.number().int().min(0).max(10),
  areaUtilM2: z.number().positive(),
  areaTerrenoM2: z.number().positive().optional(),
  caracteristicas: z.array(z.string().min(2)),
  lazer: z.array(z.string().min(2)),
  condicoes: z.object({
    aceitaMCMV: z.boolean(),
    aceitaFGTS: z.boolean(),
    aceitaSBPE: z.boolean(),
    aceitaConsorcio: z.boolean(),
    aceitaPermuta: z.boolean(),
    entradaFacilitada: z.boolean(),
  }),
  fotos: z.array(fotoSchema),
  videoUrl: z.url().refine(urlMidiaPermitida, 'use um link https do YouTube').optional(),
  tour360Url: z
    .url()
    .refine(urlMidiaPermitida, 'use um link https do Matterport, Kuula ou YouTube')
    .optional(),
  proximidades: z.array(proximidadeSchema),
  destaque: z.boolean(),
  status: z.enum(STATUS_IMOVEL),
  corretorResponsavelId: z.string().min(1),
  exemplo: z.boolean(),
  publicadoEm: dataIso,
  atualizadoEm: dataIso,
});

/** Regras que envolvem mais de um campo (valem para o site e para o painel). */
function regrasImovel(
  imovel: Pick<
    z.infer<typeof imovelBaseSchema>,
    'situacao' | 'previsaoEntrega' | 'suites' | 'quartos'
  >,
  ctx: z.RefinementCtx,
) {
  if (
    (imovel.situacao === 'na_planta' || imovel.situacao === 'em_construcao') &&
    !imovel.previsaoEntrega
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['previsaoEntrega'],
      message: 'obrigatório para imóveis na planta ou em construção',
    });
  }
  if (imovel.suites > imovel.quartos) {
    ctx.addIssue({
      code: 'custom',
      path: ['suites'],
      message: 'não pode ser maior que o número de quartos',
    });
  }
}

export const imovelSchema = imovelBaseSchema.superRefine(regrasImovel);

/** Campos controlados pelo sistema (código, endereço, datas) e não digitados no painel. */
const CAMPOS_DE_SISTEMA = {
  id: true,
  codigo: true,
  slug: true,
  publicadoEm: true,
  atualizadoEm: true,
  exemplo: true,
  status: true,
} as const;

/** Status no painel: rascunho não aparece no site; publicado = "disponível" para o público. */
export const STATUS_PAINEL = ['rascunho', 'publicado', 'reservado', 'vendido'] as const;
export type StatusPainel = (typeof STATUS_PAINEL)[number];

/** Formulário do painel: o mesmo schema do site, sem os campos de sistema, com status do painel. */
export const imovelFormularioSchema = imovelBaseSchema
  .omit(CAMPOS_DE_SISTEMA)
  .extend({ status: z.enum(STATUS_PAINEL) })
  .superRefine(regrasImovel);
export type ImovelFormulario = z.infer<typeof imovelFormularioSchema>;

export { CAMPOS_FORA_DE_DADOS } from '@/lib/repositorio/linha';

export const corretorSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(2),
  creci: z.string().min(1),
  whatsapp: z.string().min(1),
  foto: z.string().optional(),
});
