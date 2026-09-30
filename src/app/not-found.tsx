import { SearchX } from 'lucide-react';
import Link from 'next/link';
import { BuscaHero } from '@/components/busca/BuscaHero';
import { CardImovel } from '@/components/imoveis/CardImovel';
import { NotaPremissas } from '@/components/imoveis/NotaPremissas';
import { Button } from '@/components/ui/button';
import { ImovelNovoAoVivo } from '@/components/imoveis/ImovelAoVivo';
import { MODO_ESTATICO } from '@/config/site';
import { repositorio } from '@/lib/repositorio';
import { SUPABASE_CONFIGURADO } from '@/lib/supabase/config';

/** 404 útil: busca e imóveis em destaque. */
export default async function NaoEncontrado() {
  const [destaques, bairros] = await Promise.all([repositorio.destaques(3), repositorio.bairros()]);
  const conteudo = (
    <div className="container-site py-10">
      <div className="mx-auto max-w-2xl text-center">
        <SearchX className="mx-auto size-14 text-muted-foreground" aria-hidden />
        <h1 className="mt-4 text-3xl font-extrabold">Página não encontrada</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          O endereço pode ter mudado ou o imóvel já saiu do ar. Que tal fazer uma nova busca?
        </p>
        <Button asChild size="lg" className="mt-5">
          <Link href="/imoveis">Ver todos os imóveis</Link>
        </Button>
      </div>
      <div className="mx-auto mt-10 max-w-4xl">
        <BuscaHero bairros={bairros} />
      </div>
      <h2 className="mt-12 mb-5 text-2xl font-bold">Imóveis em destaque</h2>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {destaques.map((i) => (
          <li key={i.id}>
            <CardImovel imovel={i} />
          </li>
        ))}
      </ul>
      <NotaPremissas className="mt-6" />
    </div>
  );
  // GitHub Pages: imóvel cadastrado depois do último build ainda não tem página; busca no banco.
  return MODO_ESTATICO && SUPABASE_CONFIGURADO ? (
    <ImovelNovoAoVivo>{conteudo}</ImovelNovoAoVivo>
  ) : (
    conteudo
  );
}
