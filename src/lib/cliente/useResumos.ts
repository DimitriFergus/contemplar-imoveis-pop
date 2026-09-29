'use client';

import { useEffect, useState } from 'react';
import type { ImovelResumo } from '@/types';

/** Busca os resumos dos imóveis salvos no navegador (favoritos/comparador), mantendo a ordem. */
export function useResumos(ids: string[], ativo = true) {
  const chave = ids.join(',');
  const [estado, setEstado] = useState<{ chave: string; imoveis: ImovelResumo[] } | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!ativo || !chave) return;
    const controle = new AbortController();
    fetch(`/api/imoveis/resumos?ids=${encodeURIComponent(chave)}`, { signal: controle.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { imoveis: ImovelResumo[] }) => {
        setErro(false);
        setEstado({ chave, imoveis: d.imoveis });
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setErro(true);
      });
    return () => controle.abort();
  }, [chave, ativo]);

  const carregando = ativo && Boolean(chave) && estado?.chave !== chave && !erro;
  const imoveis = !chave ? [] : (estado?.imoveis ?? []).filter((i) => ids.includes(i.id));
  return { imoveis, carregando, erro };
}
