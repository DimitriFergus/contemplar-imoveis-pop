'use client';

import { Copy, ExternalLink, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Carregando } from '@/components/admin/Carregando';
import { FormularioImovel } from '@/components/admin/FormularioImovel';
import { HistoricoAlteracoes } from '@/components/admin/HistoricoAlteracoes';
import { SeloStatus } from '@/components/admin/Selos';
import { Aviso, Cartao, TituloPagina } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { historico, listarCorretores, obterImovelPainel } from '@/lib/admin/consultas';
import { duplicarImovel, excluirImovel } from '@/lib/admin/operacoes';
import { rascunhoDeImovel } from '@/lib/admin/rascunho-imovel';
import { usePainel } from '@/lib/admin/sessao';
import { useConsulta } from '@/lib/admin/useConsulta';
import { linhaParaImovel } from '@/lib/repositorio/linha';

function Edicao() {
  const sessao = usePainel();
  const { supabase, ehAdmin } = sessao;
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  const [aviso, setAviso] = useState<string>();
  const [ocupado, setOcupado] = useState(false);

  const principal = useConsulta(
    () => Promise.all([obterImovelPainel(supabase, id), listarCorretores(supabase)]),
    `${id}`,
  );
  const hist = useConsulta(() => historico(supabase, { tabela: 'imoveis', id }), `${id}`);

  if (!principal.dados) return <Carregando />;
  const [linha, corretores] = principal.dados;
  if (!linha)
    return (
      <div className="rounded-2xl border border-dashed bg-card p-10 text-center" role="alert">
        <p className="text-lg font-bold">Imóvel não encontrado</p>
        <p className="text-muted-foreground">
          Ele não existe ou é de outro corretor. <Link href="/admin/imoveis">Voltar</Link>
        </p>
      </div>
    );

  const nomes = Object.fromEntries(corretores.map((c) => [c.id, c.nome]));
  const podeExcluir = ehAdmin || linha.status === 'rascunho';

  return (
    <>
      <TituloPagina
        titulo={
          <span className="flex flex-wrap items-center gap-3">
            {linha.codigo} <SeloStatus status={linha.status} />
          </span>
        }
        descricao={linha.titulo}
        acao={
          <>
            {linha.status !== 'rascunho' && (
              <Button asChild variant="ghost">
                <Link href={`/imoveis/${linha.slug}`} target="_blank">
                  <ExternalLink aria-hidden /> Ver no site
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              disabled={ocupado}
              onClick={async () => {
                setOcupado(true);
                const r = await duplicarImovel(sessao, linha.id);
                setOcupado(false);
                if (r.id) router.push(`/admin/imoveis/editar?id=${r.id}&duplicado=1`);
                else setAviso(r.erro);
              }}
            >
              <Copy aria-hidden /> Duplicar imóvel
            </Button>
          </>
        }
      />
      {params.get('novo') && (
        <Aviso tom="sucesso" className="mb-4">
          Imóvel salvo com o código {linha.codigo}.{' '}
          {linha.status === 'rascunho'
            ? 'Ele está como rascunho e não aparece no site.'
            : 'O site já foi atualizado.'}
        </Aviso>
      )}
      {params.get('falhas') && (
        <Aviso tom="erro" className="mb-4">
          {params.get('falhas')} foto(s) não foram enviadas (conexão ou arquivo). Envie de novo na
          seção Fotos e salve.
        </Aviso>
      )}
      {params.get('duplicado') && (
        <Aviso tom="sucesso" className="mb-4">
          Cópia criada como rascunho ({linha.codigo}). Ajuste o que for diferente e publique.
        </Aviso>
      )}
      {aviso && (
        <Aviso tom="erro" className="mb-4">
          {aviso}
        </Aviso>
      )}

      <FormularioImovel
        key={linha.id}
        id={linha.id}
        codigo={linha.codigo}
        slug={linha.slug}
        inicial={rascunhoDeImovel(linhaParaImovel(linha), linha.status)}
        corretores={corretores.map((c) => ({ id: c.id, nome: c.nome }))}
        ehAdmin={ehAdmin}
        aoSalvar={() => {
          void hist.recarregar();
          void principal.recarregar();
        }}
      />

      <div className="mt-6 space-y-6">
        <Cartao
          titulo="Histórico de alterações"
          descricao="Quem mudou o quê e quando. Mudanças de preço aparecem destacadas."
        >
          <HistoricoAlteracoes itens={hist.dados ?? []} nomesCorretores={nomes} />
        </Cartao>
        {podeExcluir && (
          <Cartao titulo="Excluir imóvel">
            <p className="mb-3 text-muted-foreground">
              Apaga o anúncio e as fotos. Não dá para desfazer. Se o imóvel foi vendido, prefira
              mudar o status para &quot;Vendido&quot;.
            </p>
            <Button
              variant="destructive"
              disabled={ocupado}
              onClick={async () => {
                if (!window.confirm(`Excluir ${linha.codigo} definitivamente?`)) return;
                setOcupado(true);
                const r = await excluirImovel(sessao, linha.id);
                setOcupado(false);
                if (r.ok) router.replace('/admin/imoveis?aviso=excluido');
                else setAviso(r.erro);
              }}
            >
              <Trash2 aria-hidden /> Excluir definitivamente
            </Button>
          </Cartao>
        )}
      </div>
    </>
  );
}

export default function PaginaEditarImovel() {
  return (
    <div className="mx-auto max-w-5xl pb-28">
      <p className="mb-2 text-sm">
        <Link href="/admin/imoveis" className="text-primary underline">
          ← Imóveis
        </Link>
      </p>
      <Suspense fallback={<Carregando />}>
        <Edicao />
      </Suspense>
    </div>
  );
}
