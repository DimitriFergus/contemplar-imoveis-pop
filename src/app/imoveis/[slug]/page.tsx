import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LISTAGEM } from '@/config/site';
import { DetalheImovel } from '@/components/imoveis/DetalheImovel';
import { parcelaEstimadaAnuncio } from '@/lib/financiamento';
import { repositorio } from '@/lib/repositorio';
import { formatarPreco } from '@/lib/utils/formatar';

/** Páginas geradas no build (SSG) e revalidadas a cada hora. */
export const revalidate = 3600;

export async function generateStaticParams() {
  const imoveis = await repositorio.listar();
  return imoveis.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/imoveis/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const i = await repositorio.obterPorSlug(slug);
  if (!i) return { title: 'Imóvel não encontrado' };
  const parcela = parcelaEstimadaAnuncio(i.preco).parcela;
  const descricao = `${i.titulo} por ${formatarPreco(i.preco)} (parcelas a partir de ${formatarPreco(parcela)}/mês, estimativa). ${i.quartos} quartos, ${i.areaUtilM2} m². Cód. ${i.codigo}.`;
  return {
    title: `${i.titulo} — ${formatarPreco(i.preco)}`,
    description: descricao,
    alternates: { canonical: `/imoveis/${i.slug}` },
    openGraph: {
      type: 'website',
      title: `${i.titulo} — ${formatarPreco(i.preco)}`,
      description: descricao,
      url: `/imoveis/${i.slug}`,
    },
  };
}

export default async function PaginaImovel({ params }: PageProps<'/imoveis/[slug]'>) {
  const { slug } = await params;
  const imovel = await repositorio.obterPorSlug(slug);
  if (!imovel) notFound();
  const [semelhantes, corretor] = await Promise.all([
    repositorio.semelhantes(imovel, LISTAGEM.maxSemelhantes),
    repositorio.obterCorretor(imovel.corretorResponsavelId),
  ]);
  return <DetalheImovel imovel={imovel} corretor={corretor} semelhantes={semelhantes} />;
}
