'use client';

import { Check, GitCompareArrows, X } from 'lucide-react';
import { rastrear } from '@/lib/analytics';
import { useMontado } from '@/lib/cliente/armazenamento';
import { useComparacao } from '@/lib/cliente/estado';
import { cn } from '@/lib/utils';

/** Botão de comparação do card (só na listagem de imóveis). */
export function BotaoComparar({
  id,
  codigo,
  className,
}: {
  id: string;
  codigo: string;
  className?: string;
}) {
  const { base, comparado, definirBase, compararCom, fecharComparado, encerrar } = useComparacao();
  const montado = useMontado();
  const classe =
    'relative z-10 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors';

  if (montado && base === id) {
    return (
      <button
        type="button"
        onClick={() => {
          encerrar();
          rastrear('comparar', { codigo, acao: 'encerrar' });
        }}
        aria-pressed
        className={cn(classe, 'bg-primary text-primary-foreground hover:bg-primary/90', className)}
        title="Encerrar comparação"
      >
        <Check className="size-4" aria-hidden /> Base da comparação
        <X className="size-4 opacity-80" aria-hidden />
        <span className="sr-only"> (toque para encerrar a comparação)</span>
      </button>
    );
  }

  if (montado && base && comparado === id) {
    return (
      <button
        type="button"
        onClick={fecharComparado}
        aria-pressed
        className={cn(
          classe,
          'bg-destaque text-destaque-foreground hover:bg-destaque/90',
          className,
        )}
      >
        <Check className="size-4" aria-hidden /> Comparando
        <span className="sr-only"> imóvel {codigo}. Toque para fechar.</span>
      </button>
    );
  }

  const comBase = montado && Boolean(base);
  return (
    <button
      type="button"
      onClick={() => {
        if (comBase) compararCom(id);
        else definirBase(id);
        rastrear('comparar', { codigo, acao: comBase ? 'comparar_com' : 'definir_base' });
      }}
      aria-pressed={false}
      className={cn(classe, 'border border-primary/25 text-primary hover:bg-info-suave', className)}
    >
      <GitCompareArrows className="size-4" aria-hidden />
      {comBase ? 'Comparar com este' : 'Comparar'}
      <span className="sr-only"> imóvel {codigo}</span>
    </button>
  );
}
