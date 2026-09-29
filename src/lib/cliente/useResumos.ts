'use client';

import { useTodosResumos } from './resumos';

/** Resumos dos imóveis salvos no navegador (favoritos/comparador), na ordem dos ids. */
export function useResumos(ids: string[], ativo = true) {
  const { imoveis: todos, erro } = useTodosResumos(ativo && ids.length > 0);
  const porId = new Map((todos ?? []).map((i) => [i.id, i]));
  const imoveis = ids.map((id) => porId.get(id)).filter((i) => i !== undefined);
  const carregando = ativo && ids.length > 0 && todos === null && !erro;
  return { imoveis, carregando, erro };
}
