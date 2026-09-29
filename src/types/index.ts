import type { z } from 'zod';
import type {
  ORIGENS_LEAD,
  PERIODOS_VISITA,
  SITUACOES_IMOVEL,
  STATUS_IMOVEL,
  TIPOS_IMOVEL,
  TIPOS_PROXIMIDADE,
} from '@/lib/constantes';
import type {
  corretorSchema,
  fotoSchema,
  imovelSchema,
  proximidadeSchema,
} from '@/lib/schemas/imovel';
import type { LeadValidado } from '@/lib/schemas/lead';

export type TipoImovel = (typeof TIPOS_IMOVEL)[number];
export type SituacaoImovel = (typeof SITUACOES_IMOVEL)[number];
export type StatusImovel = (typeof STATUS_IMOVEL)[number];
export type TipoProximidade = (typeof TIPOS_PROXIMIDADE)[number];

export type Imovel = z.infer<typeof imovelSchema>;
export type Foto = z.infer<typeof fotoSchema>;
export type Proximidade = z.infer<typeof proximidadeSchema>;
export type Corretor = z.infer<typeof corretorSchema>;
export type CondicoesPagamento = Imovel['condicoes'];

export type OrigemLead = (typeof ORIGENS_LEAD)[number];
export type PeriodoVisita = (typeof PERIODOS_VISITA)[number];

export interface Lead extends Omit<LeadValidado, 'site'> {
  id: string;
  criadoEm: string;
}

/** Versão enxuta do imóvel, usada em cards, mapa, favoritos e comparador. */
export interface ImovelResumo {
  id: string;
  codigo: string;
  slug: string;
  titulo: string;
  tipo: TipoImovel;
  situacao: SituacaoImovel;
  previsaoEntrega?: string;
  preco: number;
  parcelaEstimada: number;
  condominioMensal?: number;
  bairro: string;
  cidade: string;
  uf: string;
  quartos: number;
  banheiros: number;
  vagas: number;
  areaUtilM2: number;
  condicoes: CondicoesPagamento;
  foto: Foto | null;
  totalFotos: number;
  localizacaoAproximada: Imovel['localizacaoAproximada'];
  status: StatusImovel;
  exemplo: boolean;
  destaque: boolean;
  publicadoEm: string;
}
