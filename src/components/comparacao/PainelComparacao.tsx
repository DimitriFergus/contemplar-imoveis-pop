'use client';

import {
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleX,
  ExternalLink,
  Repeat,
  Scale,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { compararImoveis, placar } from '@/lib/comparacao';
import { useMontado } from '@/lib/cliente/armazenamento';
import { useComparacao } from '@/lib/cliente/estado';
import { useTodosResumos, type ResumoComFotos } from '@/lib/cliente/resumos';
import { formatarPreco } from '@/lib/utils/formatar';
import { cn } from '@/lib/utils';
import { FotosFade } from './FotosFade';

/**
 * Pop-up de comparação: lateral no computador e painel inferior no celular.
 * Mostra o outro imóvel com fotos em fade e, item a item, em verde o que ele ganha e em
 * vermelho o que perde em relação ao imóvel base.
 */
export function PainelComparacao() {
  const { base, comparado } = useComparacao();
  const montado = useMontado();
  const { imoveis } = useTodosResumos(montado && Boolean(base));
  if (!montado || !base || !imoveis) return null;
  const imovelBase = imoveis.find((i) => i.id === base);
  if (!imovelBase) return null;
  const imovelComparado = comparado ? imoveis.find((i) => i.id === comparado) : undefined;
  // A chave reinicia o painel (aberto) sempre que outro imóvel é escolhido para comparar.
  return <Conteudo key={comparado ?? 'base'} base={imovelBase} comparado={imovelComparado} />;
}

function Conteudo({ base, comparado }: { base: ResumoComFotos; comparado?: ResumoComFotos }) {
  const { encerrar, fecharComparado, tornarBase } = useComparacao();
  const [aberto, setAberto] = useState(Boolean(comparado));
  const [minimizado, setMinimizado] = useState(false);

  // Marca a página para abrir espaço ao painel lateral (computador) e esconder o WhatsApp flutuante (celular).
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.toggleAttribute('data-comparando', true);
    raiz.toggleAttribute('data-comparando-lateral', !minimizado);
    return () => {
      raiz.removeAttribute('data-comparando');
      raiz.removeAttribute('data-comparando-lateral');
    };
  }, [minimizado]);

  const diferencas = comparado ? compararImoveis(comparado, base) : [];
  const { ganha, perde } = placar(diferencas);
  const destaque = comparado ?? base;

  if (minimizado) {
    return (
      <button
        type="button"
        onClick={() => setMinimizado(false)}
        className="fixed top-1/2 right-0 z-40 hidden -translate-y-1/2 flex-col items-center gap-2 rounded-l-2xl bg-primary px-2 py-4 text-sm font-bold text-primary-foreground shadow-xl lg:flex"
        aria-label="Abrir o painel de comparação"
      >
        <Scale className="size-5" aria-hidden />
        <span className="[writing-mode:vertical-rl]">Comparação</span>
      </button>
    );
  }

  const resumo = comparado ? (
    <span className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
      <span className="inline-flex items-center gap-1 rounded-full bg-sucesso-suave px-2 py-0.5 text-sucesso">
        <CircleCheck className="size-3.5" aria-hidden /> Ganha em {ganha}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-perda-suave px-2 py-0.5 text-perda">
        <CircleX className="size-3.5" aria-hidden /> Perde em {perde}
      </span>
    </span>
  ) : (
    <span className="text-sm text-muted-foreground">Base: {base.codigo}</span>
  );

  return (
    <aside
      aria-label="Comparação de imóveis"
      className={cn(
        'fixed z-50 flex flex-col overflow-hidden border bg-card text-card-foreground shadow-2xl',
        'inset-x-0 bottom-0 rounded-t-3xl',
        'lg:inset-x-auto lg:top-20 lg:right-4 lg:bottom-4 lg:w-[22rem] lg:rounded-3xl',
        'animate-in duration-300 fade-in slide-in-from-bottom-8 lg:slide-in-from-bottom-0 lg:slide-in-from-right-8',
      )}
    >
      {/* Cabeçalho (no celular, toque para abrir/fechar) */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left lg:pointer-events-none"
          aria-expanded={aberto}
        >
          <Scale className="size-5 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0">
            <span className="block truncate font-bold">
              {comparado ? `${comparado.codigo} x ${base.codigo}` : 'Comparação iniciada'}
            </span>
            {resumo}
          </span>
          <span className="ml-auto lg:hidden" aria-hidden>
            {aberto ? <ChevronDown className="size-5" /> : <ChevronUp className="size-5" />}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMinimizado(true)}
          className="hidden size-11 items-center justify-center rounded-xl hover:bg-muted lg:inline-flex"
          aria-label="Minimizar o painel"
          title="Minimizar"
        >
          <ChevronDown className="size-5 -rotate-90" aria-hidden />
        </button>
        <button
          type="button"
          onClick={encerrar}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl hover:bg-muted"
          aria-label="Encerrar comparação"
          title="Encerrar comparação"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <div
        className={cn(
          'max-h-[70dvh] flex-1 overflow-y-auto overscroll-contain lg:block lg:max-h-none',
          !aberto && 'hidden',
        )}
      >
        <FotosFade key={destaque.id} fotos={destaque.fotos} className="aspect-[3/2] w-full" />
        <div className="space-y-4 p-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {comparado ? 'Imóvel comparado' : 'Imóvel base'} · Cód. {destaque.codigo}
            </p>
            <h2 className="mt-0.5 text-lg leading-snug font-bold">{destaque.titulo}</h2>
            <p className="text-sm text-muted-foreground">{destaque.bairro}</p>
          </div>

          {comparado ? (
            <>
              <p className="text-sm text-muted-foreground">
                Em <strong className="text-sucesso">verde</strong> o que você ganha e em{' '}
                <strong className="text-perda">vermelho</strong> o que perde escolhendo este imóvel
                em vez do <strong className="text-foreground">{base.codigo}</strong>.
              </p>
              <dl className="divide-y rounded-2xl border">
                {diferencas.map((d) => (
                  <div
                    key={d.chave}
                    className={cn(
                      'flex items-center justify-between gap-3 px-3 py-2.5',
                      d.resultado === 'ganha' && 'bg-sucesso-suave/60',
                      d.resultado === 'perde' && 'bg-perda-suave/60',
                    )}
                  >
                    <dt className="text-sm">
                      <span className="font-semibold">{d.rotulo}</span>
                      <span className="block text-xs text-muted-foreground">
                        base: {d.valorBase}
                      </span>
                    </dt>
                    <dd className="text-right">
                      <span
                        className={cn(
                          'flex items-center justify-end gap-1 font-bold tabular-nums',
                          d.resultado === 'ganha' && 'text-sucesso',
                          d.resultado === 'perde' && 'text-perda',
                        )}
                      >
                        {d.resultado === 'ganha' && <CircleCheck className="size-4" aria-hidden />}
                        {d.resultado === 'perde' && <CircleX className="size-4" aria-hidden />}
                        {d.valor}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {d.resultado === 'igual' ? 'igual' : d.texto}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="grid gap-2">
                <Button asChild>
                  <Link href={`/imoveis/${comparado.slug}`}>
                    <ExternalLink className="size-4" aria-hidden /> Ver anúncio do{' '}
                    {comparado.codigo}
                  </Link>
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => tornarBase(comparado.id)}>
                    <Repeat className="size-4" aria-hidden /> Tornar base
                  </Button>
                  <Button variant="outline" size="sm" onClick={fecharComparado}>
                    Comparar outro
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-primary">{formatarPreco(base.preco)}</p>
              <div className="rounded-2xl bg-info-suave p-3 text-sm">
                <p className="font-semibold text-primary">Agora escolha outro imóvel</p>
                <p className="mt-1 text-foreground">
                  Toque em <strong>&quot;Comparar com este&quot;</strong> em qualquer imóvel da
                  lista. Os cards já mostram em <strong className="text-sucesso">verde</strong> o
                  que cada um ganha e em <strong className="text-perda">vermelho</strong> o que
                  perde em relação a este.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
