import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CIDADE_BASE } from '@/config/site';
import { PaginaListagem } from '@/components/busca/PaginaListagem';
import { repositorio } from '@/lib/repositorio';
import { metadadosListagem } from '@/lib/seo';

async function obterBairro(slug: string) {
  const bairros = await repositorio.bairros();
  return bairros.find((b) => b.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<'/imoveis/bairro/[bairro]'>): Promise<Metadata> {
  const { bairro: slug } = await params;
  const bairro = await obterBairro(slug);
  if (!bairro) return { title: 'Bairro não encontrado' };
  return metadadosListagem(
    `/imoveis/bairro/${slug}`,
    await searchParams,
    `Imóveis à venda no ${bairro.nome}, ${CIDADE_BASE}`,
    `${bairro.total} imóveis à venda no bairro ${bairro.nome}: casas e apartamentos com parcelas que cabem no bolso.`,
  );
}

export default async function PaginaBairro({
  params,
  searchParams,
}: PageProps<'/imoveis/bairro/[bairro]'>) {
  const { bairro: slug } = await params;
  const bairro = await obterBairro(slug);
  if (!bairro) notFound();
  const caminho = `/imoveis/bairro/${slug}`;
  return (
    <PaginaListagem
      params={await searchParams}
      caminho={caminho}
      fixos={{ bairro: slug }}
      titulo={`Imóveis no ${bairro.nome}`}
      introducao={`Casas e apartamentos à venda no bairro ${bairro.nome}, em ${CIDADE_BASE}.`}
      trilha={[
        { nome: 'Imóveis', href: '/imoveis' },
        { nome: bairro.nome, href: caminho },
      ]}
    />
  );
}
