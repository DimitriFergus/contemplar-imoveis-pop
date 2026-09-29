'use client';

import { useRouter } from 'next/navigation';
import { useId } from 'react';
import {
  ORDENACOES,
  paraQueryString,
  type Filtros,
  type Ordenacao as TipoOrdenacao,
} from '@/lib/busca/query';

export function Ordenacao({
  filtros,
  caminho,
  fixos = {},
}: {
  filtros: Filtros;
  caminho: string;
  fixos?: Partial<Filtros>;
}) {
  const router = useRouter();
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="shrink-0 text-[0.95rem] font-semibold">
        Ordenar
      </label>
      <select
        id={id}
        className="w-auto min-w-44"
        value={filtros.ordem ?? 'relevancia'}
        onChange={(e) => {
          const f: Partial<Filtros> = {
            ...filtros,
            ordem: e.target.value as TipoOrdenacao,
            pagina: undefined,
          };
          for (const chave of Object.keys(fixos)) delete f[chave as keyof Filtros];
          router.push(`${caminho}${paraQueryString(f)}`, { scroll: false });
        }}
      >
        {ORDENACOES.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}
