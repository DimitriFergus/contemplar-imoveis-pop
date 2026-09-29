'use client';

import { CircleCheck, CircleX, Scale } from 'lucide-react';
import { compararImoveis, placar, type Diferenca } from '@/lib/comparacao';
import { useMontado } from '@/lib/cliente/armazenamento';
import { useComparacao } from '@/lib/cliente/estado';
import { useTodosResumos } from '@/lib/cliente/resumos';
import type { ImovelResumo } from '@/types';
import { cn } from '@/lib/utils';

export function ChipDiferenca({ d, className }: { d: Diferenca; className?: string }) {
  const ganha = d.resultado === 'ganha';
  const Icone = ganha ? CircleCheck : CircleX;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.8rem] leading-none font-semibold',
        ganha ? 'bg-sucesso-suave text-sucesso' : 'bg-perda-suave text-perda',
        className,
      )}
    >
      <Icone className="size-3.5 shrink-0" aria-hidden />
      <span className="sr-only">{ganha ? 'Ganha:' : 'Perde:'} </span>
      {d.texto}
    </span>
  );
}

/**
 * No card da listagem: o que este imóvel ganha (verde) e perde (vermelho) em relação ao
 * imóvel base da comparação.
 */
export function DiferencasCard({ imovel }: { imovel: ImovelResumo }) {
  const { base, comparado } = useComparacao();
  const montado = useMontado();
  const { imoveis } = useTodosResumos(montado && Boolean(base));
  if (!montado || !base) return null;

  if (base === imovel.id) {
    return (
      <p
        data-comparacao="base"
        className="flex items-center gap-2 rounded-xl bg-info-suave px-3 py-2 text-sm font-semibold text-primary"
      >
        <Scale className="size-4 shrink-0" aria-hidden />
        Imóvel base: os outros cards mostram o que ganham ou perdem em relação a este.
      </p>
    );
  }

  const imovelBase = imoveis?.find((i) => i.id === base);
  if (!imovelBase) return null;
  const diferencas = compararImoveis(imovel, imovelBase).filter((d) => d.resultado !== 'igual');
  const { ganha, perde } = placar(diferencas);

  return (
    <div
      className="space-y-2 rounded-xl border border-dashed p-2.5"
      aria-label={`Comparado ao ${imovelBase.codigo}`}
      data-comparacao={comparado === imovel.id ? 'comparado' : undefined}
    >
      <p className="text-xs font-semibold text-muted-foreground">
        Comparado ao {imovelBase.codigo}: <span className="text-sucesso">ganha em {ganha}</span> ·{' '}
        <span className="text-perda">perde em {perde}</span>
      </p>
      {diferencas.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {diferencas.slice(0, 5).map((d) => (
            <li key={d.chave}>
              <ChipDiferenca d={d} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Mesmas características do imóvel base.</p>
      )}
    </div>
  );
}
