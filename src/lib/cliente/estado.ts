'use client';

import { LISTAGEM } from '@/config/site';
import type { IdFaixa, SistemaAmortizacao } from '@/config/financiamento';
import type { UTM } from '@/lib/utils/utm';
import { criarArmazenado, useArmazenado } from './armazenamento';

export const favoritos = criarArmazenado<string[]>('cp:favoritos', []);
export const comparar = criarArmazenado<string[]>('cp:comparar', []);
export const leituraFacil = criarArmazenado<boolean>('cp:leitura-facil', false);
/** UTM da primeira visita, guardada só durante a sessão do navegador. */
export const utmSessao = criarArmazenado<UTM | null>('cp:utm', null, 'sessao');

export interface PerfilBolso {
  entrada: {
    rendaFamiliar: number;
    entrada: number;
    fgts: number;
    outrasDividasMensais: number;
    parcelaDesejada?: number;
    prazoMeses: number;
    sistema: SistemaAmortizacao;
  };
  resultado: {
    poderDeCompra: number;
    parcelaConsiderada: number;
    faixa: IdFaixa;
  };
  salvoEm: string;
}

/** Dados do "Cabe no Meu Bolso": ficam só neste navegador e podem ser apagados com um clique. */
export const perfilBolso = criarArmazenado<PerfilBolso | null>('cp:cabe-no-bolso', null);

export function alternarNaLista(lista: string[], id: string, max = Infinity): string[] {
  if (lista.includes(id)) return lista.filter((x) => x !== id);
  if (lista.length >= max) return lista;
  return [...lista, id];
}

export function useFavoritos() {
  const ids = useArmazenado(favoritos);
  return {
    ids,
    eFavorito: (id: string) => ids.includes(id),
    alternar: (id: string) => favoritos.gravar((l) => alternarNaLista(l, id)),
    limpar: () => favoritos.apagar(),
  };
}

export function useComparar() {
  const ids = useArmazenado(comparar);
  return {
    ids,
    max: LISTAGEM.maxComparar,
    cheio: ids.length >= LISTAGEM.maxComparar,
    estaNaLista: (id: string) => ids.includes(id),
    alternar: (id: string) => comparar.gravar((l) => alternarNaLista(l, id, LISTAGEM.maxComparar)),
    remover: (id: string) => comparar.gravar((l) => l.filter((x) => x !== id)),
    limpar: () => comparar.apagar(),
  };
}
