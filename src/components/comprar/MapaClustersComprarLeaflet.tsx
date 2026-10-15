'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
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
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${px}px;height:${px}px;border-radius:999px;font:700 ${px >= 46 ? 15 : 13}px/1 var(--fonte-texto),system-ui,sans-serif;background:var(--primary);color:var(--primary-foreground);box-shadow:0 2px 8px rgba(0,0,0,.35);border:2px solid #fff;cursor:pointer">${total}</span>`,
    iconSize: [px, px],
    iconAnchor: [px / 2, px / 2],
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
  const router = useRouter();
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
      aria-label="Mapa com a quantidade de imóveis por região. Toque numa região para ver só os imóveis de lá."
    >
      <TileLayer url={URL_TILES_OSM} attribution={ATRIBUICAO_OSM} />
      {bairros.map((b) => (
        <Marker
          key={b.slug}
          position={[b.lat, b.lng]}
          icon={iconeCluster(b.total)}
          title={`Ver ${plural(b.total, 'imóvel', 'imóveis')} em ${b.nome}`}
          alt={`Ver ${plural(b.total, 'imóvel', 'imóveis')} em ${b.nome}`}
          keyboard
          eventHandlers={{
            click: () => {
              router.push(
                `${caminho}${paraQueryString({ ...filtrosAtuais, bairro: b.slug, pagina: undefined })}`,
                { scroll: false },
              );
            },
          }}
        />
      ))}
    </MapContainer>
  );
}
