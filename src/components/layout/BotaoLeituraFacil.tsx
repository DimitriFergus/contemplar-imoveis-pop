'use client';

import { useEffect } from 'react';
import { useArmazenado } from '@/lib/cliente/armazenamento';
import { leituraFacil } from '@/lib/cliente/estado';
import { cn } from '@/lib/utils';

/** Script executado antes da primeira pintura para aplicar a preferência salva. */
export const SCRIPT_LEITURA_FACIL = `try{if(localStorage.getItem('cp:leitura-facil')==='true')document.documentElement.classList.add('leitura-facil')}catch(e){}`;

/** Ícone "Aa" no cabeçalho: liga/desliga letra maior e mais contraste. */
export function BotaoLeituraFacil({ className }: { className?: string }) {
  const ativo = useArmazenado(leituraFacil);

  useEffect(() => {
    document.documentElement.classList.toggle('leitura-facil', ativo);
  }, [ativo]);

  const rotulo = ativo
    ? 'Desativar leitura fácil'
    : 'Ativar leitura fácil (letra maior e mais contraste)';

  return (
    <button
      type="button"
      onClick={() => leituraFacil.gravar(!ativo)}
      aria-pressed={ativo}
      aria-label={rotulo}
      title={rotulo}
      className={cn(
        'inline-flex size-11 items-center justify-center rounded-xl font-heading leading-none transition-colors',
        ativo
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'text-foreground hover:bg-muted',
        className,
      )}
    >
      <span aria-hidden className="flex items-end">
        <span className="text-[1.3rem] font-extrabold">A</span>
        <span className="text-[0.95rem] font-bold">a</span>
      </span>
    </button>
  );
}
