import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Peças visuais simples do painel (campos nativos com o mesmo estilo do site). */

export const classeCampo =
  'h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 disabled:opacity-60';

export function Campo({
  rotulo,
  id,
  erro,
  ajuda,
  obrigatorio,
  className,
  children,
}: {
  rotulo: ReactNode;
  id: string;
  erro?: string;
  ajuda?: ReactNode;
  obrigatorio?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-semibold">
        {rotulo}
        {obrigatorio && (
          <span className="text-destructive" aria-hidden>
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {ajuda && !erro && (
        <p id={`${id}-ajuda`} className="text-xs text-muted-foreground">
          {ajuda}
        </p>
      )}
      {erro && (
        <p id={`${id}-erro`} className="text-sm font-medium text-destructive" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}

export function Selecao({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(classeCampo, 'pr-8', className)} {...props} />;
}

export function AreaTexto({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(classeCampo, 'h-auto min-h-28 py-2', className)} {...props} />;
}

export function Cartao({
  titulo,
  descricao,
  acao,
  className,
  children,
}: {
  titulo?: ReactNode;
  descricao?: ReactNode;
  acao?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn('rounded-2xl border bg-card p-4 shadow-card sm:p-6', className)}>
      {(titulo || acao) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {titulo && <h2 className="text-lg font-bold">{titulo}</h2>}
            {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
          </div>
          {acao}
        </header>
      )}
      {children}
    </section>
  );
}

export function TituloPagina({
  titulo,
  descricao,
  acao,
}: {
  titulo: ReactNode;
  descricao?: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{titulo}</h1>
        {descricao && <p className="mt-1 text-muted-foreground">{descricao}</p>}
      </div>
      {acao && <div className="flex flex-wrap gap-2">{acao}</div>}
    </div>
  );
}

export function Aviso({
  tom = 'info',
  children,
  className,
}: {
  tom?: 'info' | 'sucesso' | 'erro' | 'aviso';
  children: ReactNode;
  className?: string;
}) {
  const cores = {
    info: 'bg-info-suave text-foreground',
    sucesso: 'bg-sucesso-suave text-sucesso',
    erro: 'bg-perda-suave text-perda',
    aviso: 'bg-aviso-suave text-aviso',
  } as const;
  return (
    <div
      role={tom === 'erro' ? 'alert' : 'status'}
      className={cn('rounded-xl px-4 py-3 text-[0.95rem]', cores[tom], className)}
    >
      {children}
    </div>
  );
}
