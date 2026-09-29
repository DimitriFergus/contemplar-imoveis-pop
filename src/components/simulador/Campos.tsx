'use client';

import { useId, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { formatarNumero } from '@/lib/utils/formatar';
import { cn } from '@/lib/utils';

interface CampoMoedaProps {
  rotulo: ReactNode;
  valor: number;
  aoMudar: (v: number) => void;
  ajuda?: ReactNode;
  max?: number;
  nome?: string;
  className?: string;
}

/** Campo em reais: aceita só dígitos e mostra o valor formatado (R$ 12.345). */
export function CampoMoeda({
  rotulo,
  valor,
  aoMudar,
  ajuda,
  max = 99_999_999,
  nome,
  className,
}: CampoMoedaProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block font-semibold">
        {rotulo}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
          R$
        </span>
        <Input
          id={id}
          name={nome}
          inputMode="numeric"
          autoComplete="off"
          className="pl-10 text-lg font-semibold tabular-nums"
          value={valor ? formatarNumero(valor) : ''}
          placeholder="0"
          aria-describedby={ajuda ? `${id}-ajuda` : undefined}
          onChange={(e) => {
            const digitos = e.target.value.replace(/\D/g, '').slice(0, 9);
            aoMudar(Math.min(max, Number(digitos || 0)));
          }}
        />
      </div>
      {ajuda && (
        <p id={`${id}-ajuda`} className="mt-1 text-sm text-muted-foreground">
          {ajuda}
        </p>
      )}
    </div>
  );
}

export function CampoSelect<T extends string | number>({
  rotulo,
  valor,
  opcoes,
  aoMudar,
  className,
}: {
  rotulo: ReactNode;
  valor: T;
  opcoes: { valor: T; rotulo: string }[];
  aoMudar: (v: T) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block font-semibold">
        {rotulo}
      </label>
      <select
        id={id}
        value={String(valor)}
        onChange={(e) => {
          const escolhida = opcoes.find((o) => String(o.valor) === e.target.value);
          if (escolhida) aoMudar(escolhida.valor);
        }}
      >
        {opcoes.map((o) => (
          <option key={String(o.valor)} value={String(o.valor)}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Alternância de duas ou mais opções (ex.: SAC | Price), acessível como grupo de rádio. */
export function Alternancia<T extends string>({
  rotulo,
  valor,
  opcoes,
  aoMudar,
  className,
}: {
  rotulo: ReactNode;
  valor: T;
  opcoes: { valor: T; rotulo: string }[];
  aoMudar: (v: T) => void;
  className?: string;
}) {
  const nome = useId();
  return (
    <fieldset className={className}>
      <legend className="mb-1 font-semibold">{rotulo}</legend>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-muted p-1">
        {opcoes.map((o) => (
          <label
            key={o.valor}
            className={cn(
              'flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-3 text-center font-semibold has-focus-visible:ring-3 has-focus-visible:ring-ring',
              valor === o.valor ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground',
            )}
          >
            <input
              type="radio"
              name={nome}
              value={o.valor}
              checked={valor === o.valor}
              onChange={() => aoMudar(o.valor)}
              className="sr-only"
            />
            {o.rotulo}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function LinhaResultado({
  rotulo,
  valor,
  destaque = false,
  ajuda,
}: {
  rotulo: ReactNode;
  valor: ReactNode;
  destaque?: boolean;
  ajuda?: ReactNode;
}) {
  return (
    <div
      className={cn('flex items-baseline justify-between gap-4 py-2', destaque && 'border-t pt-3')}
    >
      <dt className={cn(destaque ? 'font-bold' : 'text-muted-foreground')}>
        {rotulo}
        {ajuda && <span className="block text-sm font-normal text-muted-foreground">{ajuda}</span>}
      </dt>
      <dd
        className={cn(
          'text-right whitespace-nowrap tabular-nums',
          destaque ? 'text-xl font-extrabold text-primary' : 'font-semibold',
        )}
      >
        {valor}
      </dd>
    </div>
  );
}
