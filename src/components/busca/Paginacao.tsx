import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { paraQueryString, type Filtros } from '@/lib/busca/query';
import { cn } from '@/lib/utils';

/** Paginação com links reais (bom para SEO e para o botão "voltar" do navegador). */
export function Paginacao({
  filtros,
  caminho,
  pagina,
  totalPaginas,
}: {
  filtros: Partial<Filtros>;
  caminho: string;
  pagina: number;
  totalPaginas: number;
}) {
  if (totalPaginas <= 1) return null;
  const href = (p: number) => `${caminho}${paraQueryString({ ...filtros, pagina: p })}`;
  const classe =
    'inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border px-3 font-semibold';
  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-center gap-2">
      {pagina > 1 ? (
        <Link href={href(pagina - 1)} rel="prev" className={cn(classe, 'hover:bg-muted')}>
          <ChevronLeft className="size-4" aria-hidden /> Anterior
        </Link>
      ) : null}
      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) =>
        p === pagina ? (
          <span
            key={p}
            aria-current="page"
            className={cn(classe, 'border-primary bg-primary text-primary-foreground')}
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className={cn(classe, 'hover:bg-muted')}
            aria-label={`Página ${p}`}
          >
            {p}
          </Link>
        ),
      )}
      {pagina < totalPaginas ? (
        <Link href={href(pagina + 1)} rel="next" className={cn(classe, 'hover:bg-muted')}>
          Próxima <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : null}
    </nav>
  );
}
