'use client';

import type { IdFaixa, SistemaAmortizacao } from '@/config/financiamento';
import type { UTM } from '@/lib/utils/utm';
import { criarArmazenado, useArmazenado } from './armazenamento';

export const favoritos = criarArmazenado<string[]>('cp:favoritos', []);
/** Comparação na listagem: imóvel base e o imóvel que está sendo comparado com ele. */
export interface EstadoComparacao {
  base: string | null;
  comparado: string | null;
}
export const comparacao = criarArmazenado<EstadoComparacao>('cp:comparacao', {
  base: null,
  comparado: null,
});
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

export function useComparacao() {
  const estado = useArmazenado(comparacao);
  return {
    ...estado,
    /** Define o imóvel base (primeiro passo da comparação). */
    definirBase: (id: string) => comparacao.gravar({ base: id, comparado: null }),
    /** Escolhe o imóvel que será comparado com a base (abre o pop-up). */
    compararCom: (id: string) => comparacao.gravar((e) => ({ ...e, comparado: id })),
    /** Troca: o imóvel comparado vira a nova base. */
    tornarBase: (id: string) => comparacao.gravar({ base: id, comparado: null }),
    fecharComparado: () => comparacao.gravar((e) => ({ ...e, comparado: null })),
    encerrar: () => comparacao.apagar(),
  };
}
