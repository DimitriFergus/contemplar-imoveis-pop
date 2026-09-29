'use client';

import { GitCompareArrows, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { NotaPremissas, ID_NOTA_SIMULACAO } from '@/components/imoveis/NotaPremissas';
import { Button } from '@/components/ui/button';
import { useMontado } from '@/lib/cliente/armazenamento';
import { useComparar } from '@/lib/cliente/estado';
import { useResumos } from '@/lib/cliente/useResumos';
import {
  ROTULO_CONDICAO_CURTO,
  ROTULO_SITUACAO,
  ROTULO_TIPO,
  type ChaveCondicao,
} from '@/lib/rotulos';
import { formatarArea, formatarBRL, formatarPreco } from '@/lib/utils/formatar';
import type { ImovelResumo } from '@/types';
import { caminhoPublico } from '@/lib/utils/caminho';

const FINANCIAMENTOS: ChaveCondicao[] = [
  'aceitaMCMV',
  'aceitaFGTS',
  'aceitaSBPE',
  'aceitaConsorcio',
  'aceitaPermuta',
  'entradaFacilitada',
];

export function TabelaComparacao() {
  const montado = useMontado();
  const { ids, remover, limpar, max } = useComparar();
  const { imoveis, carregando, erro } = useResumos(ids, montado);

  if (!montado || carregando)
    return (
      <p role="status" className="py-10 text-center text-muted-foreground">
        Carregando comparação…
      </p>
    );
  if (erro) return <p role="alert">Não foi possível carregar a comparação agora.</p>;
  if (imoveis.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <GitCompareArrows className="mx-auto size-12 text-muted-foreground" aria-hidden />
        <h2 className="mt-3 text-xl font-bold">Escolha até {max} imóveis para comparar</h2>
        <p className="mt-2 text-muted-foreground">
          Toque em &quot;Comparar&quot; nos imóveis da busca ou nos seus favoritos.
        </p>
        <Button asChild size="lg" className="mt-5">
          <Link href="/imoveis">Ver imóveis</Link>
        </Button>
      </div>
    );
  }

  const linhas: { rotulo: string; valor: (i: ImovelResumo) => ReactNode; destaque?: boolean }[] = [
    { rotulo: 'Preço total', valor: (i) => formatarPreco(i.preco), destaque: true },
    {
      rotulo: 'Parcela estimada*',
      valor: (i) => (
        <>
          {formatarPreco(i.parcelaEstimada)}/mês{' '}
          <a
            href={`#${ID_NOTA_SIMULACAO}`}
            className="text-muted-foreground"
            aria-label="Ver premissas"
          >
            *
          </a>
        </>
      ),
      destaque: true,
    },
    { rotulo: 'Tipo', valor: (i) => ROTULO_TIPO[i.tipo] },
    { rotulo: 'Situação', valor: (i) => ROTULO_SITUACAO[i.situacao] },
    { rotulo: 'Bairro', valor: (i) => i.bairro },
    { rotulo: 'Área útil', valor: (i) => formatarArea(i.areaUtilM2) },
    { rotulo: 'Quartos', valor: (i) => i.quartos },
    { rotulo: 'Banheiros', valor: (i) => i.banheiros },
    { rotulo: 'Vagas', valor: (i) => i.vagas || 'Não tem' },
    {
      rotulo: 'Condomínio',
      valor: (i) => (i.condominioMensal ? `${formatarBRL(i.condominioMensal)}/mês` : 'Não tem'),
    },
    {
      rotulo: 'Financiamento aceito',
      valor: (i) =>
        FINANCIAMENTOS.filter((c) => i.condicoes[c])
          .map((c) => ROTULO_CONDICAO_CURTO[c])
          .join(', ') || '—',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button variant="outline" onClick={limpar}>
          Limpar comparação
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[40rem] table-fixed text-left">
          <caption className="sr-only">Comparação de imóveis</caption>
          <thead>
            <tr>
              <td className="w-36 p-3" />
              {imoveis.map((i) => (
                <th key={i.id} scope="col" className="p-3 align-top">
                  <div className="relative mb-2 aspect-[3/2] overflow-hidden rounded-xl bg-muted">
                    {i.foto && (
                      <Image
                        src={caminhoPublico(i.foto.arquivo)}
                        alt={i.foto.alt}
                        fill
                        sizes="300px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <Link
                    href={`/imoveis/${i.slug}`}
                    className="font-bold underline-offset-2 hover:underline"
                  >
                    {i.titulo}
                  </Link>
                  <p className="text-sm font-normal text-muted-foreground">Cód. {i.codigo}</p>
                  <button
                    type="button"
                    onClick={() => remover(i.id)}
                    className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted-foreground underline"
                  >
                    <X className="size-4" aria-hidden /> Remover
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.rotulo} className="border-t">
                <th scope="row" className="bg-muted/60 p-3 text-[0.95rem] font-semibold">
                  {l.rotulo}
                </th>
                {imoveis.map((i) => (
                  <td
                    key={i.id}
                    className={l.destaque ? 'p-3 text-lg font-bold text-primary' : 'p-3'}
                  >
                    {l.valor(i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <NotaPremissas />
    </div>
  );
}
