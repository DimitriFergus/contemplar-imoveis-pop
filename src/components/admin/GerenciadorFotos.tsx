'use client';

import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Loader2, Star, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { comprimirFoto, LADO_MAXIMO_FOTO } from '@/lib/admin/imagem';
import { enviarFoto, guardarFotoPendente } from '@/lib/admin/fotos-pendentes';
import { cn } from '@/lib/utils';
import type { Foto } from '@/types';
import { classeCampo } from './ui';

interface Props {
  imovelId: string | null;
  fotos: Foto[];
  onChange: (fotos: Foto[]) => void;
  erros: Record<string, string>;
}

/** Envio (arrastar e soltar), ordem e descrição (alt) das fotos. A primeira é a capa. */
export function GerenciadorFotos({ imovelId, fotos, onChange, erros }: Props) {
  const [enviando, setEnviando] = useState(0);
  const [falhas, setFalhas] = useState<string[]>([]);
  const [arrastando, setArrastando] = useState<number | null>(null);
  const [sobreZona, setSobreZona] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);
  const atual = useRef(fotos);
  atual.current = fotos;

  async function enviar(arquivos: FileList | File[]) {
    const lista = [...arquivos].filter((a) => a.type.startsWith('image/'));
    if (!lista.length) return;
    setFalhas([]);
    setEnviando((n) => n + lista.length);
    for (const arquivo of lista) {
      try {
        const blob = await comprimirFoto(arquivo);
        // Imóvel ainda não salvo: a foto fica no navegador e sobe junto com o salvamento.
        const url = imovelId ? await enviarFoto(imovelId, blob) : guardarFotoPendente(blob);
        onChange([...atual.current, { arquivo: url, alt: '' }]);
      } catch (e) {
        setFalhas((f) => [...f, `${arquivo.name}: ${(e as Error).message}`]);
      } finally {
        setEnviando((n) => n - 1);
      }
    }
  }

  function mover(de: number, para: number) {
    if (para < 0 || para >= fotos.length || de === para) return;
    const nova = [...fotos];
    const [item] = nova.splice(de, 1);
    if (item) nova.splice(para, 0, item);
    onChange(nova);
  }

  const alterarAlt = (i: number, alt: string) =>
    onChange(fotos.map((f, n) => (n === i ? { ...f, alt } : f)));

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            setSobreZona(true);
          }
        }}
        onDragLeave={() => setSobreZona(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          setSobreZona(false);
          void enviar(e.dataTransfer.files);
        }}
        className={cn(
          'flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors',
          sobreZona ? 'border-primary bg-info-suave' : 'border-input',
        )}
      >
        <ImagePlus className="size-8 text-muted-foreground" aria-hidden />
        <p>
          <strong>Arraste as fotos para cá</strong> ou{' '}
          <button
            type="button"
            className="font-semibold text-primary underline"
            onClick={() => entrada.current?.click()}
          >
            escolha no computador/celular
          </button>
        </p>
        <p className="text-xs text-muted-foreground">
          As fotos são reduzidas para no máximo {LADO_MAXIMO_FOTO} px e convertidas para WebP antes
          do envio.
          {!imovelId && ' Elas são enviadas quando você salvar ou publicar o imóvel.'}
        </p>
        <input
          ref={entrada}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-label="Escolher fotos"
          data-testid="entrada-fotos"
          onChange={(e) => {
            if (e.target.files) void enviar(e.target.files);
            e.target.value = '';
          }}
        />
        {enviando > 0 && (
          <p className="flex items-center gap-2 font-semibold text-primary" role="status">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Enviando {enviando}{' '}
            {enviando === 1 ? 'foto' : 'fotos'}…
          </p>
        )}
      </div>

      {falhas.length > 0 && (
        <ul className="rounded-xl bg-perda-suave p-3 text-sm text-perda" role="alert">
          {falhas.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      {erros.fotos && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {erros.fotos}
        </p>
      )}

      {fotos.length > 0 && (
        <ol className="space-y-3" aria-label="Fotos do anúncio, na ordem em que aparecem">
          {fotos.map((f, i) => {
            const erro = erros[`fotos.${i}.alt`];
            return (
              <li
                key={f.arquivo}
                draggable
                onDragStart={(e) => {
                  setArrastando(i);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  if (arrastando !== null) e.preventDefault();
                }}
                onDrop={(e) => {
                  if (arrastando === null) return;
                  e.preventDefault();
                  mover(arrastando, i);
                  setArrastando(null);
                }}
                onDragEnd={() => setArrastando(null)}
                className={cn(
                  'flex flex-col gap-3 rounded-2xl border bg-background p-3 sm:flex-row sm:items-start',
                  arrastando === i && 'opacity-50',
                )}
              >
                <div className="flex items-center gap-2">
                  <GripVertical
                    className="hidden size-5 cursor-grab text-muted-foreground sm:block"
                    aria-hidden
                  />
                  <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element -- miniatura no painel */}
                    <img src={f.arquivo} alt="" className="size-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 flex items-center gap-1 rounded-full bg-destaque px-2 py-0.5 text-xs font-bold text-destaque-foreground">
                        <Star className="size-3" aria-hidden /> Capa
                      </span>
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <label htmlFor={`foto-alt-${i}`} className="block text-sm font-semibold">
                    Descrição da foto {i + 1}
                  </label>
                  <input
                    id={`foto-alt-${i}`}
                    value={f.alt}
                    onChange={(e) => alterarAlt(i, e.target.value)}
                    placeholder="Ex.: Sala de estar com janela ampla"
                    className={classeCampo}
                    aria-invalid={Boolean(erro)}
                    aria-describedby={erro ? `foto-alt-${i}-erro` : `foto-alt-${i}-ajuda`}
                  />
                  {erro ? (
                    <p id={`foto-alt-${i}-erro`} className="text-sm text-destructive">
                      {erro}
                    </p>
                  ) : (
                    <p id={`foto-alt-${i}-ajuda`} className="text-xs text-muted-foreground">
                      Se ficar vazia, usamos o título do anúncio. É lida por leitores de tela e
                      ajuda no Google.
                    </p>
                  )}
                </div>
                <div className="flex gap-1 sm:flex-col">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => mover(i, i - 1)}
                    disabled={i === 0}
                    aria-label={`Mover foto ${i + 1} para cima`}
                  >
                    <ArrowUp aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => mover(i, i + 1)}
                    disabled={i === fotos.length - 1}
                    aria-label={`Mover foto ${i + 1} para baixo`}
                  >
                    <ArrowDown aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    onClick={() => onChange(fotos.filter((_, n) => n !== i))}
                    aria-label={`Remover foto ${i + 1}`}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
