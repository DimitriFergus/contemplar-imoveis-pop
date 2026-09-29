import { SearchX } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { MENSAGENS_WHATSAPP } from '@/config/site';
import { BotaoWhatsApp } from '@/components/comum/BotaoWhatsApp';
import { PainelComparacao } from '@/components/comparacao/PainelComparacao';
import { CardImovel } from '@/components/imoveis/CardImovel';
import { NotaPremissas } from '@/components/imoveis/NotaPremissas';
import { MapaListagem } from '@/components/mapa/Mapas';
import { Button } from '@/components/ui/button';
import { chipsAtivos, paraQueryString, type Filtros, type ResultadoBusca } from '@/lib/busca/query';
import type { BairroComTotal } from '@/lib/repositorio/tipos';
import { plural } from '@/lib/utils/formatar';
import { AlternarVisao } from './AlternarVisao';
import { ChamadaCabeNoBolso } from './ChamadaCabeNoBolso';
import { ChipsFiltros } from './ChipsFiltros';
import { Ordenacao } from './Ordenacao';
import { PainelFiltros } from './PainelFiltros';
import { Paginacao } from './Paginacao';

export interface PropsCorpoListagem {
  filtrosUrl: Filtros;
  fixos: Partial<Filtros>;
  resultado: ResultadoBusca;
  bairros: BairroComTotal[];
  caminho: string;
}

/** Filtros + resultados. Renderiza no servidor ou no navegador (versão estática). */
export function CorpoListagem({
  filtrosUrl,
  fixos,
  resultado,
  bairros,
  caminho,
}: PropsCorpoListagem) {
  const filtros: Filtros = { ...filtrosUrl, ...fixos };
  const nomesBairros = Object.fromEntries(bairros.map((b) => [b.slug, b.nome]));
  const semFixos: Partial<Filtros> = { ...filtrosUrl };
  const visao = filtros.visao ?? 'lista';
  const chaveFiltros = paraQueryString(filtros);
  const temFiltros = chipsAtivos(filtrosUrl).length > 0;

  return (
    <div className="lg:grid lg:grid-cols-[18rem_1fr] lg:gap-8">
      <aside className="hidden lg:sticky lg:top-20 lg:block lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:pr-2">
        <Suspense>
          <PainelFiltros
            key={chaveFiltros}
            modo="lateral"
            filtros={filtros}
            bairros={bairros}
            caminho={caminho}
            fixos={fixos}
            totalAtual={resultado.total}
          />
        </Suspense>
      </aside>

      <section aria-labelledby="titulo-resultados" className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p id="titulo-resultados" className="text-lg font-bold" role="status" aria-live="polite">
            {resultado.total === 0
              ? 'Nenhum imóvel encontrado'
              : `${plural(resultado.total, 'imóvel encontrado', 'imóveis encontrados')}`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="lg:hidden">
              <PainelFiltros
                key={chaveFiltros}
                modo="celular"
                filtros={filtros}
                bairros={bairros}
                caminho={caminho}
                fixos={fixos}
                totalAtual={resultado.total}
              />
            </div>
            <Ordenacao filtros={filtros} caminho={caminho} fixos={fixos} />
            <AlternarVisao filtros={semFixos} caminho={caminho} />
          </div>
        </div>

        <ChipsFiltros
          filtros={filtros}
          caminho={caminho}
          nomesBairros={nomesBairros}
          fixos={fixos}
        />
        <ChamadaCabeNoBolso />

        {resultado.total === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <SearchX className="mx-auto size-12 text-muted-foreground" aria-hidden />
            <h2 className="mt-3 text-xl font-bold">Não achamos imóveis com todos esses filtros</h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              Tente remover algum filtro acima, aumentar o preço ou a parcela máxima, ou buscar em
              outros bairros. Novos imóveis chegam toda semana.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="outline" size="lg">
                <Link href="/imoveis">Ver todos os imóveis</Link>
              </Button>
              <BotaoWhatsApp
                mensagem={MENSAGENS_WHATSAPP.geral}
                local="busca_vazia"
                rotulo="Pedir ajuda no WhatsApp"
                size="lg"
              />
            </div>
          </div>
        ) : visao === 'mapa' ? (
          <div className="h-[70dvh] min-h-96 overflow-hidden rounded-2xl ring-1 ring-border">
            <MapaListagem imoveis={resultado.todos} />
          </div>
        ) : (
          <>
            <ul className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
              {resultado.itens.map((i, idx) => (
                <li key={i.id}>
                  <Suspense>
                    <CardImovel imovel={i} nivelTitulo="h2" prioridade={idx < 2} comparavel />
                  </Suspense>
                </li>
              ))}
            </ul>
            <Paginacao
              filtros={semFixos}
              caminho={caminho}
              pagina={resultado.pagina}
              totalPaginas={resultado.totalPaginas}
            />
          </>
        )}

        {resultado.total > 0 && <NotaPremissas />}
        <PainelComparacao />
        {temFiltros && (
          <p className="sr-only">
            Os filtros ficam salvos no endereço da página; você pode compartilhar este link.
          </p>
        )}
      </section>
    </div>
  );
}
