'use client';

import { GitCompareArrows } from 'lucide-react';
import Link from 'next/link';
import { useMontado } from '@/lib/cliente/armazenamento';
import { useComparar } from '@/lib/cliente/estado';

/** Atalho flutuante para a comparação quando há imóveis escolhidos. */
export function BarraComparar() {
  const { ids, max } = useComparar();
  const montado = useMontado();
  if (!montado || ids.length === 0) return null;
  return (
    <Link
      href="/comparar"
      className="fixed bottom-4 left-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 font-bold text-primary-foreground shadow-lg ring-4 ring-background"
      data-nao-imprimir
    >
      <GitCompareArrows className="size-5" aria-hidden />
      Comparar ({ids.length}/{max})
    </Link>
  );
}
