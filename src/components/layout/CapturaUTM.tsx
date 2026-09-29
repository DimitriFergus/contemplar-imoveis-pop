'use client';

import { useEffect } from 'react';
import { utmSessao } from '@/lib/cliente/estado';
import { extrairUTM } from '@/lib/utils/utm';

/** Captura as UTMs da primeira visita da sessão (não sobrescreve se já houver). */
export function CapturaUTM() {
  useEffect(() => {
    if (utmSessao.ler()) return;
    const utm = extrairUTM(new URLSearchParams(window.location.search));
    if (utm) utmSessao.gravar(utm);
  }, []);
  return null;
}
