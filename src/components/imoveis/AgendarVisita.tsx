'use client';

import { CalendarCheck, CalendarDays, Check, Moon, Sun, Sunrise } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState, type ReactNode } from 'react';
import { AGENDAMENTO } from '@/config/site';
import { FormularioLead } from '@/components/leads/FormularioLead';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { rastrear } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { caminhoPublico } from '@/lib/utils/caminho';
import { formatarPreco } from '@/lib/utils/formatar';
import type { Foto } from '@/types';

export interface DiaDisponivel {
  valor: string;
  semana: string;
  dia: string;
  mes: string;
  extenso: string;
}

/** Próximos dias disponíveis para visita (configurável em src/config/site.ts). */
export function diasDisponiveis(hoje = new Date()): DiaDisponivel[] {
  const dias: DiaDisponivel[] = [];
  for (let i = 1; i <= AGENDAMENTO.diasAFrente; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    if ((AGENDAMENTO.diasSemanaIndisponiveis as readonly number[]).includes(d.getDay())) continue;
    const valor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dias.push({
      valor,
      semana: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      dia: String(d.getDate()),
      mes: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      extenso: d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
    });
  }
  return dias;
}

const ICONES_PERIODO = { manha: Sunrise, tarde: Sun, noite: Moon } as const;

function Passo({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="flex items-center gap-2.5 text-lg font-bold">
        <span className="grid size-7 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {numero}
        </span>
        {titulo}
      </legend>
      {children}
    </fieldset>
  );
}

interface Props {
  codigo: string;
  titulo: string;
  preco: number;
  bairro: string;
  foto: Foto | null;
  mensagemWhatsApp: string;
  className?: string;
  tamanho?: 'default' | 'lg';
  rotulo?: string;
}

export function AgendarVisita({
  codigo,
  titulo,
  preco,
  bairro,
  foto,
  mensagemWhatsApp,
  className,
  tamanho = 'lg',
  rotulo = 'Agendar visita',
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [data, setData] = useState<string>();
  const [periodo, setPeriodo] = useState<string>();
  const dias = useMemo(() => (aberto ? diasDisponiveis() : []), [aberto]);
  const diaEscolhido = dias.find((d) => d.valor === data);
  const periodoEscolhido = AGENDAMENTO.periodos.find((p) => p.valor === periodo);

  return (
    <Dialog
      open={aberto}
      onOpenChange={(a) => {
        setAberto(a);
        if (a) rastrear('agendar_visita_aberto', { codigo });
      }}
    >
      <DialogTrigger asChild>
        <Button size={tamanho} className={className}>
          <CalendarDays className="size-5" aria-hidden /> {rotulo}
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          // Celular: painel que sobe de baixo, largura total. Desktop: janela centralizada.
          'top-auto bottom-0 left-0 flex max-h-[94dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-t-3xl rounded-b-none p-0',
          'sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[90dvh] sm:w-[calc(100%-2rem)] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl',
        )}
      >
        {/* Cabeçalho fixo */}
        <div className="border-b px-5 pt-3 pb-4 sm:px-6 sm:pt-6">
          <div
            className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted-foreground/30 sm:hidden"
            aria-hidden
          />
          <DialogTitle className="pr-10 text-2xl font-extrabold">Agendar visita</DialogTitle>
          <DialogDescription className="mt-1 text-base text-muted-foreground">
            Sem compromisso. Escolha o melhor dia e confirmamos pelo WhatsApp.
          </DialogDescription>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-muted/70 p-2.5">
            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
              {foto && (
                <Image
                  src={caminhoPublico(foto.arquivo)}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="min-w-0 text-sm">
              <p className="truncate font-bold text-foreground">{titulo}</p>
              <p className="truncate text-muted-foreground">
                {bairro} · Cód. {codigo}
              </p>
              <p className="font-semibold text-primary">{formatarPreco(preco)}</p>
            </div>
          </div>
        </div>

        {/* Conteúdo com rolagem */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <FormularioLead
            origem="agendamento_visita"
            codigoImovel={codigo}
            mensagemWhatsApp={mensagemWhatsApp}
            textoBotao="Pedir agendamento"
            tituloCampos={
              <span className="flex items-center gap-2.5">
                <span className="grid size-7 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  3
                </span>
                Seus dados
              </span>
            }
            className="space-y-5"
            dadosAdicionais={{ dataVisitaPreferida: data, periodoPreferido: periodo }}
            antesDosCampos={
              <>
                <Passo numero={1} titulo="Escolha o dia">
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {dias.map((d) => {
                      const ativo = data === d.valor;
                      return (
                        <label
                          key={d.valor}
                          className={cn(
                            'relative flex min-h-[4.75rem] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 bg-background px-1 py-2 text-center transition-colors hover:border-primary/60 has-focus-visible:ring-3 has-focus-visible:ring-ring',
                            ativo &&
                              'border-primary bg-primary text-primary-foreground hover:border-primary',
                          )}
                        >
                          <input
                            type="radio"
                            name="data-visita"
                            value={d.valor}
                            required
                            className="sr-only"
                            checked={ativo}
                            onChange={() => setData(d.valor)}
                            aria-label={d.extenso}
                          />
                          <span
                            className={cn(
                              'text-xs font-semibold uppercase',
                              !ativo && 'text-muted-foreground',
                            )}
                          >
                            {d.semana}
                          </span>
                          <span className="font-heading text-2xl leading-tight font-extrabold">
                            {d.dia}
                          </span>
                          <span className={cn('text-xs', !ativo && 'text-muted-foreground')}>
                            {d.mes}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </Passo>

                <Passo numero={2} titulo="Escolha o período">
                  <div className="grid grid-cols-3 gap-2">
                    {AGENDAMENTO.periodos.map((p) => {
                      const Icone = ICONES_PERIODO[p.valor];
                      const ativo = periodo === p.valor;
                      return (
                        <label
                          key={p.valor}
                          className={cn(
                            'flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-background px-1 py-3 text-center transition-colors hover:border-primary/60 has-focus-visible:ring-3 has-focus-visible:ring-ring',
                            ativo &&
                              'border-primary bg-primary text-primary-foreground hover:border-primary',
                          )}
                        >
                          <input
                            type="radio"
                            name="periodo-visita"
                            value={p.valor}
                            required
                            className="sr-only"
                            checked={ativo}
                            onChange={() => setPeriodo(p.valor)}
                            aria-label={`${p.rotulo}, ${p.horario}`}
                          />
                          <Icone
                            className={cn('size-6', !ativo && 'text-destaque-texto')}
                            aria-hidden
                          />
                          <span className="font-bold">{p.rotulo}</span>
                          <span
                            className={cn('text-xs sm:text-sm', !ativo && 'text-muted-foreground')}
                          >
                            {p.horario}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </Passo>
              </>
            }
            antesDoBotao={
              <div
                className={cn(
                  'flex items-center gap-3 rounded-2xl p-3.5 text-[0.95rem]',
                  diaEscolhido && periodoEscolhido
                    ? 'bg-sucesso-suave text-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
                aria-live="polite"
              >
                {diaEscolhido && periodoEscolhido ? (
                  <>
                    <CalendarCheck className="size-6 shrink-0 text-sucesso" aria-hidden />
                    <span>
                      Visita em{' '}
                      <strong className="first-letter:uppercase">{diaEscolhido.extenso}</strong>, de{' '}
                      <strong>{periodoEscolhido.rotulo.toLowerCase()}</strong> (
                      {periodoEscolhido.horario}).
                    </span>
                  </>
                ) : (
                  <>
                    <Check className="size-6 shrink-0" aria-hidden />
                    <span>Escolha o dia e o período acima para pedir o agendamento.</span>
                  </>
                )}
              </div>
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
