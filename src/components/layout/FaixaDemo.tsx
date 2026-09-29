import { Info } from 'lucide-react';
import { MODO_DEMO } from '@/config/site';

export function FaixaDemo() {
  if (!MODO_DEMO) return null;
  return (
    <div role="note" className="bg-aviso-suave text-aviso">
      <p className="container-site flex items-center justify-center gap-2 py-1.5 text-center text-sm font-semibold">
        <Info className="size-4 shrink-0" aria-hidden />
        Site em demonstração: imóveis e valores ilustrativos
      </p>
    </div>
  );
}
