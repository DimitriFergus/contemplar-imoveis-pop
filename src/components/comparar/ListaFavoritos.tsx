'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';
import { CardImovel } from '@/components/imoveis/CardImovel';
import { NotaPremissas } from '@/components/imoveis/NotaPremissas';
import { Button } from '@/components/ui/button';
import { useMontado } from '@/lib/cliente/armazenamento';
import { useComparar, useFavoritos } from '@/lib/cliente/estado';
import { useResumos } from '@/lib/cliente/useResumos';

export function ListaFavoritos() {
  const montado = useMontado();
  const { ids, limpar } = useFavoritos();
  const comparar = useComparar();
  const { imoveis, carregando, erro } = useResumos(ids, montado);

  if (!montado || carregando) {
    return (
      <p role="status" className="py-10 text-center text-muted-foreground">
        Carregando seus favoritos…
      </p>
    );
  }
  if (erro)
    return <p role="alert">Não foi possível carregar seus favoritos agora. Tente novamente.</p>;
  if (imoveis.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <Heart className="mx-auto size-12 text-muted-foreground" aria-hidden />
        <h2 className="mt-3 text-xl font-bold">Você ainda não salvou nenhum imóvel</h2>
        <p className="mt-2 text-muted-foreground">
          Toque no coração dos imóveis que você gostar para vê-los aqui. Não precisa de cadastro.
        </p>
        <Button asChild size="lg" className="mt-5">
          <Link href="/imoveis">Ver imóveis</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">
          {imoveis.length} {imoveis.length === 1 ? 'imóvel salvo' : 'imóveis salvos'} neste aparelho
        </p>
        <div className="flex gap-2">
          {comparar.ids.length > 0 && (
            <Button asChild>
              <Link href="/comparar">Comparar ({comparar.ids.length})</Link>
            </Button>
          )}
          <Button variant="outline" onClick={limpar}>
            Limpar favoritos
          </Button>
        </div>
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {imoveis.map((i) => (
          <li key={i.id}>
            <CardImovel imovel={i} nivelTitulo="h2" />
          </li>
        ))}
      </ul>
      <NotaPremissas />
    </div>
  );
}
