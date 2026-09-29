'use client';

import { useState } from 'react';
import type { ResumoAnual } from '@/lib/financiamento';
import { formatarBRL, formatarPrecoCurto } from '@/lib/utils/formatar';

const L = 800;
const A = 280;
const M = { topo: 12, dir: 8, base: 28, esq: 64 };

/**
 * Quanto se paga por ano, separado em amortização (abate a dívida) e juros.
 * Barras empilhadas, um eixo, tooltip por barra; a tabela ano a ano é a alternativa acessível.
 */
export function GraficoEvolucao({ anos }: { anos: ResumoAnual[] }) {
  const [ativo, setAtivo] = useState<number | null>(null);
  if (anos.length === 0) return null;
  const max = Math.max(...anos.map((a) => a.totalPago));
  const passo = Math.pow(10, Math.floor(Math.log10(max)));
  const topo = Math.ceil(max / passo) * passo;
  const larguraArea = L - M.esq - M.dir;
  const alturaArea = A - M.topo - M.base;
  const larguraBanda = larguraArea / anos.length;
  const larguraBarra = Math.max(3, larguraBanda - Math.min(6, larguraBanda * 0.3));
  const y = (v: number) => M.topo + alturaArea - (v / topo) * alturaArea;
  const marcas = [0, topo / 2, topo];
  const rotulosX = anos.filter((a) => a.ano === 1 || a.ano % 5 === 0);
  const sel = ativo !== null ? anos[ativo] : null;

  return (
    <figure className="space-y-3">
      <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[0.95rem]">
        <span className="font-semibold">Quanto você paga por ano</span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-sm bg-grafico-amortizacao" aria-hidden /> Amortização
          (abate a dívida)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-sm bg-grafico-juros" aria-hidden /> Juros
        </span>
      </figcaption>
      <div className="relative">
        <svg
          viewBox={`0 0 ${L} ${A}`}
          className="h-auto w-full"
          role="img"
          aria-label="Gráfico de barras: pagamento anual dividido em amortização e juros. Os valores estão na tabela ano a ano abaixo."
          onMouseLeave={() => setAtivo(null)}
        >
          {marcas.map((m) => (
            <g key={m}>
              <line
                x1={M.esq}
                x2={L - M.dir}
                y1={y(m)}
                y2={y(m)}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={M.esq - 8}
                y={y(m) + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[12px]"
              >
                {formatarPrecoCurto(m)}
              </text>
            </g>
          ))}
          {anos.map((a, i) => {
            const x = M.esq + i * larguraBanda + (larguraBanda - larguraBarra) / 2;
            const yAmort = y(a.amortizacao);
            const yTotal = y(a.totalPago);
            const base = y(0);
            const esmaecido = ativo !== null && ativo !== i;
            return (
              <g key={a.ano} opacity={esmaecido ? 0.45 : 1}>
                <rect
                  x={x}
                  y={yAmort}
                  width={larguraBarra}
                  height={Math.max(0, base - yAmort)}
                  className="fill-grafico-amortizacao"
                />
                <path
                  d={`M${x},${yAmort - 2} V${yTotal + 3} Q${x},${yTotal} ${x + 3},${yTotal} H${x + larguraBarra - 3} Q${x + larguraBarra},${yTotal} ${x + larguraBarra},${yTotal + 3} V${yAmort - 2} Z`}
                  className="fill-grafico-juros"
                />
                <rect
                  x={M.esq + i * larguraBanda}
                  y={M.topo}
                  width={larguraBanda}
                  height={alturaArea}
                  fill="transparent"
                  onMouseEnter={() => setAtivo(i)}
                  onClick={() => setAtivo(i)}
                />
              </g>
            );
          })}
          {rotulosX.map((a) => (
            <text
              key={a.ano}
              x={M.esq + (a.ano - 0.5) * larguraBanda}
              y={A - 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[12px]"
            >
              Ano {a.ano}
            </text>
          ))}
        </svg>
        {sel && (
          <div
            className="pointer-events-none absolute top-0 rounded-lg border bg-popover px-3 py-2 text-sm shadow-md"
            style={{
              left: `${Math.min(70, Math.max(0, (((ativo ?? 0) + 0.5) / anos.length) * 100 - 10))}%`,
            }}
            role="status"
          >
            <p className="font-bold">Ano {sel.ano}</p>
            <p>Total pago: {formatarBRL(sel.totalPago)}</p>
            <p>Amortização: {formatarBRL(sel.amortizacao)}</p>
            <p>Juros: {formatarBRL(sel.juros)}</p>
          </div>
        )}
      </div>
    </figure>
  );
}
