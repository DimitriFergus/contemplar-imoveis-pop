'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { caminhoPublico } from '@/lib/utils/caminho';
import type { Foto } from '@/types';
import { cn } from '@/lib/utils';

const INTERVALO_MS = 3500;

/** Fotos que se sucedem com efeito de esmaecimento (pausa ao passar o mouse). */
export function FotosFade({
  fotos,
  className,
  compacta = false,
}: {
  fotos: Foto[];
  className?: string;
  /** Miniatura: sem legenda nem pontinhos (o card já indica que a imagem é ilustrativa). */
  compacta?: boolean;
}) {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (fotos.length < 2 || pausado) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setAtual((i) => (i + 1) % fotos.length), INTERVALO_MS);
    return () => clearInterval(t);
  }, [fotos.length, pausado]);

  if (fotos.length === 0) return <div className={cn('bg-muted', className)} />;

  return (
    <div
      className={cn('relative overflow-hidden bg-muted', className)}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      {fotos.map((f, i) => (
        <Image
          key={f.arquivo}
          src={caminhoPublico(f.arquivo)}
          alt={i === atual ? f.alt : ''}
          aria-hidden={i !== atual}
          fill
          sizes={compacta ? '128px' : '(min-width: 1024px) 352px, 100vw'}
          className={cn(
            'object-cover transition-opacity duration-1000 ease-in-out motion-reduce:transition-none',
            i === atual ? 'opacity-100' : 'opacity-0',
          )}
          loading={i === 0 ? 'eager' : 'lazy'}
        />
      ))}
      {!compacta && (
        <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[0.7rem] text-white">
          Imagem ilustrativa
        </span>
      )}
      {!compacta && fotos.length > 1 && (
        <div
          className="absolute right-2 bottom-2 flex gap-1"
          role="group"
          aria-label="Escolher foto"
        >
          {fotos.map((f, i) => (
            <button
              key={f.arquivo}
              type="button"
              onClick={() => setAtual(i)}
              aria-label={`Ver foto ${i + 1} de ${fotos.length}`}
              aria-current={i === atual}
              className="relative size-2.5 rounded-full bg-white/60 after:absolute after:-inset-2 aria-[current=true]:bg-white"
            />
          ))}
        </div>
      )}
    </div>
  );
}
