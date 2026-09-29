'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Lista horizontal com rolagem por toque/arraste (nativa) e setas para quem usa mouse
 * ou tem dificuldade com o gesto. As setas somem quando não há mais para onde ir.
 */
export function Carrossel({
  rotulo,
  children,
  className,
}: {
  rotulo: string;
  children: ReactNode;
  className?: string;
}) {
  const trilho = useRef<HTMLUListElement>(null);
  const [inicio, setInicio] = useState(true);
  const [fim, setFim] = useState(false);

  const atualizar = useCallback(() => {
    const el = trilho.current;
    if (!el) return;
    setInicio(el.scrollLeft <= 4);
    setFim(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    atualizar();
    el.addEventListener('scroll', atualizar, { passive: true });
    const observador = new ResizeObserver(atualizar);
    observador.observe(el);
    return () => {
      el.removeEventListener('scroll', atualizar);
      observador.disconnect();
    };
  }, [atualizar]);

  const rolar = (direcao: 1 | -1) => {
    const el = trilho.current;
    if (!el) return;
    const primeiro = el.firstElementChild as HTMLElement | null;
    const passo = primeiro ? primeiro.offsetWidth + 16 : el.clientWidth * 0.85;
    const quantos = Math.max(1, Math.floor(el.clientWidth / passo));
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direcao * passo * quantos, behavior: reduzido ? 'auto' : 'smooth' });
  };

  // Celular: setas abaixo da lista (não cobrem o preço). Telas maiores: nas laterais.
  const classeSeta =
    'z-10 inline-flex size-12 items-center justify-center rounded-full border bg-background text-foreground shadow-md transition-opacity hover:bg-muted disabled:pointer-events-none disabled:opacity-35 sm:absolute sm:top-[38%] sm:-translate-y-1/2 sm:shadow-lg sm:disabled:opacity-0';

  return (
    <div
      className={cn('relative', className)}
      role="group"
      aria-roledescription="carrossel"
      aria-label={rotulo}
    >
      <ul
        ref={trilho}
        className="rolagem-horizontal -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0"
      >
        {children}
      </ul>
      <div className="flex justify-end gap-3 sm:contents">
        <button
          type="button"
          onClick={() => rolar(-1)}
          disabled={inicio}
          aria-label="Ver imóveis anteriores"
          className={cn(classeSeta, 'sm:-left-5')}
        >
          <ChevronLeft className="size-6" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => rolar(1)}
          disabled={fim}
          aria-label="Ver mais imóveis"
          className={cn(classeSeta, 'sm:-right-5')}
        >
          <ChevronRight className="size-6" aria-hidden />
        </button>
      </div>
    </div>
  );
}
