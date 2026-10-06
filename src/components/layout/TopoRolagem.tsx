'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Rolagem mínima (px) antes de a barra aparecer na página inicial. */
const LIMIAR = 80;

/**
 * Topo do site. Na página inicial o vídeo do hero aparece inteiro, sem barra: ela desce ao rolar
 * a página para baixo e some ao rolar para cima. Nas outras páginas a barra fica sempre fixa.
 */
export function TopoRolagem({ faixa, children }: { faixa: ReactNode; children: ReactNode }) {
  const inicio = usePathname() === '/';
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (!inicio) return;
    let anterior = window.scrollY;
    let quadro = 0;
    const aoRolar = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => {
        const atual = window.scrollY;
        if (atual <= LIMIAR) setVisivel(false);
        else if (Math.abs(atual - anterior) > 4) setVisivel(atual > anterior);
        anterior = atual;
      });
    };
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    return () => {
      window.removeEventListener('scroll', aoRolar);
      cancelAnimationFrame(quadro);
    };
  }, [inicio]);

  if (!inicio) {
    return (
      <>
        {faixa}
        <div className="sticky top-0 z-40">{children}</div>
      </>
    );
  }

  return (
    <div
      className={cn(
        'fixed inset-x-0 top-0 z-40 shadow-md transition-transform duration-300 ease-out motion-reduce:transition-none',
        // Quem navega pelo teclado também faz a barra aparecer.
        visivel ? 'translate-y-0' : '-translate-y-full focus-within:translate-y-0',
      )}
    >
      {faixa}
      {children}
    </div>
  );
}
