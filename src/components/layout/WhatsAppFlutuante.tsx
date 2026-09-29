'use client';

import { usePathname } from 'next/navigation';
import { MENSAGENS_WHATSAPP } from '@/config/site';
import { rastrear } from '@/lib/analytics';
import { useArmazenado } from '@/lib/cliente/armazenamento';
import { utmSessao } from '@/lib/cliente/estado';
import { comOrigem, linkWhatsApp } from '@/lib/utils/whatsapp';
import { IconeWhatsApp } from '@/components/comum/IconeWhatsApp';

/** Botão flutuante de WhatsApp. Escondido nos anúncios, que têm barra de ações própria. */
export function WhatsAppFlutuante() {
  const pathname = usePathname();
  const utm = useArmazenado(utmSessao);
  const ehAnuncio = /^\/imoveis\/[^/]+-cp-\d{4}$/.test(pathname);
  if (ehAnuncio) return null;
  return (
    <a
      href={linkWhatsApp(comOrigem(MENSAGENS_WHATSAPP.geral, utm))}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => rastrear('clique_whatsapp', { local: 'flutuante' })}
      className="fixed right-4 bottom-4 z-40 inline-flex size-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg ring-4 ring-background transition-transform hover:scale-105"
      aria-label="Conversar pelo WhatsApp"
      data-nao-imprimir
    >
      <IconeWhatsApp className="size-7" />
    </a>
  );
}
