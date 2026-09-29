import { Quote } from 'lucide-react';
import { MODO_DEMO } from '@/config/site';
import { Selo } from '@/components/comum/Selo';
import { DEPOIMENTOS } from '@/content/depoimentos';

export function Depoimentos() {
  // Depoimentos ilustrativos só aparecem no modo demonstração, sempre identificados.
  const lista = DEPOIMENTOS.filter((d) => !d.ilustrativo || MODO_DEMO);
  if (lista.length === 0) return null;
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {lista.map((d) => (
        <li key={d.nome} className="flex flex-col rounded-2xl border bg-card p-5">
          <Quote className="size-8 text-destaque-texto" aria-hidden />
          <blockquote className="mt-2 flex-1 text-lg">&ldquo;{d.texto}&rdquo;</blockquote>
          <p className="mt-4 font-bold">{d.nome}</p>
          <p className="text-sm text-muted-foreground">{d.contexto}</p>
          {d.ilustrativo && (
            <Selo tom="aviso" className="mt-2 self-start">
              Depoimento ilustrativo
            </Selo>
          )}
        </li>
      ))}
    </ul>
  );
}
