import type { Metadata } from 'next';
import { CIDADE_BASE, SITE } from '@/config/site';
import { PaginaListagem } from '@/components/busca/PaginaListagem';
import { formatarPrecoCurto } from '@/lib/utils/formatar';
import { metadadosListagem } from '@/lib/seo';

const TITULO = `Imóveis à venda em ${CIDADE_BASE}`;
const DESCRICAO = `Casas e apartamentos a partir de ${formatarPrecoCurto(SITE.precoAPartirDe)}, com Minha Casa, Minha Vida e FGTS. Filtre por preço ou pela parcela que cabe no seu bolso.`;

export async function generateMetadata({ searchParams }: PageProps<'/imoveis'>): Promise<Metadata> {
  return metadadosListagem('/imoveis', await searchParams, TITULO, DESCRICAO);
}

export default async function PaginaImoveis({ searchParams }: PageProps<'/imoveis'>) {
  return (
    <PaginaListagem
      params={await searchParams}
      caminho="/imoveis"
      titulo={TITULO}
      introducao="Encontre o imóvel pelo preço ou pela parcela mensal. Todos os valores mostram o preço total e a parcela estimada."
      trilha={[{ nome: 'Imóveis', href: '/imoveis' }]}
    />
  );
}
