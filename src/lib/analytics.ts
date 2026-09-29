import { ANALYTICS_ATIVO } from '@/config/site';

/**
 * Camada abstrata de analytics. Desativada até haver configuração
 * (NEXT_PUBLIC_ANALYTICS_ATIVO=true + script do provedor escolhido, com consentimento se
 * for não essencial). Os componentes só chamam `rastrear`, sem conhecer o provedor.
 */
export type EventoAnalytics =
  | 'clique_whatsapp'
  | 'envio_lead'
  | 'uso_simulador'
  | 'cabe_no_bolso_calculado'
  | 'favoritar'
  | 'comparar'
  | 'compartilhar'
  | 'agendar_visita_aberto';

type DadosEvento = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function rastrear(evento: EventoAnalytics, dados: DadosEvento = {}): void {
  if (typeof window === 'undefined') return;
  if (!ANALYTICS_ATIVO) {
    if (process.env.NODE_ENV === 'development')
      console.debug('[analytics desativado]', evento, dados);
    return;
  }
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: evento, ...dados });
}
