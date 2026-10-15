import { MapPinned } from 'lucide-react';
import { Suspense, type ReactNode } from 'react';
import { MODO_ESTATICO } from '@/config/site';
import { Trilha } from '@/components/comum/Trilha';
import { lerFiltros, type Filtros } from '@/lib/busca/query';
import { repositorio } from '@/lib/repositorio';
import { CorpoListagem } from './CorpoListagem';
import { ListagemEstatica } from './ListagemEstatica';

export type ParamsBusca = Record<string, string | string[] | undefined>;

interface Props {
  searchParams: Promise<ParamsBusca>;
  caminho: string;
  fixos?: Partial<Filtros>;
  titulo: string;
  introducao?: string;
  trilha: { nome: string; href: string }[];
  /** Bloco opcional de "buscar por região" (mapa de bairros), mostrado antes da listagem. */
  regiao?: ReactNode;
}

export async function PaginaListagem({
  searchParams,
  caminho,
  fixos = {},
  titulo,
  introducao,
  trilha,
  regiao,
}: Props) {
  // Na versão estática a página não lê a URL no servidor: os filtros são aplicados no navegador.
  const filtrosUrl = lerFiltros(MODO_ESTATICO ? {} : await searchParams);
  const [resultado, bairros] = await Promise.all([
    repositorio.buscar({ ...filtrosUrl, ...fixos }),
    repositorio.bairros(),
  ]);
  const corpo = (
    <CorpoListagem
      filtrosUrl={filtrosUrl}
      fixos={fixos}
      resultado={resultado}
      bairros={bairros}
      caminho={caminho}
    />
  );

  return (
    <div className="container-site py-6 lg:py-8">
      <Trilha itens={trilha} />
      <div className="mt-3 mb-5">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{titulo}</h1>
        {introducao && <p className="mt-2 max-w-3xl text-lg text-muted-foreground">{introducao}</p>}
      </div>
      {regiao && (
        <details className="mb-6 rounded-2xl border bg-card p-4 open:pb-5 sm:p-5">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-lg font-bold">
            <MapPinned className="size-5 text-destaque-texto" aria-hidden />
            Buscar por região
          </summary>
          <div className="mt-4">{regiao}</div>
        </details>
      )}
      {MODO_ESTATICO ? (
        <Suspense fallback={corpo}>
          <ListagemEstatica
            todos={await repositorio.listarResumos()}
            bairros={bairros}
            caminho={caminho}
            fixos={fixos}
          />
        </Suspense>
      ) : (
        corpo
      )}
    </div>
  );
}
