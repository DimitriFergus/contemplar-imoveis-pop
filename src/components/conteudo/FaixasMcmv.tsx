'use client';

import { ArrowRight, Calculator, Home, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  AVISO_SIMULACAO,
  AVISO_SUBSIDIO,
  COMPROMETIMENTO_MAXIMO_RENDA,
} from '@/config/financiamento';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { paraQueryString } from '@/lib/busca/query';
import type { LimiteDaFaixa } from '@/lib/financiamento/por-faixa';
import { ROTULO_TIPO } from '@/lib/rotulos';
import { caminhoPublico } from '@/lib/utils/caminho';
import { formatarPercentual, formatarPreco, plural } from '@/lib/utils/formatar';
import type { Foto, TipoImovel } from '@/types';
import { cn } from '@/lib/utils';

export interface ImovelNaFaixa {
  id: string;
  slug: string;
  codigo: string;
  titulo: string;
  tipo: TipoImovel;
  bairro: string;
  preco: number;
  foto: Foto | null;
  parcela: number;
  rendaMinima: number;
}

export interface FaixaComImoveis {
  id: string;
  nome: string;
  rendaMinima: number;
  rendaMaxima: number | null;
  podeTerSubsidio: boolean;
  limite: LimiteDaFaixa;
  imoveis: ImovelNaFaixa[];
}

const textoRenda = (f: FaixaComImoveis) =>
  f.rendaMinima > 0
    ? `${formatarPreco(f.rendaMinima)} a ${formatarPreco(f.rendaMaxima ?? 0)}`
    : `Até ${formatarPreco(f.rendaMaxima ?? 0)}`;

/** Cards das faixas do MCMV: ao clicar, abre os imóveis compatíveis com aquela renda. */
export function FaixasMcmv({ faixas }: { faixas: FaixaComImoveis[] }) {
  const [aberta, setAberta] = useState<FaixaComImoveis | null>(null);

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {faixas.map((f) => (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => setAberta(f)}
              className="group flex h-full w-full flex-col rounded-2xl border bg-card p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-card-hover focus-visible:ring-3 focus-visible:ring-ring"
              aria-haspopup="dialog"
            >
              <span className="text-sm font-bold tracking-wide text-destaque-texto uppercase">
                {f.nome}
              </span>
              <span className="mt-2 text-xl font-bold">{textoRenda(f)}</span>
              <span className="text-sm text-muted-foreground">de renda familiar por mês</span>
              <span className="mt-3 text-[0.95rem]">
                {f.podeTerSubsidio ? 'Pode ter subsídio do governo' : 'Juros menores que o mercado'}
              </span>
              <span className="mt-4 flex items-center justify-between gap-2 border-t pt-3 font-semibold text-primary">
                <span>
                  {f.imoveis.length > 0
                    ? `Ver ${plural(f.imoveis.length, 'imóvel', 'imóveis')} para esta renda`
                    : 'Ver o que dá para comprar'}
                </span>
                <ArrowRight
                  className="size-5 shrink-0 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={aberta !== null} onOpenChange={(a) => !a && setAberta(null)}>
        {aberta && <ConteudoFaixa faixa={aberta} />}
      </Dialog>
    </>
  );
}

function ConteudoFaixa({ faixa }: { faixa: FaixaComImoveis }) {
  const { limite } = faixa;
  const buscar = `/imoveis${paraQueryString({ precoMax: Math.floor(limite.precoMaximo / 1000) * 1000, condicoes: ['aceitaMCMV'] })}`;

  return (
    <DialogContent
      className={cn(
        'top-auto bottom-0 left-0 flex max-h-[92dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-t-3xl rounded-b-none p-0',
        'sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[88dvh] sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl',
      )}
    >
      <div className="border-b px-5 pt-4 pb-4 sm:px-6 sm:pt-6">
        <div
          className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted-foreground/30 sm:hidden"
          aria-hidden
        />
        <p className="text-sm font-bold tracking-wide text-destaque-texto uppercase">
          Minha Casa, Minha Vida · {faixa.nome}
        </p>
        <DialogTitle className="mt-1 pr-10 text-2xl font-extrabold">
          Renda{' '}
          {faixa.rendaMinima > 0
            ? `de ${textoRenda(faixa)}`
            : `até ${formatarPreco(faixa.rendaMaxima ?? 0)}`}
        </DialogTitle>
        <DialogDescription className="mt-2 text-base text-foreground">
          Com renda familiar de até <strong>{formatarPreco(limite.rendaReferencia)}</strong>, a
          parcela pode chegar a <strong>{formatarPreco(limite.parcelaMaxima)}/mês</strong> (
          {formatarPercentual(COMPROMETIMENTO_MAXIMO_RENDA)} da renda). Isso permite imóveis de até{' '}
          <strong className="text-primary">{formatarPreco(limite.precoMaximo)}</strong>
          {limite.limitadoPeloTeto ? ' (teto da faixa)' : ''}, com entrada de cerca de{' '}
          <strong>{formatarPreco(limite.entradaEstimada)}</strong> em dinheiro e/ou FGTS.
        </DialogDescription>
        {faixa.podeTerSubsidio && (
          <p className="mt-2 rounded-xl bg-sucesso-suave px-3 py-2 text-sm text-sucesso">
            {AVISO_SUBSIDIO} O subsídio pode reduzir a entrada.
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
        {faixa.imoveis.length > 0 ? (
          <>
            <p className="mb-3 font-bold">
              {plural(faixa.imoveis.length, 'imóvel', 'imóveis')} para esta renda
            </p>
            <ul className="space-y-2">
              {faixa.imoveis.map((i) => (
                <li key={i.id}>
                  <Link
                    href={`/imoveis/${i.slug}`}
                    className="flex items-center gap-3 rounded-2xl border p-2 transition-colors hover:border-primary hover:bg-info-suave/50"
                    data-sem-sublinhado
                  >
                    <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {i.foto && (
                        <Image
                          src={caminhoPublico(i.foto.arquivo)}
                          alt=""
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.95rem] font-bold">{i.titulo}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {ROTULO_TIPO[i.tipo]} · {i.bairro} · Cód. {i.codigo}
                      </span>
                      <span className="mt-0.5 flex flex-wrap gap-x-3 text-sm">
                        <span className="font-bold text-primary">{formatarPreco(i.preco)}</span>
                        <span>~{formatarPreco(i.parcela)}/mês*</span>
                        <span className="text-muted-foreground">
                          renda a partir de {formatarPreco(i.rendaMinima)}
                        </span>
                      </span>
                    </span>
                    <ArrowRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              *Parcela estimada com a taxa de referência da {faixa.nome} (
              {formatarPercentual(limite.taxaAnual)} a.a.), financiando{' '}
              {formatarPercentual(1 - limite.entradaEstimada / limite.precoMaximo)} do valor, sem
              seguros. {AVISO_SIMULACAO}
            </p>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed p-6 text-center">
            <Home className="mx-auto size-10 text-muted-foreground" aria-hidden />
            <p className="mt-2 font-semibold">Ainda não temos imóveis nesta faixa no momento.</p>
            <p className="text-sm text-muted-foreground">
              Novos imóveis chegam toda semana. Fale com a gente para receber as novidades.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-2 border-t bg-card p-4 sm:grid-cols-2 sm:px-6">
        <Button asChild size="lg" variant="destaque">
          <Link href="/simulador">
            <Calculator className="size-5" aria-hidden /> Fazer minha simulação
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={buscar}>
            <Search className="size-5" aria-hidden /> Ver na busca de imóveis
          </Link>
        </Button>
      </div>
    </DialogContent>
  );
}
