'use client';

import { useSearchParams } from 'next/navigation';
import { PADROES_SIMULADOR } from '@/config/financiamento';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CabeNoBolso } from './CabeNoBolso';
import { SimuladorFinanciamento } from './SimuladorFinanciamento';

export function ConteudoAbas({
  aba,
  valorInicial,
}: {
  aba: 'bolso' | 'financiamento';
  valorInicial: number;
}) {
  return (
    <Tabs defaultValue={aba} className="mt-6">
      <TabsList className="grid w-full grid-cols-2 sm:inline-grid sm:w-auto">
        <TabsTrigger value="bolso">Quanto posso pagar?</TabsTrigger>
        <TabsTrigger value="financiamento">Simular financiamento</TabsTrigger>
      </TabsList>
      <TabsContent value="bolso" className="mt-6">
        <CabeNoBolso />
      </TabsContent>
      <TabsContent value="financiamento" className="mt-6">
        <SimuladorFinanciamento key={valorInicial} valorInicial={valorInicial} />
      </TabsContent>
    </Tabs>
  );
}

/** Lê ?aba= e ?valor= da URL (ex.: vindo de um anúncio). */
export function AbasSimulador() {
  const params = useSearchParams();
  const aba = params.get('aba') === 'financiamento' ? 'financiamento' : 'bolso';
  const valor = Number(params.get('valor'));
  const valorInicial =
    Number.isFinite(valor) && valor > 0 && valor < 10_000_000
      ? Math.round(valor)
      : PADROES_SIMULADOR.valorImovelInicial;
  return <ConteudoAbas key={aba} aba={aba} valorInicial={valorInicial} />;
}
