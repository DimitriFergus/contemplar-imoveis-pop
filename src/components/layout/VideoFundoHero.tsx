'use client';

import { useEffect, useRef } from 'react';
import { caminhoPublico } from '@/lib/utils/caminho';

const VIDEO = '/videos/hero.mp4';
const CAPA = '/videos/hero-capa.webp';

/**
 * Vídeo de fundo do hero: sem som, em loop, já no HTML (toca mesmo antes do JavaScript).
 * A capa aparece enquanto o vídeo carrega.
 */
export function VideoFundoHero() {
  const video = useRef<HTMLVideoElement>(null);

  // Alguns navegadores ignoram o autoplay na primeira carga: pede para tocar de novo.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.muted = true;
    if (v.paused) void v.play().catch(() => {});
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <video
        ref={video}
        className="size-full object-cover"
        poster={caminhoPublico(CAPA)}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        tabIndex={-1}
      >
        <source src={caminhoPublico(VIDEO)} type="video/mp4" />
      </video>
      {/* Película escura: o texto e a busca continuam legíveis sobre qualquer quadro do vídeo. */}
      <div className="absolute inset-0 bg-gradient-to-b from-marinho/85 via-marinho/70 to-marinho/90" />
    </div>
  );
}
