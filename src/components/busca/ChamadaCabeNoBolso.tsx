'use client';

import { PiggyBank } from 'lucide-react';
import Link from 'next/link';
import { useArmazenado, useMontado } from '@/lib/cliente/armazenamento';
import { perfilBolso } from '@/lib/cliente/estado';
import { formatarPrecoCurto } from '@/lib/utils/formatar';

/** Convite para o "Cabe no Meu Bolso" (ou lembrete do resultado já calculado). */
export function ChamadaCabeNoBolso() {
  const perfil = useArmazenado(perfilBolso);
  const montado = useMontado();
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-sucesso-suave p-4 text-foreground">
      <PiggyBank className="mt-0.5 size-6 shrink-0 text-sucesso" aria-hidden />
      {montado && perfil ? (
        <p>
          Seu poder de compra estimado é de{' '}
          <strong>{formatarPrecoCurto(perfil.resultado.poderDeCompra)}</strong>. Os imóveis
          compatíveis aparecem com o selo <strong>&quot;Cabe no seu bolso&quot;</strong>.{' '}
          <Link href="/simulador" className="font-semibold text-sucesso underline">
            Refazer cálculo
          </Link>
        </p>
      ) : (
        <p>
          <strong>Quanto você pode pagar?</strong> Em 1 minuto a gente mostra quais imóveis cabem no
          seu bolso.{' '}
          <Link href="/simulador" className="font-semibold text-sucesso underline">
            Fazer o cálculo
          </Link>
        </p>
      )}
    </div>
  );
}
