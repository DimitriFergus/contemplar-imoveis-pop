'use client';

import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { rastrear } from '@/lib/analytics';
import { useArmazenado } from '@/lib/cliente/armazenamento';
import { utmSessao } from '@/lib/cliente/estado';
import { comOrigem, linkWhatsApp } from '@/lib/utils/whatsapp';
import { IconeWhatsApp } from './IconeWhatsApp';

interface Props extends Omit<ComponentProps<typeof Button>, 'asChild' | 'children'> {
  mensagem: string;
  rotulo?: string;
  local: string;
  codigoImovel?: string;
}

/** Botão de WhatsApp com mensagem pré-preenchida e a origem (UTM) da visita. */
export function BotaoWhatsApp({
  mensagem,
  rotulo = 'Chamar no WhatsApp',
  local,
  codigoImovel,
  variant = 'whatsapp',
  ...props
}: Props) {
  const utm = useArmazenado(utmSessao);
  const href = linkWhatsApp(comOrigem(mensagem, utm));
  return (
    <Button asChild variant={variant} {...props}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => rastrear('clique_whatsapp', { local, codigo: codigoImovel })}
        data-evento="whatsapp"
      >
        <IconeWhatsApp className="size-5" />
        {rotulo}
      </a>
    </Button>
  );
}
