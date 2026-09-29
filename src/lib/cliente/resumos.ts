'use client';

import { useEffect, useState } from 'react';
import { BASE_PATH } from '@/config/site';
import type { ImovelResumo } from '@/types';

let promessa: Promise<ImovelResumo[]> | null = null;

/** Carrega (uma vez por página) os resumos de todos os imóveis. */
export function carregarResumos(): Promise<ImovelResumo[]> {
  promessa ??= fetch(`${BASE_PATH}/dados/resumos.json`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((d: { imoveis: ImovelResumo[] }) => d.imoveis)
    .catch((e: unknown) => {
      promessa = null;
      throw e;
    });
  return promessa;
}

export function useTodosResumos(ativo = true) {
  const [imoveis, setImoveis] = useState<ImovelResumo[] | null>(null);
  const [erro, setErro] = useState(false);
  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    carregarResumos()
      .then((lista) => vivo && setImoveis(lista))
      .catch(() => vivo && setErro(true));
    return () => {
      vivo = false;
    };
  }, [ativo]);
  return { imoveis, erro };
}
