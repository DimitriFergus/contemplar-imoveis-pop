import { ArrowLeft, Send } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SeloStatus } from '@/components/admin/Selos';
import { Aviso } from '@/components/admin/ui';
import { DetalheImovel } from '@/components/imoveis/DetalheImovel';
import { Button } from '@/components/ui/button';
import { LISTAGEM } from '@/config/site';
import { publicarImovel } from '@/lib/admin/acoes-imoveis';
import { obterImovelPainel } from '@/lib/admin/consultas';
import { exigirSessao } from '@/lib/admin/sessao';
import { repositorio } from '@/lib/repositorio';
import { linhaParaImovel } from '@/lib/repositorio/converter';

export const metadata: Metadata = { title: 'Pré-visualização' };

const AVISOS = {
  publicado: { tom: 'sucesso', texto: 'Publicado! O imóvel já aparece no site.' },
  incompleto: {
    tom: 'erro',
    texto: 'Faltam informações para publicar (ex.: fotos ou descrição das fotos). Volte e edite.',
  },
  erro: { tom: 'erro', texto: 'Não foi possível publicar. Tente de novo.' },
} as const;

/** Mostra o anúncio exatamente como vai ficar no site, antes de publicar. */
export default async function PaginaPrevia({
  params,
  searchParams,
}: PageProps<'/admin/imoveis/[id]/previa'>) {
  const { id } = await params;
  const { aviso } = await searchParams;
  const { supabase } = await exigirSessao();
  const linha = await obterImovelPainel(supabase, id);
  const imovel = linhaParaImovel(linha);
  const [corretor, semelhantes] = await Promise.all([
    supabase
      .from('corretores')
      .select('id, nome, creci, whatsapp')
      .eq('id', linha.corretor_id)
      .maybeSingle(),
    repositorio.semelhantes(imovel, LISTAGEM.maxSemelhantes),
  ]);
  const msg = typeof aviso === 'string' ? AVISOS[aviso as keyof typeof AVISOS] : undefined;

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-10 lg:-my-8">
      <div className="sticky top-0 z-40 border-b-4 border-destaque bg-card px-4 py-3 shadow-card lg:top-0">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/imoveis/${linha.id}`}>
              <ArrowLeft aria-hidden /> Voltar a editar
            </Link>
          </Button>
          <p className="mr-auto flex flex-wrap items-center gap-2 font-semibold">
            Pré-visualização · {linha.codigo} <SeloStatus status={linha.status} />
          </p>
          {linha.status === 'rascunho' && (
            <form action={publicarImovel.bind(null, linha.id)}>
              <Button type="submit" variant="destaque" size="sm">
                <Send aria-hidden /> Publicar agora
              </Button>
            </form>
          )}
        </div>
        {msg && (
          <Aviso tom={msg.tom} className="mt-3">
            {msg.texto}
          </Aviso>
        )}
      </div>
      <div className="bg-background py-4">
        <DetalheImovel imovel={imovel} corretor={corretor.data} semelhantes={semelhantes} />
      </div>
    </div>
  );
}
