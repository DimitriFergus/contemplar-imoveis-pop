'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { CENTRO_MAPA } from '@/config/site';
import type { BairroComLocalizacao } from '@/lib/busca/bairros-mapa';
import { plural } from '@/lib/utils/formatar';
import { ATRIBUICAO_OSM, URL_TILES_OSM } from './tiles';

function iconeBairro(total: number) {
  return L.divIcon({
    className: 'marcador-bairro',
    html: `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:2.25rem;height:2.25rem;padding:0 0.6rem;border-radius:999px;font:700 13px/1 var(--fonte-texto),system-ui,sans-serif;background:var(--destaque);color:var(--destaque-foreground);box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff">${total}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -16],
  });
}

export default function MapaBairrosLeaflet({ bairros }: { bairros: BairroComLocalizacao[] }) {
  const limites = useMemo(() => {
    if (bairros.length === 0) return null;
    return L.latLngBounds(bairros.map((b) => [b.lat, b.lng]));
  }, [bairros]);

  return (
    <MapContainer
      {...(limites
        ? { bounds: limites, boundsOptions: { padding: [40, 40] } }
        : { center: [CENTRO_MAPA.lat, CENTRO_MAPA.lng], zoom: CENTRO_MAPA.zoom })}
      scrollWheelZoom={false}
      className="size-full"
      aria-label="Mapa com as regiões que têm imóveis disponíveis"
    >
      <TileLayer url={URL_TILES_OSM} attribution={ATRIBUICAO_OSM} />
      {bairros.map((b) => (
        <Marker
          key={b.slug}
          position={[b.lat, b.lng]}
          icon={iconeBairro(b.total)}
          title={`${b.nome} — ${plural(b.total, 'imóvel', 'imóveis')}`}
        >
          <Popup minWidth={200}>
            <div className="font-sans">
              <p className="m-0! text-base font-bold text-[#041a4b]">{b.nome}</p>
              <p className="m-0! text-sm text-slate-600">
                {plural(b.total, 'imóvel disponível', 'imóveis disponíveis')}
              </p>
              <Link
                href={`/imoveis/bairro/${b.slug}`}
                className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#041a4b] font-semibold text-white! no-underline"
              >
                Ver imóveis no bairro
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
