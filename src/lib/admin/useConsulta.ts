'use client';

import { useCallback, useEffect, useEffectEvent, useState } from 'react';

/**
 * Busca dados no navegador e guarda o resultado. A `chave` descreve os parâmetros da busca:
 * quando ela muda, a busca roda de novo. `recarregar` força uma nova busca.
 */
export function useConsulta<T>(buscar: () => Promise<T>, chave: string) {
  const [dados, setDados] = useState<T | undefined>(undefined);
  const [erro, setErro] = useState<string>();
  const [versao, setVersao] = useState(0);
  const executar = useEffectEvent(buscar);

  useEffect(() => {
    let vivo = true;
    executar()
      .then((d) => {
        if (!vivo) return;
        setDados(d);
        setErro(undefined);
      })
      .catch((e: unknown) => vivo && setErro((e as Error).message || 'Não foi possível carregar.'));
    return () => {
      vivo = false;
    };
  }, [chave, versao]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);
  return { dados, setDados, erro, recarregar };
}
