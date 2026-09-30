'use client';

import { useSearchParams } from 'next/navigation';
import { buscarEmLista, lerFiltros, type Filtros } from '@/lib/busca/query';
import { bairrosDe } from '@/lib/cliente/bairros';
import { useTodosResumos } from '@/lib/cliente/resumos';
import type { BairroComTotal } from '@/lib/repositorio/tipos';
import type { ImovelResumo } from '@/types';
import { CorpoListagem } from './CorpoListagem';

/**
 * Versão estática (GitHub Pages): lê os filtros da URL e filtra no navegador. A lista gerada
 * na publicação aparece primeiro e é trocada pelos imóveis lidos do banco na hora, para que
 * um imóvel salvo no painel apareça sem esperar uma nova publicação.
 */
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
  const { imoveis: aoVivo } = useTodosResumos();
  const lista = aoVivo ?? todos;
  const filtrosUrl = lerFiltros(new URLSearchParams(params.toString()));
  const resultado = buscarEmLista(lista, { ...filtrosUrl, ...fixos });
  return (
    <CorpoListagem
      filtrosUrl={filtrosUrl}
      fixos={fixos}
      resultado={resultado}
      bairros={aoVivo ? bairrosDe(aoVivo) : bairros}
      caminho={caminho}
    />
  );
}
