'use client';

import { CalendarClock, Home } from 'lucide-react';
import Link from 'next/link';
import { useOptimistic, useState, useTransition } from 'react';
import { IconeWhatsApp } from '@/components/comum/IconeWhatsApp';
import { moverLead } from '@/lib/admin/operacoes';
import { usePainel } from '@/lib/admin/sessao';
import { COR_ETAPA, ROTULO_ETAPA, ROTULO_ORIGEM, ROTULO_PERIODO } from '@/lib/admin/rotulos';
import { ETAPAS_LEAD, type EtapaLead, type LinhaLead } from '@/lib/supabase/tipos';
import { cn } from '@/lib/utils';

export type LeadDoQuadro = Pick<
  LinhaLead,
  | 'id'
  | 'nome'
  | 'whatsapp'
  | 'etapa'
  | 'origem'
  | 'codigo_imovel'
  | 'criado_em'
  | 'data_visita'
  | 'periodo_visita'
  | 'corretor_id'
>;

const tempo = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
function haQuanto(iso: string) {
  const minutos = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (Math.abs(minutos) < 60) return tempo.format(minutos, 'minute');
  const horas = Math.round(minutos / 60);
  if (Math.abs(horas) < 24) return tempo.format(horas, 'hour');
  return tempo.format(Math.round(horas / 24), 'day');
}

/** Funil de leads: arraste o cartão entre as colunas ou escolha a etapa no seletor. */
export function QuadroLeads({
  leads,
  nomesCorretores,
  aoMover,
}: {
  leads: LeadDoQuadro[];
  nomesCorretores: Record<string, string>;
  /** Atualiza a lista na tela depois que o banco confirmou a mudança. */
  aoMover?: (id: string, etapa: EtapaLead) => void;
}) {
  const sessao = usePainel();
  const [otimistas, mover] = useOptimistic(
    leads,
    (atual, { id, etapa }: { id: string; etapa: EtapaLead }) =>
      atual.map((l) => (l.id === id ? { ...l, etapa } : l)),
  );
  const [, iniciar] = useTransition();
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<EtapaLead | null>(null);
  const [erro, setErro] = useState<string>();

  const trocar = (id: string, etapa: EtapaLead) =>
    iniciar(async () => {
      mover({ id, etapa });
      const r = await moverLead(sessao, id, etapa);
      setErro(r.erro);
      if (r.ok) aoMover?.(id, etapa);
    });

  return (
    <>
      {erro && (
        <p className="mb-3 rounded-xl bg-perda-suave px-4 py-3 text-perda" role="alert">
          {erro}
        </p>
      )}
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        <div className="grid min-w-max auto-cols-[17rem] grid-flow-col gap-3" data-testid="funil">
          {ETAPAS_LEAD.map((etapa) => {
            const daEtapa = otimistas.filter((l) => l.etapa === etapa);
            return (
              <section
                key={etapa}
                aria-label={`${ROTULO_ETAPA[etapa]}: ${daEtapa.length}`}
                onDragOver={(e) => {
                  if (arrastando) {
                    e.preventDefault();
                    setSobre(etapa);
                  }
                }}
                onDragLeave={() => setSobre(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (arrastando) trocar(arrastando, etapa);
                  setArrastando(null);
                  setSobre(null);
                }}
                className={cn(
                  'flex min-h-64 flex-col rounded-2xl bg-card p-2 ring-1 ring-border transition-colors',
                  sobre === etapa && 'bg-info-suave ring-2 ring-primary',
                )}
              >
                <header className="flex items-center justify-between px-2 py-2">
                  <h2
                    className={cn('rounded-full px-2.5 py-0.5 text-sm font-bold', COR_ETAPA[etapa])}
                  >
                    {ROTULO_ETAPA[etapa]}
                  </h2>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {daEtapa.length}
                  </span>
                </header>
                <ul className="flex flex-1 flex-col gap-2">
                  {daEtapa.map((l) => (
                    <li
                      key={l.id}
                      draggable
                      onDragStart={() => setArrastando(l.id)}
                      onDragEnd={() => setArrastando(null)}
                      className={cn(
                        'cursor-grab rounded-xl border bg-background p-3 shadow-sm',
                        arrastando === l.id && 'opacity-50',
                      )}
                      data-testid="cartao-lead"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/admin/leads/ver?id=${l.id}`}
                          className="font-bold text-primary hover:underline"
                        >
                          {l.nome}
                        </Link>
                        <a
                          href={`https://wa.me/${l.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="grid size-9 shrink-0 place-items-center rounded-lg bg-whatsapp text-white"
                          aria-label={`Chamar ${l.nome} no WhatsApp`}
                        >
                          <IconeWhatsApp className="size-5" />
                        </a>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {ROTULO_ORIGEM[l.origem] ?? l.origem} · {haQuanto(l.criado_em)}
                      </p>
                      {l.codigo_imovel && (
                        <p className="mt-1 flex items-center gap-1 text-sm">
                          <Home className="size-3.5" aria-hidden /> {l.codigo_imovel}
                        </p>
                      )}
                      {l.data_visita && (
                        <p className="mt-1 flex items-center gap-1 text-sm">
                          <CalendarClock className="size-3.5" aria-hidden />
                          {l.data_visita.split('-').reverse().join('/')}
                          {l.periodo_visita && ` · ${ROTULO_PERIODO[l.periodo_visita] ?? ''}`}
                        </p>
                      )}
                      {Object.keys(nomesCorretores).length > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {l.corretor_id
                            ? (nomesCorretores[l.corretor_id] ?? l.corretor_id)
                            : 'Sem corretor'}
                        </p>
                      )}
                      <label className="mt-2 block">
                        <span className="sr-only">Mover {l.nome} para a etapa</span>
                        <select
                          value={l.etapa}
                          onChange={(e) => trocar(l.id, e.target.value as EtapaLead)}
                          className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
                        >
                          {ETAPAS_LEAD.map((e) => (
                            <option key={e} value={e}>
                              {ROTULO_ETAPA[e]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
