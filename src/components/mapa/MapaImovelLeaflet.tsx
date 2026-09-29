'use client';

import 'leaflet/dist/leaflet.css';
import { Circle, MapContainer, TileLayer } from 'react-leaflet';
import { ATRIBUICAO_OSM, URL_TILES_OSM } from './tiles';

/** Mostra apenas um círculo de área aproximada — nunca o ponto exato do imóvel. */
export default function MapaImovelLeaflet({
  lat,
  lng,
  raioMetros,
}: {
  lat: number;
  lng: number;
  raioMetros: number;
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      className="size-full"
      aria-label="Mapa com a região aproximada do imóvel"
    >
      <TileLayer url={URL_TILES_OSM} attribution={ATRIBUICAO_OSM} />
      <Circle
        center={[lat, lng]}
        radius={raioMetros}
        pathOptions={{ color: '#f28234', weight: 3, fillColor: '#f28234', fillOpacity: 0.18 }}
      />
    </MapContainer>
  );
}
