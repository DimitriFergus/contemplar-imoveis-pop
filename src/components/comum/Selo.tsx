import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const ESTILOS = {
  neutro: 'bg-muted text-foreground ring-1 ring-border',
  info: 'bg-info-suave text-primary',
  sucesso: 'bg-sucesso-suave text-sucesso',
  aviso: 'bg-aviso-suave text-aviso',
  destaque: 'bg-destaque text-destaque-foreground',
  escuro: 'bg-marinho/90 text-white',
} as const;

export function Selo({
  children,
  tom = 'neutro',
  className,
  icone,
  quebrar = false,
}: {
  children: ReactNode;
  tom?: keyof typeof ESTILOS;
  className?: string;
  icone?: ReactNode;
  /** Texto digitado pela equipe (pode ser longo): quebra a linha em vez de estourar a tela. */
  quebrar?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.8rem] font-semibold',
        quebrar
          ? 'max-w-full leading-snug [overflow-wrap:anywhere]'
          : 'leading-none whitespace-nowrap',
        ESTILOS[tom],
        className,
      )}
    >
      {icone}
      {children}
    </span>
  );
}
