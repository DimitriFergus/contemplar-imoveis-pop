import { Copy, ExternalLink, Eye, Pencil, Plus, Search } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Aviso, Selecao, TituloPagina, classeCampo } from '@/components/admin/ui';
import { SeloStatus } from '@/components/admin/Selos';
import { Button } from '@/components/ui/button';
import { duplicarImovel } from '@/lib/admin/acoes-imoveis';
import { listarCorretores, listarImoveisPainel } from '@/lib/admin/consultas';
import { ROTULO_STATUS_PAINEL } from '@/lib/admin/rotulos';
import { exigirSessao } from '@/lib/admin/sessao';
import { STATUS_PAINEL } from '@/lib/schemas/imovel';
import { formatarData, formatarPreco } from '@/lib/utils/formatar';

export const metadata: Metadata = { title: 'Imóveis' };

const AVISOS: Record<string, { tom: 'sucesso' | 'erro'; texto: string }> = {
  excluido: { tom: 'sucesso', texto: 'Imóvel excluído.' },
  erro: { tom: 'erro', texto: 'Não foi possível concluir. Tente de novo.' },
  'nao-encontrado': { tom: 'erro', texto: 'Imóvel não encontrado.' },
};

const texto = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined);

export default async function PaginaImoveisPainel({ searchParams }: PageProps<'/admin/imoveis'>) {
  const params = await searchParams;
  const status = texto(params.status);
  const busca = texto(params.busca);
  const corretor = texto(params.corretor);
  const aviso = AVISOS[texto(params.aviso) ?? ''];

  const { supabase, ehAdmin } = await exigirSessao();
  const [imoveis, corretores] = await Promise.all([
    listarImoveisPainel(supabase, {
      status: STATUS_PAINEL.includes(status as never) ? status : undefined,
      busca,
      corretor,
    }),
    ehAdmin ? listarCorretores(supabase) : Promise.resolve([]),
  ]);
  const nomeCorretor = new Map(corretores.map((c) => [c.id, c.nome]));

  return (
    <>
      <TituloPagina
        titulo="Imóveis"
        descricao={
          ehAdmin ? 'Todos os imóveis da imobiliária.' : 'Os imóveis sob sua responsabilidade.'
        }
        acao={
          <Button asChild variant="destaque">
            <Link href="/admin/imoveis/novo">
              <Plus aria-hidden /> Cadastrar imóvel
            </Link>
          </Button>
        }
      />
      {aviso && (
        <Aviso tom={aviso.tom} className="mb-4">
          {aviso.texto}
        </Aviso>
      )}

      <form className="mb-5 grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-[1fr_12rem_auto] lg:grid-cols-[1fr_12rem_14rem_auto]">
        <label className="relative">
          <span className="sr-only">Buscar por título, bairro ou código</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            name="busca"
            defaultValue={busca}
            placeholder="Título, bairro ou código"
            className={`${classeCampo} pl-10`}
          />
        </label>
        <Selecao name="status" defaultValue={status ?? ''} aria-label="Filtrar por status">
          <option value="">Todos os status</option>
          {STATUS_PAINEL.map((s) => (
            <option key={s} value={s}>
              {ROTULO_STATUS_PAINEL[s]}
            </option>
          ))}
        </Selecao>
        {ehAdmin && (
          <Selecao name="corretor" defaultValue={corretor ?? ''} aria-label="Filtrar por corretor">
            <option value="">Todos os corretores</option>
            {corretores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Selecao>
        )}
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      <p className="mb-3 text-sm text-muted-foreground" role="status">
        {imoveis.length} {imoveis.length === 1 ? 'imóvel' : 'imóveis'}
      </p>

      {imoveis.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
          <p className="font-semibold">Nenhum imóvel encontrado.</p>
          <p className="text-muted-foreground">Cadastre o primeiro ou mude os filtros.</p>
        </div>
      ) : (
        <ul className="space-y-3" data-testid="lista-imoveis-painel">
          {imoveis.map((i) => (
            <li
              key={i.id}
              className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-card sm:flex-row sm:items-center"
            >
              <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-36">
                {i.fotos[0] && (
                  // eslint-disable-next-line @next/next/no-img-element -- miniatura do painel
                  <img src={i.fotos[0].arquivo} alt="" className="size-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <SeloStatus status={i.status} />
                  {i.exemplo && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold ring-1 ring-border">
                      Exemplo
                    </span>
                  )}
                  {i.destaque && (
                    <span className="rounded-full bg-destaque-suave px-2 py-0.5 text-xs font-semibold text-destaque-texto">
                      Destaque
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">{i.codigo}</span>
                </div>
                <p className="mt-1 truncate font-bold">{i.titulo}</p>
                <p className="text-sm text-muted-foreground">
                  {i.bairro} · {i.preco !== null ? formatarPreco(Number(i.preco)) : '—'}
                  {ehAdmin && ` · ${nomeCorretor.get(i.corretor_id) ?? i.corretor_id}`} · atualizado
                  em {formatarData(i.atualizado_em)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href={`/admin/imoveis/${i.id}`}>
                    <Pencil aria-hidden /> Editar
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/imoveis/${i.id}/previa`}>
                    <Eye aria-hidden /> Prévia
                  </Link>
                </Button>
                <form action={duplicarImovel.bind(null, i.id)}>
                  <Button type="submit" size="sm" variant="outline">
                    <Copy aria-hidden /> Duplicar
                  </Button>
                </form>
                {i.status !== 'rascunho' && (
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/imoveis/${i.slug}`} target="_blank">
                      <ExternalLink aria-hidden /> No site
                    </Link>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
