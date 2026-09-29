'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { CENTRO_MAPA } from '@/config/site';
import { formatarPreco, formatarPrecoCurto } from '@/lib/utils/formatar';
import type { ImovelResumo } from '@/types';
import { ATRIBUICAO_OSM, URL_TILES_OSM } from './tiles';

function iconePreco(preco: number, indisponivel: boolean) {
  return L.divIcon({
    className: 'marcador-preco',
    html: `<span style="display:inline-block;white-space:nowrap;padding:6px 10px;border-radius:999px;font:700 14px/1 var(--fonte-texto),system-ui,sans-serif;background:${indisponivel ? '#585e6c' : '#041a4b'};color:#fff;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff">${formatarPrecoCurto(preco)}</span>`,
    iconSize: [84, 32],
    iconAnchor: [42, 16],
    popupAnchor: [0, -14],
  });
}

export default function MapaListagemLeaflet({ imoveis }: { imoveis: ImovelResumo[] }) {
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
      scrollWheelZoom={false}
      className="size-full"
      aria-label="Mapa com a localização aproximada dos imóveis"
    >
      <TileLayer url={URL_TILES_OSM} attribution={ATRIBUICAO_OSM} />
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
                    src={i.foto.arquivo}
                    alt={i.foto.alt}
                    fill
                    sizes="240px"
                    className="object-cover"
                  />
                </div>
              )}
              <p className="m-0! text-sm text-slate-600">Parcelas a partir de</p>
              <p className="m-0! text-lg font-extrabold text-[#041a4b]">
                {formatarPreco(i.parcelaEstimada)}/mês*
              </p>
              <p className="m-0! text-sm font-semibold text-slate-900">
                Valor total: {formatarPreco(i.preco)}
              </p>
              <p className="mt-1! mb-2! text-sm text-slate-700">{i.titulo}</p>
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
    </MapContainer>
  );
}
