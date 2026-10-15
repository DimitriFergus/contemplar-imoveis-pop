import { SearchX } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { MENSAGENS_WHATSAPP } from '@/config/site';
import { BotaoWhatsApp } from '@/components/comum/BotaoWhatsApp';
import { ChamadaCabeNoBolso } from '@/components/busca/ChamadaCabeNoBolso';
import { ChipsFiltros } from '@/components/busca/ChipsFiltros';
import { Ordenacao } from '@/components/busca/Ordenacao';
import { PainelFiltros } from '@/components/busca/PainelFiltros';
import { Paginacao } from '@/components/busca/Paginacao';
import { PainelComparacao } from '@/components/comparacao/PainelComparacao';
import { CardImovel } from '@/components/imoveis/CardImovel';
import { NotaPremissas } from '@/components/imoveis/NotaPremissas';
import { MapaClustersComprar } from '@/components/mapa/Mapas';
import { Button } from '@/components/ui/button';
import { bairrosComLocalizacao } from '@/lib/busca/bairros-mapa';
import { chipsAtivos, paraQueryString, type Filtros, type ResultadoBusca } from '@/lib/busca/query';
import type { BairroComTotal } from '@/lib/repositorio/tipos';
import { plural } from '@/lib/utils/formatar';

export interface PropsCorpoComprar {
  filtrosUrl: Filtros;
  fixos: Partial<Filtros>;
  resultado: ResultadoBusca;
  bairros: BairroComTotal[];
  caminho: string;
}

/**
 * Página "Comprar": mapa fixo à esquerda com todos os imóveis filtrados e, à direita, a lista
 * com rolagem própria — os dois sempre visíveis juntos (sem alternar entre lista e mapa). No
 * celular o mapa fica em cima e a lista embaixo, na mesma ordem.
 */
export function CorpoComprar({ filtrosUrl, fixos, resultado, bairros, caminho }: PropsCorpoComprar) {
  const filtros: Filtros = { ...filtrosUrl, ...fixos };
  const nomesBairros = Object.fromEntries(bairros.map((b) => [b.slug, b.nome]));
  const semFixos: Partial<Filtros> = { ...filtrosUrl };
  const chaveFiltros = paraQueryString(filtros);
  const temFiltros = chipsAtivos(filtrosUrl).length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-bold" role="status" aria-live="polite">
          {resultado.total === 0
            ? 'Nenhum imóvel encontrado'
            : `${plural(resultado.total, 'imóvel encontrado', 'imóveis encontrados')}`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Suspense>
            <PainelFiltros
              key={chaveFiltros}
              modo="celular"
              filtros={filtros}
              bairros={bairros}
              caminho={caminho}
              fixos={fixos}
              totalAtual={resultado.total}
            />
          </Suspense>
          <Ordenacao filtros={filtros} caminho={caminho} fixos={fixos} />
        </div>
      </div>

      <ChipsFiltros filtros={filtros} caminho={caminho} nomesBairros={nomesBairros} fixos={fixos} />
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
              <Link href={caminho}>Ver todos os imóveis</Link>
            </Button>
            <BotaoWhatsApp
              mensagem={MENSAGENS_WHATSAPP.geral}
              local="comprar_busca_vazia"
              rotulo="Pedir ajuda no WhatsApp"
              size="lg"
            />
          </div>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-[1.3fr_1fr] lg:items-start lg:gap-5">
          <div>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          </div>
          <div className="mt-5 h-80 overflow-hidden rounded-2xl ring-1 ring-border sm:h-96 lg:sticky lg:top-20 lg:mt-0 lg:h-[calc(100dvh-6rem)]">
            <MapaClustersComprar bairros={bairrosComLocalizacao(resultado.todos)} caminho={caminho} filtrosAtuais={filtros} />
          </div>
        </div>
      )}

      {resultado.total > 0 && <NotaPremissas />}
      <PainelComparacao />
      {temFiltros && (
        <p className="sr-only">
          Os filtros ficam salvos no endereço da página; você pode compartilhar este link.
        </p>
      )}
    </div>
  );
}
