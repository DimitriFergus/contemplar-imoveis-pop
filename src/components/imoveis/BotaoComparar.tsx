'use client';

import { Check, GitCompareArrows } from 'lucide-react';
import { rastrear } from '@/lib/analytics';
import { useMontado } from '@/lib/cliente/armazenamento';
import { useComparar } from '@/lib/cliente/estado';
import { cn } from '@/lib/utils';

export function BotaoComparar({
  id,
  codigo,
  compacto = false,
  className,
}: {
  id: string;
  codigo: string;
  compacto?: boolean;
  className?: string;
}) {
  const { estaNaLista, alternar, cheio, max } = useComparar();
  const montado = useMontado();
  const ativo = montado && estaNaLista(id);
  const bloqueado = montado && !ativo && cheio;
  return (
    <button
      type="button"
      onClick={() => {
        alternar(id);
        rastrear('comparar', { codigo, acao: ativo ? 'remover' : 'adicionar' });
      }}
      aria-pressed={ativo}
      disabled={bloqueado}
      title={bloqueado ? `Você já escolheu ${max} imóveis para comparar` : undefined}
      className={cn(
        'relative z-10 inline-flex min-h-11 items-center gap-1.5 rounded-xl font-semibold disabled:opacity-50',
        compacto
          ? 'px-2 text-sm text-primary hover:bg-muted'
          : 'justify-center border bg-background px-4 hover:bg-muted',
        ativo && 'text-sucesso',
        className,
      )}
    >
      {ativo ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <GitCompareArrows className="size-4" aria-hidden />
      )}
      {ativo ? 'Na comparação' : 'Comparar'}
      <span className="sr-only"> imóvel {codigo}</span>
    </button>
  );
}
