'use client';

import { useSearchParams } from 'next/navigation';
import { buscarEmLista, lerFiltros, type Filtros } from '@/lib/busca/query';
import { bairrosDe } from '@/lib/cliente/bairros';
import { useTodosResumos } from '@/lib/cliente/resumos';
import type { BairroComTotal } from '@/lib/repositorio/tipos';
import type { ImovelResumo } from '@/types';
import { CorpoComprar } from './CorpoComprar';

/** Versão estática (GitHub Pages) da página Comprar: mesma lógica de {@link ListagemEstatica}. */
export function ListagemCompraEstatica({
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
  const { imoveis: aoVivo } = useTodosResumos();
  const lista = aoVivo ?? todos;
  const filtrosUrl = lerFiltros(new URLSearchParams(params.toString()));
  const resultado = buscarEmLista(lista, { ...filtrosUrl, ...fixos });
  return (
    <CorpoComprar
      filtrosUrl={filtrosUrl}
      fixos={fixos}
      resultado={resultado}
      bairros={aoVivo ? bairrosDe(aoVivo) : bairros}
      caminho={caminho}
    />
  );
}
