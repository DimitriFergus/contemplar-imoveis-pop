import { Info } from 'lucide-react';
import { AVISO_SIMULACAO } from '@/config/financiamento';
import { cn } from '@/lib/utils';

/** Aviso obrigatório junto a qualquer parcela ou simulação. */
export function AvisoSimulacao({ className }: { className?: string }) {
  return (
    <p
      className={cn('flex gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground', className)}
      role="note"
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{AVISO_SIMULACAO}</span>
    </p>
  );
}
