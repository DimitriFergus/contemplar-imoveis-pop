'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { CENTRO_MAPA } from '@/config/site';
import type { BairroComLocalizacao } from '@/lib/busca/bairros-mapa';
import { paraQueryString, type Filtros } from '@/lib/busca/query';
import { ATRIBUICAO_OSM, URL_TILES_OSM } from '@/components/mapa/tiles';
import { plural } from '@/lib/utils/formatar';

/** Tamanho do círculo cresce com a quantidade, como num mapa de clusters. */
function tamanho(total: number) {
  if (total >= 100) return 56;
  if (total >= 30) return 46;
  if (total >= 10) return 38;
  return 32;
}

function iconeCluster(total: number) {
  const px = tamanho(total);
  return L.divIcon({
    className: 'marcador-cluster',
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${px}px;height:${px}px;border-radius:999px;font:700 ${px >= 46 ? 15 : 13}px/1 var(--fonte-texto),system-ui,sans-serif;background:var(--primary);color:var(--primary-foreground);box-shadow:0 2px 8px rgba(0,0,0,.35);border:2px solid #fff">${total}</span>`,
    iconSize: [px, px],
    iconAnchor: [px / 2, px / 2],
    popupAnchor: [0, -px / 2],
  });
}

export default function MapaClustersComprarLeaflet({
  bairros,
  caminho,
  filtrosAtuais,
}: {
  bairros: BairroComLocalizacao[];
  caminho: string;
  filtrosAtuais: Filtros;
}) {
  const limites = useMemo(() => {
    if (bairros.length === 0) return null;
    return L.latLngBounds(bairros.map((b) => [b.lat, b.lng]));
  }, [bairros]);

  return (
    <MapContainer
      {...(limites
        ? { bounds: limites, boundsOptions: { padding: [40, 40] } }
        : { center: [CENTRO_MAPA.lat, CENTRO_MAPA.lng], zoom: CENTRO_MAPA.zoom })}
      scrollWheelZoom
      className="size-full"
      aria-label="Mapa com a quantidade de imóveis por região"
    >
      <TileLayer url={URL_TILES_OSM} attribution={ATRIBUICAO_OSM} />
      {bairros.map((b) => (
        <Marker
          key={b.slug}
          position={[b.lat, b.lng]}
          icon={iconeCluster(b.total)}
          title={`${b.nome} — ${plural(b.total, 'imóvel', 'imóveis')}`}
        >
          <Popup minWidth={200}>
            <div className="font-sans">
              <p className="m-0! text-base font-bold text-[#041a4b]">{b.nome}</p>
              <p className="m-0! text-sm text-slate-600">
                {plural(b.total, 'imóvel encontrado', 'imóveis encontrados')}
              </p>
              <Link
                href={`${caminho}${paraQueryString({ ...filtrosAtuais, bairro: b.slug, pagina: undefined })}`}
                className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#041a4b] font-semibold text-white! no-underline"
              >
                Ver só este bairro
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
