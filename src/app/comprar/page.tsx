import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CIDADE_BASE, MODO_ESTATICO } from '@/config/site';
import { CorpoComprar } from '@/components/comprar/CorpoComprar';
import { ListagemCompraEstatica } from '@/components/comprar/ListagemCompraEstatica';
import { lerFiltros } from '@/lib/busca/query';
import { repositorio } from '@/lib/repositorio';
import { metadadosListagem } from '@/lib/seo';

const TITULO = `Comprar imóveis em ${CIDADE_BASE}`;
const DESCRICAO =
  'Veja no mapa onde fica cada imóvel e explore a lista ao lado: casas e apartamentos à venda, com preço total e parcela estimada.';

export async function generateMetadata({
  searchParams,
}: PageProps<'/comprar'>): Promise<Metadata> {
  return metadadosListagem('/comprar', searchParams, TITULO, DESCRICAO);
}

export default async function PaginaComprar({ searchParams }: PageProps<'/comprar'>) {
  // Na versão estática a página não lê a URL no servidor: os filtros são aplicados no navegador.
  const filtrosUrl = lerFiltros(MODO_ESTATICO ? {} : await searchParams);
  const [resultado, bairros] = await Promise.all([
    repositorio.buscar(filtrosUrl),
    repositorio.bairros(),
  ]);
  const corpo = (
    <CorpoComprar filtrosUrl={filtrosUrl} fixos={{}} resultado={resultado} bairros={bairros} caminho="/comprar" />
  );

  return (
    <div className="container-site py-4 lg:py-6">
      <h1 className="sr-only">{TITULO}</h1>
      {MODO_ESTATICO ? (
        <Suspense fallback={corpo}>
          <ListagemCompraEstatica
            todos={await repositorio.listarResumos()}
            bairros={bairros}
            caminho="/comprar"
            fixos={{}}
          />
        </Suspense>
      ) : (
        corpo
      )}
    </div>
  );
}
