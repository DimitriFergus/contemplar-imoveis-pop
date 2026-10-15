'use client';

import { useEffect, useRef, useState } from 'react';
import type { ImovelResumo } from '@/types';
import { CardImovelComprar } from './CardImovelComprar';

const LOTE = 12;

/** Grade de cards que carrega mais imóveis ao rolar, sem páginas nem botão "carregar mais". */
export function GradeInfinita({ itens }: { itens: ImovelResumo[] }) {
  const [qtd, setQtd] = useState(LOTE);
  // Nova busca (filtro, ordenação ou bairro diferente): volta a mostrar só o primeiro lote.
  // Ajustado durante a renderização (em vez de um efeito) para não disparar uma renderização extra.
  const [itensAnteriores, setItensAnteriores] = useState(itens);
  if (itens !== itensAnteriores) {
    setItensAnteriores(itens);
    setQtd(LOTE);
  }

  const sentinelaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const alvo = sentinelaRef.current;
    if (!alvo) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas[0]?.isIntersecting) setQtd((q) => Math.min(q + LOTE, itens.length));
      },
      { rootMargin: '800px 0px' },
    );
    observador.observe(alvo);
    return () => observador.disconnect();
  }, [itens]);

  const visiveis = itens.slice(0, qtd);

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visiveis.map((i, idx) => (
          <li key={i.id}>
            <CardImovelComprar imovel={i} prioridade={idx < 2} />
          </li>
        ))}
      </ul>
      {qtd < itens.length && (
        <div ref={sentinelaRef} className="py-6 text-center text-sm text-muted-foreground">
          Carregando mais imóveis…
        </div>
      )}
    </>
  );
}
