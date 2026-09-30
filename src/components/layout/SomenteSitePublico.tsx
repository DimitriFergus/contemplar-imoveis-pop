'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** Esconde cabeçalho, rodapé e botões flutuantes do site dentro do painel /admin. */
export function SomenteSitePublico({ children }: { children: ReactNode }) {
  const caminho = usePathname();
  if (caminho === '/admin' || caminho?.startsWith('/admin/')) return null;
  return children;
}
