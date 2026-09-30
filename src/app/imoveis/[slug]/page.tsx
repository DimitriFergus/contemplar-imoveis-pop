import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LISTAGEM, MODO_ESTATICO } from '@/config/site';
import { DetalheImovel } from '@/components/imoveis/DetalheImovel';
import { ImovelAoVivo } from '@/components/imoveis/ImovelAoVivo';
import { parcelaEstimadaAnuncio } from '@/lib/financiamento';
import { repositorio } from '@/lib/repositorio';
import { SUPABASE_CONFIGURADO } from '@/lib/supabase/config';
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
  // GitHub Pages: a página confere no banco, ao abrir, se o anúncio mudou depois do build.
  if (MODO_ESTATICO && SUPABASE_CONFIGURADO)
    return <ImovelAoVivo inicial={imovel} corretor={corretor} semelhantes={semelhantes} />;
  return <DetalheImovel imovel={imovel} corretor={corretor} semelhantes={semelhantes} />;
}
