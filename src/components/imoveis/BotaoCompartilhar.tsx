'use client';

import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';
import { rastrear } from '@/lib/analytics';
import { cn } from '@/lib/utils';

/** Usa o compartilhamento nativo do celular; sem ele, abre o WhatsApp com o link. */
export function BotaoCompartilhar({
  titulo,
  texto,
  codigo,
  className,
  compacto = false,
}: {
  titulo: string;
  texto: string;
  codigo: string;
  className?: string;
  compacto?: boolean;
}) {
  const [copiado, setCopiado] = useState(false);
  const compartilhar = async () => {
    const url = window.location.href.split('#')[0] ?? window.location.href;
    rastrear('compartilhar', { codigo });
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto, url });
        return;
      } catch {
        return; // cancelado pela pessoa
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`,
        '_blank',
        'noopener',
      );
    }
  };
  return (
    <button
      type="button"
      onClick={compartilhar}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border bg-background font-semibold hover:bg-muted',
        compacto ? 'size-11' : 'px-4',
        className,
      )}
      aria-label={compacto ? 'Compartilhar imóvel' : undefined}
    >
      {copiado ? (
        <Check className="size-5 text-sucesso" aria-hidden />
      ) : (
        <Share2 className="size-5" aria-hidden />
      )}
      {!compacto && (copiado ? 'Link copiado!' : 'Compartilhar')}
      <span className="sr-only" aria-live="polite">
        {copiado ? 'Link copiado' : ''}
      </span>
    </button>
  );
}
