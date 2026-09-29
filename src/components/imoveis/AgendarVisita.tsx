'use client';

import { CalendarDays } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AGENDAMENTO } from '@/config/site';
import { FormularioLead } from '@/components/leads/FormularioLead';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { rastrear } from '@/lib/analytics';
import { cn } from '@/lib/utils';

/** Próximos dias disponíveis para visita (configurável em src/config/site.ts). */
export function diasDisponiveis(
  hoje = new Date(),
): { valor: string; semana: string; dia: string }[] {
  const dias = [];
  for (let i = 1; i <= AGENDAMENTO.diasAFrente; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    if ((AGENDAMENTO.diasSemanaIndisponiveis as readonly number[]).includes(d.getDay())) continue;
    const valor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dias.push({
      valor,
      semana: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      dia: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    });
  }
  return dias;
}

interface Props {
  codigo: string;
  titulo: string;
  mensagemWhatsApp: string;
  className?: string;
  tamanho?: 'default' | 'lg';
  rotulo?: string;
}

export function AgendarVisita({
  codigo,
  titulo,
  mensagemWhatsApp,
  className,
  tamanho = 'lg',
  rotulo = 'Agendar visita',
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [data, setData] = useState<string>();
  const [periodo, setPeriodo] = useState<string>();
  const dias = useMemo(() => (aberto ? diasDisponiveis() : []), [aberto]);

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
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Agendar visita</DialogTitle>
          <DialogDescription>
            {titulo} · Cód. {codigo}. Escolha o melhor dia e período; confirmamos pelo WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <FormularioLead
          origem="agendamento_visita"
          codigoImovel={codigo}
          mensagemWhatsApp={mensagemWhatsApp}
          textoBotao="Pedir agendamento"
          dadosAdicionais={{ dataVisitaPreferida: data, periodoPreferido: periodo }}
          antesDosCampos={
            <>
              <fieldset>
                <legend className="mb-2 font-semibold">Dia preferido</legend>
                <div className="rolagem-horizontal -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {dias.map((d) => (
                    <label
                      key={d.valor}
                      className={cn(
                        'flex min-h-16 min-w-16 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border px-2 has-focus-visible:ring-3 has-focus-visible:ring-ring',
                        data === d.valor && 'border-primary bg-primary text-primary-foreground',
                      )}
                    >
                      <input
                        type="radio"
                        name="data-visita"
                        value={d.valor}
                        required
                        className="sr-only"
                        checked={data === d.valor}
                        onChange={() => setData(d.valor)}
                      />
                      <span className="text-sm capitalize">{d.semana}</span>
                      <span className="font-bold">{d.dia}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 font-semibold">Período</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {AGENDAMENTO.periodos.map((p) => (
                    <label
                      key={p.valor}
                      className={cn(
                        'flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-2 text-center text-[0.95rem] font-semibold has-focus-visible:ring-3 has-focus-visible:ring-ring',
                        periodo === p.valor && 'border-primary bg-primary text-primary-foreground',
                      )}
                    >
                      <input
                        type="radio"
                        name="periodo-visita"
                        value={p.valor}
                        required
                        className="sr-only"
                        checked={periodo === p.valor}
                        onChange={() => setPeriodo(p.valor)}
                      />
                      {p.rotulo}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          }
        />
      </DialogContent>
    </Dialog>
  );
}
