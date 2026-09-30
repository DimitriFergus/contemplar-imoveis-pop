'use client';

import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Carregando } from '@/components/admin/Carregando';
import { SeloStatus } from '@/components/admin/Selos';
import { Aviso } from '@/components/admin/ui';
import { DetalheImovel } from '@/components/imoveis/DetalheImovel';
import { Button } from '@/components/ui/button';
import { obterImovelPainel } from '@/lib/admin/consultas';
import { publicarImovel, type Resultado } from '@/lib/admin/operacoes';
import { usePainel } from '@/lib/admin/sessao';
import { useConsulta } from '@/lib/admin/useConsulta';
import { linhaParaImovel } from '@/lib/repositorio/linha';
import type { Corretor } from '@/types';

/** Mostra o anúncio exatamente como vai ficar no site, antes de publicar. */
function Previa() {
  const sessao = usePainel();
  const { supabase } = sessao;
  const id = useSearchParams().get('id') ?? '';
  const [resultado, setResultado] = useState<Resultado>({});
  const [publicando, setPublicando] = useState(false);
  const { dados, recarregar } = useConsulta(async () => {
    const linha = await obterImovelPainel(supabase, id);
    if (!linha) return null;
    const { data: corretor } = await supabase
      .from('corretores')
      .select('id, nome, creci, whatsapp')
      .eq('id', linha.corretor_id)
      .maybeSingle<Corretor>();
    return { linha, corretor };
  }, id);

  if (dados === undefined) return <Carregando />;
  if (dados === null)
    return (
      <p className="p-10 text-center" role="alert">
        Imóvel não encontrado. <Link href="/admin/imoveis">Voltar</Link>
      </p>
    );
  const { linha, corretor } = dados;

  return (
    <>
      <div className="sticky top-0 z-40 border-b-4 border-destaque bg-card px-4 py-3 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/imoveis/editar?id=${linha.id}`}>
              <ArrowLeft aria-hidden /> Voltar a editar
            </Link>
          </Button>
          <p className="mr-auto flex flex-wrap items-center gap-2 font-semibold">
            Pré-visualização · {linha.codigo} <SeloStatus status={linha.status} />
          </p>
          {linha.status === 'rascunho' && (
            <Button
              variant="destaque"
              size="sm"
              disabled={publicando}
              onClick={async () => {
                setPublicando(true);
                const r = await publicarImovel(sessao, linha.id);
                setPublicando(false);
                setResultado(r);
                if (r.ok) void recarregar();
              }}
            >
              <Send aria-hidden /> Publicar agora
            </Button>
          )}
        </div>
        {(resultado.ok || resultado.erro) && (
          <Aviso tom={resultado.ok ? 'sucesso' : 'erro'} className="mt-3">
            {resultado.ok ?? resultado.erro}
          </Aviso>
        )}
      </div>
      <div className="bg-background py-4">
        <DetalheImovel imovel={linhaParaImovel(linha)} corretor={corretor} semelhantes={[]} />
      </div>
    </>
  );
}

export default function PaginaPrevia() {
  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-10 lg:-my-8">
      <Suspense fallback={<Carregando />}>
        <Previa />
      </Suspense>
    </div>
  );
}
