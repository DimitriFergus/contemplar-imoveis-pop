'use client';

import { Heart } from 'lucide-react';
import { rastrear } from '@/lib/analytics';
import { useMontado } from '@/lib/cliente/armazenamento';
import { useFavoritos } from '@/lib/cliente/estado';
import { cn } from '@/lib/utils';

export function BotaoFavoritar({
  id,
  codigo,
  variante = 'flutuante',
  className,
}: {
  id: string;
  codigo: string;
  variante?: 'flutuante' | 'texto';
  className?: string;
}) {
  const { eFavorito, alternar } = useFavoritos();
  const montado = useMontado();
  const ativo = montado && eFavorito(id);
  const aoClicar = () => {
    alternar(id);
    rastrear('favoritar', { codigo, acao: ativo ? 'remover' : 'adicionar' });
  };

  if (variante === 'texto') {
    return (
      <button
        type="button"
        onClick={aoClicar}
        aria-pressed={ativo}
        className={cn(
          'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border bg-background px-4 font-semibold hover:bg-muted',
          className,
        )}
      >
        <Heart className={cn('size-5', ativo && 'fill-destaque text-destaque-texto')} aria-hidden />
        {ativo ? 'Salvo nos favoritos' : 'Favoritar'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-pressed={ativo}
      aria-label={ativo ? `Remover ${codigo} dos favoritos` : `Salvar ${codigo} nos favoritos`}
      className={cn(
        'relative z-10 inline-flex size-11 items-center justify-center rounded-full bg-white/95 text-marinho shadow-md ring-1 ring-black/5 transition-transform hover:scale-105',
        className,
      )}
    >
      <Heart className={cn('size-5', ativo && 'fill-destaque text-destaque-texto')} aria-hidden />
    </button>
  );
}
