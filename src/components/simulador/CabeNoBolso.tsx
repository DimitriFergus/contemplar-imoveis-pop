'use client';

import { PiggyBank, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import {
  COMPROMETIMENTO_MAXIMO_RENDA,
  PADROES_SIMULADOR,
  type SistemaAmortizacao,
} from '@/config/financiamento';
import { MENSAGENS_WHATSAPP } from '@/config/site';
import { AvisoSimulacao } from '@/components/comum/AvisoSimulacao';
import { Termo } from '@/components/comum/Termo';
import { FormularioLead } from '@/components/leads/FormularioLead';
import { Button } from '@/components/ui/button';
import { rastrear } from '@/lib/analytics';
import { useArmazenado, useMontado } from '@/lib/cliente/armazenamento';
import { perfilBolso, type PerfilBolso } from '@/lib/cliente/estado';
import { paraQueryString } from '@/lib/busca/query';
import { calcularCabeNoBolso, obterFaixa } from '@/lib/financiamento';
import { formatarBRL, formatarPercentual, formatarPreco } from '@/lib/utils/formatar';
import { Alternancia, CampoMoeda, CampoSelect, LinhaResultado } from './Campos';

type Entrada = PerfilBolso['entrada'];

const INICIAL: Entrada = {
  rendaFamiliar: 0,
  entrada: 0,
  fgts: 0,
  outrasDividasMensais: 0,
  parcelaDesejada: undefined,
  prazoMeses: PADROES_SIMULADOR.prazoMeses,
  sistema: PADROES_SIMULADOR.sistema,
};

export function CabeNoBolso() {
  const salvo = useArmazenado(perfilBolso);
  const montado = useMontado();
  const [dados, setDados] = useState<Entrada | null>(null);
  const [erro, setErro] = useState('');
  const atual = dados ?? (montado && salvo ? salvo.entrada : INICIAL);
  const alterar = <K extends keyof Entrada>(k: K, v: Entrada[K]) => setDados({ ...atual, [k]: v });

  const resultado = montado && salvo ? calcularCabeNoBolso(salvo.entrada) : null;

  const calcular = (e: FormEvent) => {
    e.preventDefault();
    if (!atual.rendaFamiliar) {
      setErro('Informe a renda familiar bruta por mês.');
      return;
    }
    setErro('');
    const r = calcularCabeNoBolso(atual);
    perfilBolso.gravar({
      entrada: atual,
      resultado: {
        poderDeCompra: r.poderDeCompra,
        parcelaConsiderada: r.parcelaConsiderada,
        faixa: r.faixa.id,
      },
      salvoEm: new Date().toISOString(),
    });
    rastrear('cabe_no_bolso_calculado', { faixa: r.faixa.id });
    requestAnimationFrame(() => document.getElementById('resultado-bolso')?.focus());
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form
        onSubmit={calcular}
        className="space-y-4"
        aria-label="Dados para calcular quanto você pode pagar"
      >
        <CampoMoeda
          rotulo="Renda familiar bruta por mês"
          valor={atual.rendaFamiliar}
          aoMudar={(v) => alterar('rendaFamiliar', v)}
          ajuda="Some a renda de todos que vão comprar juntos, antes dos descontos."
          nome="renda"
        />
        <CampoMoeda
          rotulo="Quanto você tem para a entrada"
          valor={atual.entrada}
          aoMudar={(v) => alterar('entrada', v)}
          nome="entrada"
        />
        <CampoMoeda
          rotulo={
            <>
              Saldo de <Termo chave="fgts" />
            </>
          }
          valor={atual.fgts}
          aoMudar={(v) => alterar('fgts', v)}
          ajuda="Confira no aplicativo FGTS."
          nome="fgts"
        />
        <CampoMoeda
          rotulo="Outras dívidas por mês"
          valor={atual.outrasDividasMensais}
          aoMudar={(v) => alterar('outrasDividasMensais', v)}
          ajuda="Empréstimos, financiamento de carro, etc. Deixe em branco se não tiver."
          nome="dividas"
        />
        <CampoMoeda
          rotulo="Parcela que fica confortável para você"
          valor={atual.parcelaDesejada ?? 0}
          aoMudar={(v) => alterar('parcelaDesejada', v || undefined)}
          ajuda="Opcional. Se não souber, deixe em branco."
          nome="parcelaDesejada"
        />
        <div className="grid grid-cols-2 gap-3">
          <CampoSelect
            rotulo="Prazo"
            valor={atual.prazoMeses}
            aoMudar={(v) => alterar('prazoMeses', v)}
            opcoes={PADROES_SIMULADOR.opcoesPrazoMeses.map((m) => ({
              valor: m,
              rotulo: `${m / 12} anos`,
            }))}
          />
          <Alternancia<SistemaAmortizacao>
            rotulo="Sistema"
            valor={atual.sistema}
            aoMudar={(v) => alterar('sistema', v)}
            opcoes={[
              { valor: 'sac', rotulo: 'SAC' },
              { valor: 'price', rotulo: 'Price' },
            ]}
          />
        </div>
        {erro && (
          <p role="alert" className="font-semibold text-destructive">
            {erro}
          </p>
        )}
        <Button type="submit" size="lg" variant="destaque" className="w-full">
          <PiggyBank className="size-5" aria-hidden /> Calcular quanto posso pagar
        </Button>
        <p className="text-sm text-muted-foreground">
          Seus dados ficam só neste aparelho (não são enviados para ninguém) e você pode apagar
          quando quiser.
        </p>
      </form>

      <div
        id="resultado-bolso"
        tabIndex={-1}
        className="rounded-2xl bg-muted/60 p-5 outline-none"
        aria-live="polite"
      >
        {!resultado || !salvo ? (
          <div className="grid h-full place-items-center py-10 text-center text-muted-foreground">
            <div>
              <PiggyBank className="mx-auto size-12 text-destaque-texto" aria-hidden />
              <p className="mt-3 text-lg">
                Preencha ao lado e toque em calcular para ver seu poder de compra estimado.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4" data-testid="resultado-cabe-no-bolso">
            <div>
              <p className="text-muted-foreground">
                <Termo chave="poderCompra">Poder de compra estimado</Termo>
              </p>
              <p className="numero-destaque text-4xl text-sucesso sm:text-5xl">
                {formatarPreco(resultado.poderDeCompra)}
              </p>
            </div>
            <dl className="divide-y">
              <LinhaResultado
                rotulo="Faixa provável"
                valor={obterFaixa(resultado.faixa.id).nome}
                ajuda={resultado.faixa.descricaoSimples}
              />
              <LinhaResultado
                rotulo="Parcela máxima pela renda"
                valor={`${formatarBRL(resultado.parcelaMaximaPelaRenda)}/mês`}
                ajuda={`${formatarPercentual(COMPROMETIMENTO_MAXIMO_RENDA)} da renda, menos outras dívidas`}
              />
              <LinhaResultado
                rotulo="Parcela usada no cálculo"
                valor={`${formatarBRL(resultado.parcelaConsiderada)}/mês`}
              />
              <LinhaResultado
                rotulo="Valor que o banco pode financiar"
                valor={formatarBRL(resultado.valorFinanciavel)}
                ajuda={`Taxa de referência ${formatarPercentual(resultado.taxaAnual)} a.a. ${resultado.faixa.tipoTaxa}`}
              />
              <LinhaResultado
                rotulo="Entrada + FGTS"
                valor={formatarBRL(salvo.entrada.entrada + salvo.entrada.fgts)}
              />
            </dl>
            {resultado.avisoSubsidio && (
              <p className="rounded-lg bg-sucesso-suave p-3 text-sucesso">
                {resultado.avisoSubsidio}
              </p>
            )}
            {resultado.acimaDoTetoDaFaixa && (
              <p className="rounded-lg bg-info-suave p-3 text-primary">
                O teto do imóvel na sua faixa é {formatarPreco(resultado.faixa.tetoImovel ?? 0)}.
                Imóveis acima disso podem ser financiados fora do MCMV (SBPE), com outra taxa.
              </p>
            )}
            <Button asChild size="lg" className="w-full">
              <Link
                href={`/imoveis${paraQueryString({ bolso: resultado.poderDeCompra, tipo: [], situacao: [], condicoes: [] })}`}
              >
                Ver imóveis que cabem no meu bolso
              </Link>
            </Button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground underline"
              onClick={() => {
                perfilBolso.apagar();
                setDados(INICIAL);
              }}
            >
              <Trash2 className="size-4" aria-hidden /> Apagar meus dados deste aparelho
            </button>
            <AvisoSimulacao />
            <details className="rounded-xl border bg-background p-4">
              <summary className="cursor-pointer font-bold">
                Quero ajuda de um corretor com esse resultado
              </summary>
              <FormularioLead
                className="mt-4"
                origem="cabe_no_bolso"
                mensagemWhatsApp={MENSAGENS_WHATSAPP.simulador}
                textoBotao="Quero ajuda"
                pedirRenda
                mensagem={{
                  rotulo: 'Mensagem',
                  valorInicial: `Fiz o Cabe no Meu Bolso: poder de compra estimado de ${formatarPreco(resultado.poderDeCompra)}.`,
                }}
              />
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
