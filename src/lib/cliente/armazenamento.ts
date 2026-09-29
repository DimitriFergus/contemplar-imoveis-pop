'use client';

import { useSyncExternalStore } from 'react';

/**
 * Pequeno "store" sobre localStorage/sessionStorage, sincronizado entre abas.
 * Só guarda o mínimo necessário (favoritos, comparador, Cabe no Meu Bolso, preferências e UTM),
 * sempre com opção de apagar. Falhas de armazenamento (modo privado etc.) nunca quebram a página.
 */
export interface Armazenado<T> {
  chave: string;
  padrao: T;
  ler: () => T;
  gravar: (valor: T | ((atual: T) => T)) => void;
  apagar: () => void;
  inscrever: (ouvinte: () => void) => () => void;
}

export function criarArmazenado<T>(
  chave: string,
  padrao: T,
  tipo: 'local' | 'sessao' = 'local',
): Armazenado<T> {
  const ouvintes = new Set<() => void>();
  let cache: { bruto: string | null; valor: T } | null = null;

  const storage = (): Storage | null => {
    try {
      return typeof window === 'undefined'
        ? null
        : tipo === 'local'
          ? window.localStorage
          : window.sessionStorage;
    } catch {
      return null;
    }
  };

  const ler = (): T => {
    let bruto: string | null = null;
    try {
      bruto = storage()?.getItem(chave) ?? null;
    } catch {
      bruto = null;
    }
    if (cache && cache.bruto === bruto) return cache.valor;
    let valor = padrao;
    if (bruto) {
      try {
        valor = JSON.parse(bruto) as T;
      } catch {
        valor = padrao;
      }
    }
    cache = { bruto, valor };
    return valor;
  };

  const avisar = () => ouvintes.forEach((o) => o());

  const gravar: Armazenado<T>['gravar'] = (novo) => {
    const valor = typeof novo === 'function' ? (novo as (a: T) => T)(ler()) : novo;
    try {
      storage()?.setItem(chave, JSON.stringify(valor));
    } catch {
      // armazenamento indisponível: mantém só em memória
      cache = { bruto: JSON.stringify(valor), valor };
    }
    avisar();
  };

  const apagar = () => {
    try {
      storage()?.removeItem(chave);
    } catch {
      /* ignora */
    }
    cache = null;
    avisar();
  };

  const inscrever = (ouvinte: () => void) => {
    ouvintes.add(ouvinte);
    const aoMudarEmOutraAba = (e: StorageEvent) => {
      if (e.key === chave || e.key === null) ouvinte();
    };
    window.addEventListener('storage', aoMudarEmOutraAba);
    return () => {
      ouvintes.delete(ouvinte);
      window.removeEventListener('storage', aoMudarEmOutraAba);
    };
  };

  return { chave, padrao, ler, gravar, apagar, inscrever };
}

export function useArmazenado<T>(a: Armazenado<T>): T {
  return useSyncExternalStore(a.inscrever, a.ler, () => a.padrao);
}

/** true depois da hidratação (para evitar divergência entre servidor e navegador). */
const nada = () => () => {};
export function useMontado(): boolean {
  return useSyncExternalStore(
    nada,
    () => true,
    () => false,
  );
}
