import { List, Map } from 'lucide-react';
import Link from 'next/link';
import { paraQueryString, type Filtros } from '@/lib/busca/query';
import { cn } from '@/lib/utils';

export function AlternarVisao({
  filtros,
  caminho,
}: {
  filtros: Partial<Filtros>;
  caminho: string;
}) {
  const atual = filtros.visao ?? 'lista';
  const opcoes = [
    { valor: 'lista' as const, rotulo: 'Lista', icone: List },
    { valor: 'mapa' as const, rotulo: 'Mapa', icone: Map },
  ];
  return (
    <div
      className="inline-flex rounded-xl border p-1"
      role="group"
      aria-label="Modo de visualização"
    >
      {opcoes.map(({ valor, rotulo, icone: Icone }) => (
        <Link
          key={valor}
          href={`${caminho}${paraQueryString({ ...filtros, visao: valor, pagina: undefined })}`}
          scroll={false}
          aria-current={atual === valor ? 'true' : undefined}
          className={cn(
            'inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 font-semibold',
            atual === valor ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          )}
          data-sem-sublinhado
        >
          <Icone className="size-4" aria-hidden />
          {rotulo}
        </Link>
      ))}
    </div>
  );
}
