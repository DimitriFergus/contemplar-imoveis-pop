'use client';

import { useState } from 'react';
import { comparar, favoritos, leituraFacil, perfilBolso, utmSessao } from '@/lib/cliente/estado';

/** LGPD: apaga tudo o que o site guardou neste navegador. */
export function BotaoApagarDados() {
  const [feito, setFeito] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center underline"
      onClick={() => {
        [favoritos, comparar, perfilBolso, leituraFacil, utmSessao].forEach((a) => a.apagar());
        document.documentElement.classList.remove('leitura-facil');
        setFeito(true);
      }}
    >
      {feito ? 'Dados deste navegador apagados ✓' : 'Apagar meus dados deste navegador'}
    </button>
  );
}
