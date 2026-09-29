import { X } from 'lucide-react';
import Link from 'next/link';
import { chipsAtivos, paraQueryString, type Filtros } from '@/lib/busca/filtros';

export function ChipsFiltros({
  filtros,
  caminho,
  nomesBairros,
  fixos = {},
}: {
  filtros: Filtros;
  caminho: string;
  nomesBairros: Record<string, string>;
  fixos?: Partial<Filtros>;
}) {
  const ocultos = new Set(Object.keys(fixos));
  const chips = chipsAtivos(filtros, nomesBairros).filter(
    (c) => !ocultos.has(c.chave.split('-')[0] ?? ''),
  );
  if (chips.length === 0) return null;
  const limpar = (f: Partial<Filtros>) => {
    const copia = { ...f };
    for (const chave of ocultos) delete copia[chave as keyof Filtros];
    return copia;
  };
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtros ativos">
      {chips.map((c) => (
        <Link
          key={c.chave}
          href={`${caminho}${paraQueryString(limpar(c.semEste))}`}
          scroll={false}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-primary/30 bg-info-suave py-1.5 pr-2.5 pl-3.5 text-[0.95rem] font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
          aria-label={`Remover filtro: ${c.rotulo}`}
          data-sem-sublinhado
        >
          {c.rotulo}
          <X className="size-4" aria-hidden />
        </Link>
      ))}
      <Link
        href={`${caminho}${paraQueryString({ ordem: filtros.ordem, visao: filtros.visao })}`}
        scroll={false}
        className="inline-flex min-h-11 items-center px-2 text-[0.95rem] font-semibold text-muted-foreground underline"
      >
        Limpar tudo
      </Link>
    </div>
  );
}
