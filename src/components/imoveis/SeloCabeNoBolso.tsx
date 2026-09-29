'use client';

import { PiggyBank } from 'lucide-react';
import { Selo } from '@/components/comum/Selo';
import { cabeNoBolso } from '@/lib/financiamento/capacidade';
import { useArmazenado } from '@/lib/cliente/armazenamento';
import { perfilBolso } from '@/lib/cliente/estado';

/** Aparece quando o visitante já fez o "Cabe no Meu Bolso" e o preço está dentro do poder de compra. */
export function SeloCabeNoBolso({ preco, className }: { preco: number; className?: string }) {
  const perfil = useArmazenado(perfilBolso);
  if (!perfil || !cabeNoBolso(preco, perfil.resultado.poderDeCompra)) return null;
  return (
    <Selo tom="sucesso" className={className} icone={<PiggyBank className="size-4" aria-hidden />}>
      Cabe no seu bolso
    </Selo>
  );
}
