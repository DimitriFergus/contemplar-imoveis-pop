import type { Metadata } from 'next';
import { Trilha } from '@/components/comum/Trilha';
import { TabelaComparacao } from '@/components/comparar/TabelaComparacao';

export const metadata: Metadata = {
  title: 'Comparar imóveis',
  robots: { index: false, follow: true },
};

export default function PaginaComparar() {
  return (
    <div className="container-site py-6 lg:py-8">
      <Trilha itens={[{ nome: 'Comparar', href: '/comparar' }]} />
      <h1 className="mt-3 mb-6 text-3xl font-extrabold sm:text-4xl">Comparar imóveis</h1>
      <TabelaComparacao />
    </div>
  );
}
