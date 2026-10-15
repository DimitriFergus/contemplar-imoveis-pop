'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { CENTRO_MAPA } from '@/config/site';
import { ATRIBUICAO_OSM, URL_TILES_OSM } from '@/components/mapa/tiles';
import { caminhoPublico } from '@/lib/utils/caminho';
import { formatarPreco, formatarPrecoCurto } from '@/lib/utils/formatar';
import type { ImovelResumo } from '@/types';
import { FichaIconica } from './FichaIconica';

function iconePreco(preco: number, indisponivel: boolean) {
  return L.divIcon({
    className: 'marcador-preco',
    html: `<span style="display:inline-block;white-space:nowrap;padding:6px 10px;border-radius:999px;font:700 14px/1 var(--fonte-texto),system-ui,sans-serif;background:${indisponivel ? '#585e6c' : '#041a4b'};color:#fff;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff">${formatarPrecoCurto(preco)}</span>`,
    iconSize: [84, 32],
    iconAnchor: [42, 16],
    popupAnchor: [0, -14],
  });
}

/** Tamanho do círculo do agrupamento cresce com a quantidade de imóveis dentro dele. */
function tamanhoCluster(total: number) {
  if (total >= 100) return 56;
  if (total >= 30) return 46;
  if (total >= 10) return 38;
  return 32;
}

function criarIconeCluster(cluster: L.MarkerCluster) {
  const total = cluster.getChildCount();
  const px = tamanhoCluster(total);
  return L.divIcon({
    className: 'marcador-cluster',
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${px}px;height:${px}px;border-radius:999px;font:700 ${px >= 46 ? 15 : 13}px/1 var(--fonte-texto),system-ui,sans-serif;background:var(--primary);color:var(--primary-foreground);box-shadow:0 2px 8px rgba(0,0,0,.35);border:2px solid #fff">${total}</span>`,
    iconSize: L.point(px, px, true),
  });
}

/**
 * Mapa com agrupamento dinâmico por proximidade (zoom): perto, imóveis próximos aparecem juntos
 * numa bolinha com a quantidade; ao clicar, o mapa dá zoom e a bolinha se separa nas próximas
 * (por região); ao afastar o zoom, elas voltam a se juntar. Nenhum imóvel some do mapa — clicar
 * só aproxima, nunca filtra ou navega.
 */
export default function MapaClustersComprarLeaflet({ imoveis }: { imoveis: ImovelResumo[] }) {
  const limites = useMemo(() => {
    if (imoveis.length === 0) return null;
    return L.latLngBounds(
      imoveis.map((i) => [i.localizacaoAproximada.lat, i.localizacaoAproximada.lng]),
    );
  }, [imoveis]);

  return (
    <MapContainer
      {...(limites
        ? { bounds: limites, boundsOptions: { padding: [40, 40] } }
        : { center: [CENTRO_MAPA.lat, CENTRO_MAPA.lng], zoom: CENTRO_MAPA.zoom })}
      scrollWheelZoom
      className="size-full"
      aria-label="Mapa com os imóveis agrupados por região; toque num grupo para dar zoom"
    >
      <TileLayer url={URL_TILES_OSM} attribution={ATRIBUICAO_OSM} />
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={criarIconeCluster}
        showCoverageOnHover={false}
        spiderfyOnMaxZoom
        maxClusterRadius={70}
      >
        {imoveis.map((i) => (
          <Marker
            key={i.id}
            position={[i.localizacaoAproximada.lat, i.localizacaoAproximada.lng]}
            icon={iconePreco(i.preco, i.status !== 'disponivel')}
            title={`${i.titulo} — ${formatarPreco(i.preco)}`}
          >
            <Popup minWidth={240} maxWidth={260}>
              <div className="w-60 font-sans">
                {i.foto && (
                  <div className="relative mb-2 aspect-[3/2] overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={caminhoPublico(i.foto.arquivo)}
                      alt={i.foto.alt}
                      fill
                      sizes="240px"
                      className="object-cover"
                    />
                  </div>
                )}
                <p className="m-0! text-lg font-extrabold text-[#041a4b]">
                  {formatarPreco(i.preco)}
                </p>
                <FichaIconica
                  className="mt-1.5 mb-2.5 gap-x-2.5 text-slate-700"
                  quartos={i.quartos}
                  suites={i.suites}
                  banheiros={i.banheiros}
                  vagas={i.vagas}
                  areaUtilM2={i.areaUtilM2}
                />
                <Link
                  href={`/imoveis/${i.slug}`}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#041a4b] font-semibold text-white! no-underline"
                >
                  Ver imóvel
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
