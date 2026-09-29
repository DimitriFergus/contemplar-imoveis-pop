'use client';

import { CircleHelp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GLOSSARIO, type ChaveGlossario } from '@/content/glossario';

/** Termo técnico com explicação simples no ícone "?" (glossário acessível). */
export function Termo({ chave, children }: { chave: ChaveGlossario; children?: React.ReactNode }) {
  const t = GLOSSARIO[chave];
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span>{children ?? t.termo}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="relative inline-flex size-6 translate-y-1 items-center justify-center rounded-full text-primary after:absolute after:-inset-2.5 hover:bg-muted"
            aria-label={`O que é ${t.termo}?`}
          >
            <CircleHelp className="size-[1.1rem]" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 text-base leading-relaxed" side="top">
          <p className="font-bold">{t.termo}</p>
          <p className="mt-1 text-muted-foreground">{t.explicacao}</p>
        </PopoverContent>
      </Popover>
    </span>
  );
}
