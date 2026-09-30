import { Copy, ExternalLink, Trash2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FormularioImovel } from '@/components/admin/FormularioImovel';
import { rascunhoDeImovel } from '@/lib/admin/rascunho-imovel';
import { HistoricoAlteracoes } from '@/components/admin/HistoricoAlteracoes';
import { SeloStatus } from '@/components/admin/Selos';
import { Aviso, Cartao, TituloPagina } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { duplicarImovel, excluirImovel } from '@/lib/admin/acoes-imoveis';
import { historicoDoRegistro, listarCorretores, obterImovelPainel } from '@/lib/admin/consultas';
import { exigirSessao } from '@/lib/admin/sessao';
import { linhaParaImovel } from '@/lib/repositorio/converter';

export const metadata: Metadata = { title: 'Editar imóvel' };

export default async function PaginaEditarImovel({
  params,
  searchParams,
}: PageProps<'/admin/imoveis/[id]'>) {
  const { id } = await params;
  const { novo, duplicado, aviso } = await searchParams;
  const { supabase, ehAdmin } = await exigirSessao();
  const [linha, corretores, historico] = await Promise.all([
    obterImovelPainel(supabase, id),
    listarCorretores(supabase),
    historicoDoRegistro(supabase, 'imoveis', id),
  ]);
  const imovel = linhaParaImovel(linha);
  const nomes = Object.fromEntries(corretores.map((c) => [c.id, c.nome]));
  const podeExcluir = ehAdmin || linha.status === 'rascunho';

  return (
    <div className="mx-auto max-w-5xl pb-28">
      <p className="mb-2 text-sm">
        <Link href="/admin/imoveis" className="text-primary underline">
          ← Imóveis
        </Link>
      </p>
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
            <form action={duplicarImovel.bind(null, linha.id)}>
              <Button type="submit" variant="outline">
                <Copy aria-hidden /> Duplicar imóvel
              </Button>
            </form>
          </>
        }
      />
      {novo && (
        <Aviso tom="sucesso" className="mb-4">
          Rascunho criado com o código {linha.codigo}. Agora envie as fotos e publique.
        </Aviso>
      )}
      {duplicado && (
        <Aviso tom="sucesso" className="mb-4">
          Cópia criada como rascunho ({linha.codigo}). Ajuste o que for diferente e publique.
        </Aviso>
      )}
      {aviso === 'sem-permissao-excluir' && (
        <Aviso tom="erro" className="mb-4">
          Só o administrador pode excluir imóveis já publicados. Marque como vendido.
        </Aviso>
      )}

      <FormularioImovel
        key={linha.atualizado_em}
        id={linha.id}
        codigo={linha.codigo}
        slug={linha.slug}
        inicial={rascunhoDeImovel(imovel, linha.status)}
        corretores={corretores.map((c) => ({ id: c.id, nome: c.nome }))}
        ehAdmin={ehAdmin}
      />

      <div className="mt-6 space-y-6">
        <Cartao
          titulo="Histórico de alterações"
          descricao="Quem mudou o quê e quando. Mudanças de preço aparecem destacadas."
        >
          <HistoricoAlteracoes itens={historico} nomesCorretores={nomes} />
        </Cartao>
        {podeExcluir && (
          <Cartao titulo="Excluir imóvel">
            <p className="mb-3 text-muted-foreground">
              Apaga o anúncio e as fotos. Não dá para desfazer. Se o imóvel foi vendido, prefira
              mudar o status para &quot;Vendido&quot;.
            </p>
            <form action={excluirImovel.bind(null, linha.id)}>
              <Button type="submit" variant="destructive">
                <Trash2 aria-hidden /> Excluir definitivamente
              </Button>
            </form>
          </Cartao>
        )}
      </div>
    </div>
  );
}
