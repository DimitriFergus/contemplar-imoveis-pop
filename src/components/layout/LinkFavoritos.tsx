'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useFavoritos } from '@/lib/cliente/estado';
import { plural } from '@/lib/utils/formatar';

export function LinkFavoritos() {
  const { ids } = useFavoritos();
  const total = ids.length;
  return (
    <Link
      href="/favoritos"
      className="relative inline-flex size-11 items-center justify-center rounded-xl hover:bg-muted"
      aria-label={
        total ? `Favoritos (${plural(total, 'imóvel salvo', 'imóveis salvos')})` : 'Favoritos'
      }
    >
      <Heart className="size-5" aria-hidden />
      {total > 0 && (
        <span className="absolute top-1 right-1 grid min-w-5 place-items-center rounded-full bg-destaque px-1 text-xs font-bold text-destaque-foreground">
          {total}
        </span>
      )}
    </Link>
  );
}
