'use client';

import { useSearchParams } from 'next/navigation';
import { buscarEmLista, lerFiltros, type Filtros } from '@/lib/busca/query';
import type { BairroComTotal } from '@/lib/repositorio/tipos';
import type { ImovelResumo } from '@/types';
import { CorpoListagem } from './CorpoListagem';

/** Versão estática (GitHub Pages): lê os filtros da URL e filtra no navegador. */
export function ListagemEstatica({
  todos,
  bairros,
  caminho,
  fixos,
}: {
  todos: ImovelResumo[];
  bairros: BairroComTotal[];
  caminho: string;
  fixos: Partial<Filtros>;
}) {
  const params = useSearchParams();
  const filtrosUrl = lerFiltros(new URLSearchParams(params.toString()));
  const resultado = buscarEmLista(todos, { ...filtrosUrl, ...fixos });
  return (
    <CorpoListagem
      filtrosUrl={filtrosUrl}
      fixos={fixos}
      resultado={resultado}
      bairros={bairros}
      caminho={caminho}
    />
  );
}
