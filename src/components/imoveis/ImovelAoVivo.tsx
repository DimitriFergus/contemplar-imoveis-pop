'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { BASE_PATH } from '@/config/site';
import { Button } from '@/components/ui/button';
import type { Corretor, Imovel, ImovelResumo } from '@/types';
import { DetalheImovel } from './DetalheImovel';

type Estado = { imovel: Imovel; corretor: Corretor | null } | 'removido';

/**
 * Página do imóvel na versão estática (GitHub Pages): mostra a versão gerada no build e,
 * ao abrir, confere no banco se houve mudança (preço, fotos, status) e atualiza na hora.
 */
export function ImovelAoVivo({
  inicial,
  corretor,
  semelhantes,
}: {
  inicial: Imovel;
  corretor: Corretor | null;
  semelhantes: ImovelResumo[];
}) {
  const [estado, setEstado] = useState<Estado>({ imovel: inicial, corretor });

  useEffect(() => {
    let vivo = true;
    import('@/lib/cliente/ao-vivo')
      .then((m) => m.imovelAoVivo(inicial.slug))
      .then((r) => {
        if (!vivo) return;
        if (!r) setEstado('removido');
        else if (r.imovel.atualizadoEm !== inicial.atualizadoEm) setEstado(r);
      })
      .catch(() => undefined); // sem conexão com o banco: fica a versão do build
    return () => {
      vivo = false;
    };
  }, [inicial.slug, inicial.atualizadoEm]);

  if (estado === 'removido') return <ImovelIndisponivel />;
  return (
    <DetalheImovel imovel={estado.imovel} corretor={estado.corretor} semelhantes={semelhantes} />
  );
}

function ImovelIndisponivel() {
  return (
    <div className="container-site py-16 text-center" role="status">
      <h1 className="text-3xl font-extrabold">Este imóvel não está mais disponível</h1>
      <p className="mt-2 text-lg text-muted-foreground">Veja outras opções parecidas.</p>
      <Button asChild size="lg" className="mt-5">
        <Link href="/imoveis">Ver imóveis</Link>
      </Button>
    </div>
  );
}

/**
 * Página 404 da versão estática: se o endereço for de um imóvel cadastrado depois do último
 * build, busca no banco e mostra o anúncio (o GitHub Pages usa a 404 para qualquer endereço
 * que ainda não tem arquivo).
 */
export function ImovelNovoAoVivo({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<
    'verificando' | 'nao-e-imovel' | { imovel: Imovel; corretor: Corretor | null }
  >('verificando');

  useEffect(() => {
    const caminho = window.location.pathname.slice(BASE_PATH.length);
    const slug = caminho.match(/^\/imoveis\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/)?.[1];
    import('@/lib/cliente/ao-vivo')
      .then((m) => (slug ? m.imovelAoVivo(slug) : null))
      .then((r) => {
        if (!r) return setEstado('nao-e-imovel');
        document.title = `${r.imovel.titulo} | Contemplar Imóveis Pop`;
        setEstado(r);
      })
      .catch(() => setEstado('nao-e-imovel'));
  }, []);

  if (estado === 'verificando')
    return (
      <p className="py-24 text-center text-muted-foreground" role="status">
        Carregando…
      </p>
    );
  if (estado === 'nao-e-imovel') return children;
  return <DetalheImovel imovel={estado.imovel} corretor={estado.corretor} semelhantes={[]} />;
}
