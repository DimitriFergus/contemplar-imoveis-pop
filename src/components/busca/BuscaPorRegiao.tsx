import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { MapaBairros } from '@/components/mapa/Mapas';
import type { BairroComLocalizacao } from '@/lib/busca/bairros-mapa';
import { plural } from '@/lib/utils/formatar';

/**
 * Ponto de entrada visual para buscar por região: mapa com um pino por bairro (toque para ver
 * os imóveis) e, ao lado, a lista dos mesmos bairros em texto — mesma informação, sem precisar
 * do mapa (acessibilidade e sem JavaScript).
 */
export function BuscaPorRegiao({ bairros }: { bairros: BairroComLocalizacao[] }) {
  if (bairros.length === 0) return null;

  const ordenados = [...bairros].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <div className="h-80 overflow-hidden rounded-2xl ring-1 ring-border sm:h-96">
        <MapaBairros bairros={bairros} />
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {ordenados.map((b) => (
          <li key={b.slug}>
            <Link
              href={`/imoveis/bairro/${b.slug}`}
              className="flex min-h-11 items-center justify-between gap-2 rounded-xl border bg-card px-4 py-2.5 font-semibold shadow-card hover:border-primary hover:text-primary"
              data-sem-sublinhado
            >
              <span className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-destaque-texto" aria-hidden />
                {b.nome}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {plural(b.total, 'imóvel', 'imóveis')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
