import type { Metadata } from 'next';
import { Trilha } from '@/components/comum/Trilha';
import { ListaFavoritos } from '@/components/favoritos/ListaFavoritos';

export const metadata: Metadata = {
  title: 'Meus favoritos',
  robots: { index: false, follow: true },
};

export default function PaginaFavoritos() {
  return (
    <div className="container-site py-6 lg:py-8">
      <Trilha itens={[{ nome: 'Favoritos', href: '/favoritos' }]} />
      <h1 className="mt-3 mb-6 text-3xl font-extrabold sm:text-4xl">Meus favoritos</h1>
      <ListaFavoritos />
    </div>
  );
}
