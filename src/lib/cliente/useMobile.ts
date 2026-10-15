'use client';

import { useSyncExternalStore } from 'react';

const CONSULTA = '(max-width: 1023px)';

function inscrever(notificar: () => void) {
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener('change', notificar);
  return () => mq.removeEventListener('change', notificar);
}

/** true abaixo do breakpoint `lg` (1024px) — o mesmo ponto de corte usado no layout da página. */
export function useMobile(): boolean {
  return useSyncExternalStore(
    inscrever,
    () => window.matchMedia(CONSULTA).matches,
    () => false,
  );
}
