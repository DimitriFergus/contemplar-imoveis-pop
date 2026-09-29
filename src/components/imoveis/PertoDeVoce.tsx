import { Bus, GraduationCap, HeartPulse, ShoppingCart, Trees } from 'lucide-react';
import { ROTULO_PROXIMIDADE } from '@/lib/rotulos';
import { formatarDistancia } from '@/lib/utils/formatar';
import type { Proximidade, TipoProximidade } from '@/types';

const ICONES: Record<TipoProximidade, typeof Bus> = {
  escola: GraduationCap,
  saude: HeartPulse,
  mercado: ShoppingCart,
  transporte: Bus,
  lazer: Trees,
};

export function PertoDeVoce({ proximidades }: { proximidades: Proximidade[] }) {
  if (proximidades.length === 0) return null;
  return (
    <div>
      <h3 className="text-lg font-bold">Perto de você</h3>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {proximidades.map((p) => {
          const Icone = ICONES[p.tipo];
          return (
            <li
              key={`${p.tipo}-${p.nome}`}
              className="flex items-center gap-3 rounded-xl border bg-card p-3"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-info-suave text-primary">
                <Icone className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{p.nome}</span>
                <span className="text-sm text-muted-foreground">{ROTULO_PROXIMIDADE[p.tipo]}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                ~{formatarDistancia(p.distanciaMetros)}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-sm text-muted-foreground">Distâncias aproximadas, em linha reta.</p>
    </div>
  );
}
