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
import { compararImoveis, placar } from '@/lib/comparacao';
import { useMontado } from '@/lib/cliente/armazenamento';
import { useComparacao } from '@/lib/cliente/estado';
import { useTodosResumos, type ResumoComFotos } from '@/lib/cliente/resumos';
import { formatarPreco } from '@/lib/utils/formatar';
import { cn } from '@/lib/utils';
import { FotosFade } from './FotosFade';

/**
 * Cartão de comparação pequeno, flutuando no canto inferior da tela (não empurra a listagem).
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
  // A chave reinicia o cartão (aberto) sempre que outro imóvel é escolhido para comparar.
  return <Conteudo key={comparado ?? 'base'} base={imovelBase} comparado={imovelComparado} />;
}

function Conteudo({ base, comparado }: { base: ResumoComFotos; comparado?: ResumoComFotos }) {
  const { encerrar, fecharComparado, tornarBase } = useComparacao();
  const [aberto, setAberto] = useState(Boolean(comparado));

  // Esconde o WhatsApp flutuante enquanto o cartão está na tela (mesmo canto).
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.toggleAttribute('data-comparando', true);
    return () => raiz.removeAttribute('data-comparando');
  }, []);

  const diferencas = comparado ? compararImoveis(comparado, base) : [];
  const { ganha, perde } = placar(diferencas);
  const destaque = comparado ?? base;

  return (
    <aside
      aria-label="Comparação de imóveis"
      className={cn(
        'fixed right-3 bottom-3 z-50 flex w-[min(20rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl',
        'max-h-[min(30rem,calc(100dvh-6rem))]',
        'animate-in duration-300 fade-in slide-in-from-bottom-4',
      )}
    >
      {/* Faixa do topo: sempre visível; toque para abrir/recolher */}
      <div className="flex items-center gap-1 border-b py-1 pr-1 pl-2.5">
        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={aberto}
        >
          <Scale className="size-4 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">
              {comparado ? `${comparado.codigo} x ${base.codigo}` : `Base: ${base.codigo}`}
            </span>
            {comparado ? (
              <span className="flex items-center gap-1 text-[0.7rem] font-semibold">
                <span className="inline-flex items-center gap-0.5 rounded-full bg-sucesso-suave px-1.5 text-sucesso">
                  <CircleCheck className="size-3" aria-hidden /> Ganha {ganha}
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-perda-suave px-1.5 text-perda">
                  <CircleX className="size-3" aria-hidden /> Perde {perde}
                </span>
              </span>
            ) : (
              <span className="block truncate text-[0.7rem] text-muted-foreground">
                Escolha &quot;Comparar com este&quot; em outro imóvel
              </span>
            )}
          </span>
          {aberto ? (
            <ChevronDown className="size-4 shrink-0" aria-hidden />
          ) : (
            <ChevronUp className="size-4 shrink-0" aria-hidden />
          )}
          <span className="sr-only">{aberto ? 'Recolher' : 'Ver detalhes'}</span>
        </button>
        <button
          type="button"
          onClick={encerrar}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl hover:bg-muted"
          aria-label="Encerrar comparação"
          title="Encerrar comparação"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {aberto && (
        <div className="overflow-y-auto overscroll-contain">
          <div className="flex gap-2.5 p-2.5">
            <FotosFade
              key={destaque.id}
              fotos={destaque.fotos}
              className="h-16 w-24 shrink-0 rounded-lg"
              compacta
            />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[0.8rem] leading-snug font-bold">{destaque.titulo}</p>
              <p className="truncate text-[0.7rem] text-muted-foreground">
                {destaque.bairro} · {formatarPreco(destaque.preco)}
              </p>
              {comparado && (
                <Link
                  href={`/imoveis/${comparado.slug}`}
                  className="inline-flex min-h-7 items-center gap-1 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Ver anúncio <ExternalLink className="size-3" aria-hidden />
                </Link>
              )}
            </div>
          </div>

          {comparado ? (
            <>
              <dl className="grid grid-cols-2 gap-1 px-2.5">
                {diferencas.map((d) => (
                  <div
                    key={d.chave}
                    className={cn(
                      'min-w-0 rounded-md px-2 py-1',
                      d.resultado === 'ganha' && 'bg-sucesso-suave',
                      d.resultado === 'perde' && 'bg-perda-suave',
                      d.resultado === 'igual' && 'bg-muted',
                    )}
                    title={`${d.rotulo} na base (${base.codigo}): ${d.valorBase}`}
                  >
                    <dt className="truncate text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                      {d.rotulo}
                    </dt>
                    <dd
                      className={cn(
                        'flex items-center gap-1 text-xs font-bold tabular-nums',
                        d.resultado === 'ganha' && 'text-sucesso',
                        d.resultado === 'perde' && 'text-perda',
                      )}
                    >
                      {d.resultado === 'ganha' && (
                        <CircleCheck className="size-3 shrink-0" aria-hidden />
                      )}
                      {d.resultado === 'perde' && (
                        <CircleX className="size-3 shrink-0" aria-hidden />
                      )}
                      <span className="truncate">{d.valor}</span>
                      <span className="sr-only">
                        {d.resultado === 'igual' ? ', igual à base' : `, ${d.texto}`}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="grid grid-cols-2 gap-1.5 p-2.5">
                <button
                  type="button"
                  onClick={() => tornarBase(comparado.id)}
                  className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border text-xs font-semibold hover:bg-muted"
                >
                  <Repeat className="size-3.5" aria-hidden /> Tornar base
                </button>
                <button
                  type="button"
                  onClick={fecharComparado}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border text-xs font-semibold hover:bg-muted"
                >
                  Comparar outro
                </button>
              </div>
            </>
          ) : (
            <p className="px-2.5 pb-2.5 text-xs text-muted-foreground">
              Os cards mostram em <strong className="text-sucesso">verde</strong> o que ganham e em{' '}
              <strong className="text-perda">vermelho</strong> o que perdem frente a este imóvel.
            </p>
          )}
        </div>
      )}
    </aside>
  );
}
