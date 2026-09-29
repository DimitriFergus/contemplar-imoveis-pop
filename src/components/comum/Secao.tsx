import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Secao({
  id,
  titulo,
  subtitulo,
  acao,
  children,
  className,
}: {
  id: string;
  titulo: ReactNode;
  subtitulo?: ReactNode;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={`titulo-${id}`}
      className={cn('container-site py-12 sm:py-16', className)}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h2 id={`titulo-${id}`} className="text-2xl font-extrabold sm:text-3xl">
            {titulo}
          </h2>
          {subtitulo && <p className="mt-2 text-lg text-muted-foreground">{subtitulo}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}
