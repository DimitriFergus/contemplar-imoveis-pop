'use client';

import dynamic from 'next/dynamic';

function Carregando() {
  return (
    <div className="grid size-full place-items-center bg-muted text-muted-foreground" role="status">
      Carregando mapa…
    </div>
  );
}

/** Leaflet só roda no navegador: carregado sob demanda, fora do HTML inicial. */
export const MapaListagem = dynamic(() => import('./MapaListagemLeaflet'), {
  ssr: false,
  loading: Carregando,
});
export const MapaImovel = dynamic(() => import('./MapaImovelLeaflet'), {
  ssr: false,
  loading: Carregando,
});
