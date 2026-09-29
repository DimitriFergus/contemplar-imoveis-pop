'use client';

import { ChevronLeft, ChevronRight, Expand, PlayCircle, Rotate3d } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { Foto } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  fotos: Foto[];
  titulo: string;
  videoUrl?: string;
  tour360Url?: string;
}

/** Converte links do YouTube em endereço de incorporação sem cookies. */
function urlIncorporacao(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/);
  return yt ? `https://www.youtube-nocookie.com/embed/${yt[1]}` : url;
}

function Carrossel({
  fotos,
  indice,
  aoMudar,
  telaCheia,
}: {
  fotos: Foto[];
  indice: number;
  aoMudar: (i: number) => void;
  telaCheia?: boolean;
}) {
  const trilho = useRef<HTMLDivElement>(null);

  // Mantém o índice sincronizado com a rolagem por toque (scroll-snap nativo, sem biblioteca).
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    let quadro = 0;
    const aoRolar = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => {
        const i = Math.round(el.scrollLeft / el.clientWidth);
        if (i !== indice) aoMudar(i);
      });
    };
    el.addEventListener('scroll', aoRolar, { passive: true });
    return () => {
      el.removeEventListener('scroll', aoRolar);
      cancelAnimationFrame(quadro);
    };
  }, [indice, aoMudar]);

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    const alvo = indice * el.clientWidth;
    if (Math.abs(el.scrollLeft - alvo) > 4) el.scrollTo({ left: alvo, behavior: 'smooth' });
  }, [indice]);

  return (
    <div
      ref={trilho}
      className="rolagem-horizontal flex size-full overflow-x-auto"
      tabIndex={0}
      aria-label="Fotos do imóvel. Use as setas para navegar."
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') aoMudar(Math.min(fotos.length - 1, indice + 1));
        if (e.key === 'ArrowLeft') aoMudar(Math.max(0, indice - 1));
      }}
    >
      {fotos.map((f, i) => (
        <div
          key={f.arquivo}
          className="relative size-full shrink-0 grow-0 basis-full"
          aria-hidden={i !== indice}
        >
          <Image
            src={f.arquivo}
            alt={f.alt}
            fill
            sizes={telaCheia ? '100vw' : '(min-width: 1024px) 60vw, 100vw'}
            className={telaCheia ? 'object-contain' : 'object-cover'}
            priority={!telaCheia && i === 0}
            loading={!telaCheia && i === 0 ? undefined : 'lazy'}
          />
        </div>
      ))}
    </div>
  );
}

export function Galeria({ fotos, titulo, videoUrl, tour360Url }: Props) {
  const [indice, setIndice] = useState(0);
  const [telaCheia, setTelaCheia] = useState(false);
  const [midia, setMidia] = useState<null | { tipo: 'video' | 'tour'; url: string }>(null);
  const mudar = useCallback((i: number) => setIndice(i), []);
  const total = fotos.length;

  if (total === 0) {
    return (
      <div className="grid aspect-[3/2] place-items-center rounded-2xl bg-muted text-muted-foreground">
        Fotos em breve
      </div>
    );
  }

  const setas = (escuro = false) => (
    <>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className={cn(
          'absolute top-1/2 left-2 -translate-y-1/2 rounded-full shadow',
          escuro && 'bg-white/90 text-black',
        )}
        onClick={() => setIndice((i) => Math.max(0, i - 1))}
        disabled={indice === 0}
        aria-label="Foto anterior"
      >
        <ChevronLeft className="size-6" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className={cn(
          'absolute top-1/2 right-2 -translate-y-1/2 rounded-full shadow',
          escuro && 'bg-white/90 text-black',
        )}
        onClick={() => setIndice((i) => Math.min(total - 1, i + 1))}
        disabled={indice === total - 1}
        aria-label="Próxima foto"
      >
        <ChevronRight className="size-6" />
      </Button>
    </>
  );

  return (
    <div className="space-y-2">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted sm:rounded-2xl lg:aspect-[16/10]">
        <Carrossel fotos={fotos} indice={indice} aoMudar={mudar} />
        <div className="hidden sm:block">{setas()}</div>
        <span
          className="absolute top-3 left-3 rounded-full bg-black/65 px-3 py-1 text-sm font-semibold text-white"
          aria-live="polite"
        >
          Foto {indice + 1} de {total}
        </span>
        <div className="absolute right-3 bottom-3 flex gap-2">
          {videoUrl && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="shadow"
              onClick={() => setMidia({ tipo: 'video', url: videoUrl })}
            >
              <PlayCircle className="size-4" aria-hidden /> Vídeo
            </Button>
          )}
          {tour360Url && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="shadow"
              onClick={() => setMidia({ tipo: 'tour', url: tour360Url })}
            >
              <Rotate3d className="size-4" aria-hidden /> Tour 360°
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="shadow"
            onClick={() => setTelaCheia(true)}
            aria-label="Ver fotos em tela cheia"
          >
            <Expand className="size-4" aria-hidden />{' '}
            <span className="hidden sm:inline">Tela cheia</span>
          </Button>
        </div>
      </div>

      {total > 1 && (
        <ul
          className="rolagem-horizontal hidden gap-2 overflow-x-auto px-4 sm:flex sm:px-0"
          aria-label="Miniaturas das fotos"
        >
          {fotos.map((f, i) => (
            <li key={f.arquivo} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndice(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === indice}
                className={cn(
                  'relative block h-16 w-24 overflow-hidden rounded-lg ring-2 ring-transparent',
                  i === indice && 'ring-primary',
                )}
              >
                <Image
                  src={f.arquivo}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                  loading="lazy"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={telaCheia} onOpenChange={setTelaCheia}>
        <DialogContent className="h-dvh max-h-none w-screen max-w-none rounded-none border-0 bg-black p-0 text-white sm:max-w-none">
          <DialogTitle className="sr-only">Fotos: {titulo}</DialogTitle>
          <DialogDescription className="sr-only">
            Arraste para o lado ou use as setas para ver as fotos.
          </DialogDescription>
          <div className="relative size-full">
            <Carrossel fotos={fotos} indice={indice} aoMudar={mudar} telaCheia />
            {setas(true)}
            <span className="absolute top-3 left-3 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
              {indice + 1} / {total}
            </span>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={midia !== null} onOpenChange={(a) => !a && setMidia(null)}>
        <DialogContent className="max-w-3xl p-0 sm:max-w-3xl">
          <DialogTitle className="px-5 pt-5">
            {midia?.tipo === 'video' ? 'Vídeo do imóvel' : 'Tour 360°'}
          </DialogTitle>
          <DialogDescription className="sr-only">{titulo}</DialogDescription>
          {midia && (
            <div className="aspect-video w-full">
              <iframe
                src={urlIncorporacao(midia.url)}
                title={`${midia.tipo === 'video' ? 'Vídeo' : 'Tour 360°'}: ${titulo}`}
                className="size-full rounded-b-xl"
                allow="accelerometer; gyroscope; fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
