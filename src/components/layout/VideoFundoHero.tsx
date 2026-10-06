'use client';

import { useEffect, useState } from 'react';
import { caminhoPublico } from '@/lib/utils/caminho';

const VIDEO = '/videos/hero.mp4';
const CAPA = '/videos/hero-capa.webp';

/**
 * Vídeo de fundo do hero (sem som, em loop). A capa aparece na hora; o vídeo só é carregado
 * depois que a página abre, e nunca para quem pediu menos movimento ou economia de dados.
 */
export function VideoFundoHero() {
  const [tocar, setTocar] = useState(false);

  useEffect(() => {
    const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const conexao = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (menosMovimento || conexao?.saveData) return;
    const id = window.setTimeout(() => setTocar(true), 300);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* eslint-disable-next-line @next/next/no-img-element -- capa decorativa, sem otimizador no GitHub Pages */}
      <img
        src={caminhoPublico(CAPA)}
        alt=""
        className="size-full object-cover"
        fetchPriority="low"
        decoding="async"
      />
      {tocar && (
        <video
          className="absolute inset-0 size-full object-cover"
          src={caminhoPublico(VIDEO)}
          poster={caminhoPublico(CAPA)}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
        />
      )}
      {/* Película escura: o texto e a busca continuam legíveis sobre qualquer quadro do vídeo. */}
      <div className="absolute inset-0 bg-gradient-to-b from-marinho/85 via-marinho/70 to-marinho/90" />
    </div>
  );
}
