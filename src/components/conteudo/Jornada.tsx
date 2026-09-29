import { Calculator, FileSignature, House, KeyRound, Landmark } from 'lucide-react';
import { JORNADA, type PassoJornada } from '@/content/jornada';

const ICONES: Record<PassoJornada['icone'], typeof House> = {
  calculadora: Calculator,
  casa: House,
  banco: Landmark,
  contrato: FileSignature,
  chave: KeyRound,
};

/** Linha do tempo "Da simulação às chaves". */
export function Jornada({ detalhada = false }: { detalhada?: boolean }) {
  return (
    <ol className="grid gap-4 md:grid-cols-5">
      {JORNADA.map((p, i) => {
        const Icone = ICONES[p.icone];
        return (
          <li
            key={p.titulo}
            className="relative flex gap-4 rounded-2xl border bg-card p-5 md:flex-col"
            data-imprimir-quebra
          >
            <div className="flex shrink-0 flex-col items-center gap-2 md:flex-row">
              <span className="grid size-12 place-items-center rounded-full bg-destaque text-destaque-foreground">
                <Icone className="size-6" aria-hidden />
              </span>
              <span className="text-sm font-bold text-muted-foreground">Passo {i + 1}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold">{p.titulo}</h3>
              <p className="mt-1 text-muted-foreground">{p.resumo}</p>
              {detalhada && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-[0.95rem]">
                  {p.detalhes.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
