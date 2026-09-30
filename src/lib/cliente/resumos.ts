'use client';

import { useEffect, useState } from 'react';
import { BASE_PATH, MODO_ESTATICO } from '@/config/site';
import { SUPABASE_CONFIGURADO } from '@/lib/supabase/config';
import type { Foto, ImovelResumo } from '@/types';

export type ResumoComFotos = ImovelResumo & { fotos: Foto[] };

let promessa: Promise<ResumoComFotos[]> | null = null;

/** Versão estática com Supabase: lê os imóveis publicados direto do banco (sempre atualizados). */
async function doBanco(): Promise<ResumoComFotos[]> {
  const { imoveisAoVivo } = await import('./ao-vivo');
  return imoveisAoVivo();
}

async function doArquivo(): Promise<ResumoComFotos[]> {
  const r = await fetch(`${BASE_PATH}/dados/resumos.json`);
  if (!r.ok) throw new Error(String(r.status));
  return ((await r.json()) as { imoveis: ResumoComFotos[] }).imoveis;
}

/**
 * Carrega (uma vez por página) os resumos de todos os imóveis. No GitHub Pages com Supabase,
 * vêm do banco na hora; se o banco falhar, usa o arquivo gerado no build.
 */
export function carregarResumos(): Promise<ResumoComFotos[]> {
  promessa ??= (
    MODO_ESTATICO && SUPABASE_CONFIGURADO ? doBanco().catch(doArquivo) : doArquivo()
  ).catch((e: unknown) => {
    promessa = null;
    throw e;
  });
  return promessa;
}

export function useTodosResumos(ativo = true) {
  const [imoveis, setImoveis] = useState<ResumoComFotos[] | null>(null);
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
