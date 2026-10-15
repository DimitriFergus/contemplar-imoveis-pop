import { SearchX } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { MENSAGENS_WHATSAPP } from '@/config/site';
import { BotaoWhatsApp } from '@/components/comum/BotaoWhatsApp';
import { ChipsFiltros } from '@/components/busca/ChipsFiltros';
import { Ordenacao } from '@/components/busca/Ordenacao';
import { PainelFiltros } from '@/components/busca/PainelFiltros';
import { MapaClustersComprar } from '@/components/mapa/Mapas';
import { Button } from '@/components/ui/button';
import { paraQueryString, type Filtros, type ResultadoBusca } from '@/lib/busca/query';
import type { BairroComTotal } from '@/lib/repositorio/tipos';
import { plural } from '@/lib/utils/formatar';
import { GradeInfinita } from './GradeInfinita';

export interface PropsCorpoComprar {
  filtrosUrl: Filtros;
  fixos: Partial<Filtros>;
  resultado: ResultadoBusca;
  bairros: BairroComTotal[];
  caminho: string;
}

/**
 * Catálogo "Comprar": mapa fixo à esquerda (clusters por bairro, clicáveis) e, à direita, a
 * grade de imóveis que carrega mais sozinha ao rolar — sem páginas e sem texto explicando a
 * seção. No celular o mapa fica em cima e a grade embaixo.
 */
export function CorpoComprar({ filtrosUrl, fixos, resultado, bairros, caminho }: PropsCorpoComprar) {
  const filtros: Filtros = { ...filtrosUrl, ...fixos };
  const nomesBairros = Object.fromEntries(bairros.map((b) => [b.slug, b.nome]));
  const chaveFiltros = paraQueryString(filtros);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold" role="status" aria-live="polite">
          {resultado.total === 0
            ? 'Nenhum imóvel encontrado'
            : plural(resultado.total, 'imóvel', 'imóveis')}
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

      {resultado.total === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <SearchX className="mx-auto size-12 text-muted-foreground" aria-hidden />
          <h2 className="mt-3 text-xl font-bold">Nenhum imóvel com esses filtros</h2>
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
        <div className="lg:grid lg:grid-cols-[2fr_3fr] lg:items-start lg:gap-5">
          <div className="h-80 overflow-hidden rounded-2xl ring-1 ring-border sm:h-96 lg:sticky lg:top-20 lg:h-[calc(100dvh-6rem)]">
            <MapaClustersComprar imoveis={resultado.todos} />
          </div>
          <div id="lista" className="mt-5 scroll-mt-20 lg:mt-0">
            <GradeInfinita itens={resultado.todos} />
          </div>
        </div>
      )}
    </div>
  );
}
