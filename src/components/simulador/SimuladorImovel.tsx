'use client';

import { Calculator, Receipt } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  AVISO_SUBSIDIO,
  COMPROMETIMENTO_MAXIMO_RENDA,
  FAIXAS,
  PADROES_SIMULADOR,
  type SistemaAmortizacao,
} from '@/config/financiamento';
import { AvisoSimulacao } from '@/components/comum/AvisoSimulacao';
import { Termo } from '@/components/comum/Termo';
import { rastrear } from '@/lib/analytics';
import {
  calcularCustoAquisicao,
  enquadrarImovel,
  faixaReferenciaAnuncio,
  simularFinanciamento,
} from '@/lib/financiamento';
import { formatarBRL, formatarPercentual, formatarPreco } from '@/lib/utils/formatar';
import { Alternancia, CampoMoeda, CampoSelect, LinhaResultado } from './Campos';

interface Props {
  preco: number;
  cidade: string;
  uf: string;
}

export function SimuladorImovel({ preco, cidade, uf }: Props) {
  const [entrada, setEntrada] = useState(
    Math.round((preco * PADROES_SIMULADOR.percentualEntrada) / 1000) * 1000,
  );
  const [fgts, setFgts] = useState(0);
  const [renda, setRenda] = useState(0);
  const [prazo, setPrazo] = useState(PADROES_SIMULADOR.prazoMeses);
  const [sistema, setSistema] = useState<SistemaAmortizacao>(PADROES_SIMULADOR.sistema);
  const [usou, setUsou] = useState(false);

  const calculo = useMemo(() => {
    const enquadramento = renda > 0 ? enquadrarImovel(preco, renda) : null;
    const sbpe = FAIXAS.find((f) => f.id === 'sbpe');
    const faixa = enquadramento
      ? enquadramento.dentroDoTeto
        ? enquadramento.faixa
        : (sbpe ?? enquadramento.faixa)
      : faixaReferenciaAnuncio(preco);
    const taxaAnual = PADROES_SIMULADOR.usarTaxaMaximaDaFaixa
      ? faixa.taxaAnualMaxima
      : faixa.taxaAnualMinima;
    const sim = simularFinanciamento({
      valorImovel: preco,
      entrada,
      fgts,
      taxaAnual,
      tipoTaxa: faixa.tipoTaxa,
      prazoMeses: prazo,
      sistema,
      cotaMaxima: faixa.cotaMaximaFinanciamento,
    });
    const custo = calcularCustoAquisicao({
      preco,
      entrada,
      fgts,
      cidade,
      uf,
      cotaMaxima: faixa.cotaMaximaFinanciamento,
    });
    return { enquadramento, faixa, taxaAnual, sim, custo };
  }, [preco, entrada, fgts, renda, prazo, sistema, cidade, uf]);

  const { enquadramento, faixa, taxaAnual, sim, custo } = calculo;
  const marcarUso = () => {
    if (!usou) {
      setUsou(true);
      rastrear('uso_simulador', { local: 'anuncio' });
    }
  };
  const rendaSugerida = sim.primeiraParcela / COMPROMETIMENTO_MAXIMO_RENDA;

  return (
    <div className="space-y-10" onChangeCapture={marcarUso}>
      <section aria-labelledby="titulo-simulador" className="rounded-2xl border bg-card p-5 sm:p-6">
        <h2 id="titulo-simulador" className="flex items-center gap-2 text-2xl font-bold">
          <Calculator className="size-6 text-primary" aria-hidden /> Simule a parcela deste imóvel
        </h2>
        <p className="mt-1 text-muted-foreground">
          Já preenchemos com o preço do imóvel. Ajuste os valores como quiser.
        </p>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <CampoMoeda
              rotulo="Entrada em dinheiro"
              valor={entrada}
              aoMudar={setEntrada}
              max={preco}
            />
            <CampoMoeda
              rotulo={
                <>
                  Saldo de <Termo chave="fgts" /> que vai usar
                </>
              }
              valor={fgts}
              aoMudar={setFgts}
              max={preco}
            />
            <CampoMoeda
              rotulo="Renda familiar bruta por mês"
              valor={renda}
              aoMudar={setRenda}
              ajuda="Opcional. Serve para indicar a faixa do Minha Casa, Minha Vida."
            />
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
              <Alternancia
                rotulo={<>Sistema</>}
                valor={sistema}
                aoMudar={setSistema}
                opcoes={[
                  { valor: 'sac', rotulo: 'SAC' },
                  { valor: 'price', rotulo: 'Price' },
                ]}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              <Termo chave="sac">SAC</Termo>: parcelas diminuem com o tempo.{' '}
              <Termo chave="price">Price</Termo>: parcelas iguais.
            </p>
          </div>
          <div className="rounded-xl bg-muted/60 p-4" aria-live="polite">
            <p className="text-sm text-muted-foreground">
              {sistema === 'sac' ? 'Primeira parcela estimada' : 'Parcela estimada'}
            </p>
            <p className="numero-destaque text-4xl text-primary" data-testid="parcela-simulada">
              {formatarBRL(sim.primeiraParcela)}
              <span className="font-sans text-lg font-semibold">/mês</span>
            </p>
            {sistema === 'sac' && sim.ultimaParcela > 0 && (
              <p className="text-muted-foreground">
                Última parcela: {formatarBRL(sim.ultimaParcela)}
              </p>
            )}
            <dl className="mt-3 divide-y">
              <LinhaResultado rotulo="Valor total do imóvel" valor={formatarPreco(preco)} />
              <LinhaResultado
                rotulo="Valor financiado"
                valor={formatarBRL(sim.valores.financiado)}
              />
              <LinhaResultado
                rotulo="Taxa de referência"
                valor={`${formatarPercentual(taxaAnual)} a.a.`}
                ajuda={`${faixa.nome} · taxa ${faixa.tipoTaxa}`}
              />
              <LinhaResultado
                rotulo={<Termo chave="seguros">Seguros e taxas (estimativa)</Termo>}
                valor={`+ ${formatarBRL(sim.segurosEstimadosMensais)}/mês`}
              />
              <LinhaResultado
                rotulo="Renda familiar sugerida"
                valor={`a partir de ${formatarPreco(rendaSugerida)}`}
                ajuda={`Parcela de até ${formatarPercentual(COMPROMETIMENTO_MAXIMO_RENDA)} da renda`}
              />
            </dl>
            {sim.valores.limitadoPelaCota && (
              <p className="mt-3 rounded-lg bg-aviso-suave p-3 text-sm text-aviso" role="alert">
                O banco financia até {formatarPercentual(faixa.cotaMaximaFinanciamento)} do valor. A
                entrada mínima (dinheiro + FGTS) para este imóvel é de{' '}
                <strong>{formatarBRL(sim.valores.entradaMinimaNecessaria)}</strong>.
              </p>
            )}
            {enquadramento?.aviso && (
              <p className="mt-3 rounded-lg bg-info-suave p-3 text-sm text-primary">
                {enquadramento.aviso}
              </p>
            )}
            {enquadramento?.dentroDoTeto && enquadramento.faixa.podeTerSubsidio && (
              <p className="mt-3 rounded-lg bg-sucesso-suave p-3 text-sm text-sucesso">
                {AVISO_SUBSIDIO}
              </p>
            )}
            <Link
              href={`/simulador?aba=financiamento&valor=${preco}`}
              className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary underline"
            >
              Ver simulação completa com tabela e gráfico
            </Link>
          </div>
        </div>
        <AvisoSimulacao className="mt-5" />
      </section>

      <section aria-labelledby="titulo-custo" className="rounded-2xl border bg-card p-5 sm:p-6">
        <h2 id="titulo-custo" className="flex items-center gap-2 text-2xl font-bold">
          <Receipt className="size-6 text-primary" aria-hidden /> Quanto custa comprar este imóvel
        </h2>
        <p className="mt-1 text-muted-foreground">
          Além da entrada, a compra tem impostos e taxas. Veja uma <strong>estimativa</strong> com
          os valores acima.
        </p>
        <dl className="mt-4 divide-y">
          <LinhaResultado rotulo="Preço do imóvel" valor={formatarPreco(custo.preco)} />
          <LinhaResultado rotulo="Entrada + FGTS" valor={formatarBRL(custo.recursosProprios)} />
          <LinhaResultado
            rotulo="Valor financiado pelo banco"
            valor={formatarBRL(custo.valorFinanciado)}
          />
          <LinhaResultado
            rotulo={
              <>
                <Termo chave="itbi">ITBI</Termo> estimado
              </>
            }
            valor={formatarBRL(custo.itbi)}
            ajuda={`${formatarPercentual(custo.regras.itbi.aliquota)} do valor${custo.regras.itbi.aliquotaParteFinanciadaSFH !== null ? `; ${formatarPercentual(custo.regras.itbi.aliquotaParteFinanciadaSFH)} sobre a parte financiada` : ''}`}
          />
          <LinhaResultado
            rotulo={
              <>
                <Termo chave="registro">Registro e cartório</Termo> estimados
              </>
            }
            valor={formatarBRL(custo.registroCartorio)}
            ajuda={`cerca de ${formatarPercentual(custo.regras.registroCartorioEstimado)} do valor`}
          />
          <LinhaResultado
            destaque
            rotulo="Total para desembolsar no início (estimativa)"
            valor={formatarBRL(custo.totalDesembolsoInicial)}
            ajuda="Entrada + FGTS + ITBI + cartório"
          />
        </dl>
        <p className="mt-3 text-sm text-muted-foreground">
          Estimativa. ITBI e custos de cartório variam por município e devem ser confirmados na
          prefeitura e no cartório. Fonte: {custo.regras.fonte} ({custo.regras.dataReferencia}).
        </p>
      </section>
    </div>
  );
}
