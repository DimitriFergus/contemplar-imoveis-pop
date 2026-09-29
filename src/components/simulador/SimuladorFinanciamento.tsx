'use client';

import { useMemo, useState } from 'react';
import {
  FAIXAS,
  PADROES_SIMULADOR,
  type SistemaAmortizacao,
  type TipoTaxa,
} from '@/config/financiamento';
import { AvisoSimulacao } from '@/components/comum/AvisoSimulacao';
import { Termo } from '@/components/comum/Termo';
import { Input } from '@/components/ui/input';
import { rastrear } from '@/lib/analytics';
import { faixaReferenciaAnuncio, simularFinanciamento } from '@/lib/financiamento';
import { formatarBRL, formatarPercentual } from '@/lib/utils/formatar';
import { Alternancia, CampoMoeda, CampoSelect, LinhaResultado } from './Campos';
import { GraficoEvolucao } from './GraficoEvolucao';

export function SimuladorFinanciamento({ valorInicial }: { valorInicial: number }) {
  const faixaInicial = faixaReferenciaAnuncio(valorInicial);
  const [valor, setValor] = useState(valorInicial);
  const [entrada, setEntrada] = useState(
    Math.round((valorInicial * PADROES_SIMULADOR.percentualEntrada) / 1000) * 1000,
  );
  const [fgts, setFgts] = useState(0);
  const [taxaTexto, setTaxaTexto] = useState(
    (faixaInicial.taxaAnualMaxima * 100).toFixed(2).replace('.', ','),
  );
  const [tipoTaxa, setTipoTaxa] = useState<TipoTaxa>(faixaInicial.tipoTaxa);
  const [prazo, setPrazo] = useState(PADROES_SIMULADOR.prazoMeses);
  const [sistema, setSistema] = useState<SistemaAmortizacao>(PADROES_SIMULADOR.sistema);
  const [usou, setUsou] = useState(false);

  const taxa = Math.max(0, Math.min(30, Number(taxaTexto.replace(',', '.')) || 0)) / 100;
  const r = useMemo(
    () =>
      simularFinanciamento({
        valorImovel: valor,
        entrada,
        fgts,
        taxaAnual: taxa,
        tipoTaxa,
        prazoMeses: prazo,
        sistema,
      }),
    [valor, entrada, fgts, taxa, tipoTaxa, prazo, sistema],
  );

  return (
    <div
      className="space-y-8"
      onChangeCapture={() => {
        if (!usou) {
          setUsou(true);
          rastrear('uso_simulador', { local: 'simulador' });
        }
      }}
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <CampoMoeda rotulo="Valor do imóvel" valor={valor} aoMudar={setValor} nome="valor" />
          <CampoMoeda
            rotulo="Entrada em dinheiro"
            valor={entrada}
            aoMudar={setEntrada}
            nome="entrada"
          />
          <CampoMoeda
            rotulo={
              <>
                Saldo de <Termo chave="fgts" /> que vai usar
              </>
            }
            valor={fgts}
            aoMudar={setFgts}
            nome="fgts"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="taxa-anual" className="mb-1 block font-semibold">
                Taxa de juros (% ao ano)
              </label>
              <Input
                id="taxa-anual"
                inputMode="decimal"
                value={taxaTexto}
                onChange={(e) => setTaxaTexto(e.target.value.replace(/[^\d,.]/g, ''))}
                className="text-lg font-semibold"
              />
            </div>
            <Alternancia<TipoTaxa>
              rotulo={<>Tipo de taxa</>}
              valor={tipoTaxa}
              aoMudar={setTipoTaxa}
              opcoes={[
                { valor: 'nominal', rotulo: 'Nominal' },
                { valor: 'efetiva', rotulo: 'Efetiva' },
              ]}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            <Termo chave="taxaNominal">Nominal</Termo> ou <Termo chave="taxaEfetiva">efetiva</Termo>
            ? Veja no contrato ou pergunte ao banco. Referências:{' '}
            {FAIXAS.map((f) => `${f.nome} ${formatarPercentual(f.taxaAnualMaxima)}`).join(' · ')}.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <CampoSelect
              rotulo="Prazo"
              valor={prazo}
              aoMudar={setPrazo}
              opcoes={PADROES_SIMULADOR.opcoesPrazoMeses.map((m) => ({
                valor: m,
                rotulo: `${m / 12} anos`,
              }))}
            />
            <Alternancia<SistemaAmortizacao>
              rotulo="Sistema"
              valor={sistema}
              aoMudar={setSistema}
              opcoes={[
                { valor: 'sac', rotulo: 'SAC' },
                { valor: 'price', rotulo: 'Price' },
              ]}
            />
          </div>
        </div>
        <div className="rounded-2xl bg-muted/60 p-5" aria-live="polite">
          <p className="text-muted-foreground">
            {sistema === 'sac' ? 'Primeira parcela' : 'Parcela (todas iguais)'}
          </p>
          <p
            className="numero-destaque text-4xl text-primary sm:text-5xl"
            data-testid="primeira-parcela"
          >
            {formatarBRL(r.primeiraParcela)}
          </p>
          <dl className="mt-3 divide-y">
            {sistema === 'sac' && (
              <LinhaResultado rotulo="Última parcela" valor={formatarBRL(r.ultimaParcela)} />
            )}
            <LinhaResultado rotulo="Valor do imóvel" valor={formatarBRL(valor)} />
            <LinhaResultado rotulo="Valor financiado" valor={formatarBRL(r.valores.financiado)} />
            <LinhaResultado rotulo="Total de juros" valor={formatarBRL(r.totalJuros)} />
            <LinhaResultado
              rotulo="Total pago ao banco"
              valor={formatarBRL(r.totalPago)}
              ajuda="Sem seguros e taxas"
            />
            <LinhaResultado
              rotulo={<Termo chave="seguros">Seguros e taxas (estimativa)</Termo>}
              valor={`+ ${formatarBRL(r.segurosEstimadosMensais)}/mês`}
            />
          </dl>
          {r.valores.limitadoPelaCota && (
            <p className="mt-3 rounded-lg bg-aviso-suave p-3 text-sm text-aviso" role="alert">
              O banco financia no máximo {formatarBRL(valor - r.valores.entradaMinimaNecessaria)}. A
              entrada mínima (dinheiro + FGTS) é de{' '}
              <strong>{formatarBRL(r.valores.entradaMinimaNecessaria)}</strong>.
            </p>
          )}
        </div>
      </div>

      {r.resumoAnual.length > 0 && (
        <>
          <GraficoEvolucao anos={r.resumoAnual} />
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-lg font-bold">Primeiros 12 meses</h3>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-right text-[0.95rem] tabular-nums">
                  <caption className="sr-only">Parcelas dos 12 primeiros meses</caption>
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className="p-2 text-left">
                        Mês
                      </th>
                      <th scope="col" className="p-2">
                        Parcela
                      </th>
                      <th scope="col" className="p-2">
                        Juros
                      </th>
                      <th scope="col" className="p-2">
                        Amortização
                      </th>
                      <th scope="col" className="p-2">
                        Saldo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.tabela.slice(0, 12).map((l) => (
                      <tr key={l.mes} className="border-t">
                        <th scope="row" className="p-2 text-left font-normal">
                          {l.mes}
                        </th>
                        <td className="p-2">{formatarBRL(l.parcela)}</td>
                        <td className="p-2">{formatarBRL(l.juros)}</td>
                        <td className="p-2">{formatarBRL(l.amortizacao)}</td>
                        <td className="p-2">{formatarBRL(l.saldoDevedor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-bold">Ano a ano</h3>
              <div className="max-h-[28rem] overflow-auto rounded-xl border">
                <table className="w-full text-right text-[0.95rem] tabular-nums">
                  <caption className="sr-only">Resumo anual do financiamento</caption>
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th scope="col" className="p-2 text-left">
                        Ano
                      </th>
                      <th scope="col" className="p-2">
                        Total pago
                      </th>
                      <th scope="col" className="p-2">
                        Juros
                      </th>
                      <th scope="col" className="p-2">
                        Saldo no fim
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.resumoAnual.map((a) => (
                      <tr key={a.ano} className="border-t">
                        <th scope="row" className="p-2 text-left font-normal">
                          {a.ano}
                        </th>
                        <td className="p-2">{formatarBRL(a.totalPago)}</td>
                        <td className="p-2">{formatarBRL(a.juros)}</td>
                        <td className="p-2">{formatarBRL(a.saldoFinal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
      <AvisoSimulacao />
    </div>
  );
}
