import type { Metadata } from 'next';
import { Trilha } from '@/components/comum/Trilha';
import { CabeNoBolso } from '@/components/simulador/CabeNoBolso';
import { SimuladorFinanciamento } from '@/components/simulador/SimuladorFinanciamento';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PADROES_SIMULADOR, REFERENCIA_FINANCIAMENTO } from '@/config/financiamento';

export const metadata: Metadata = {
  title: 'Simulador de financiamento e Cabe no Meu Bolso',
  description:
    'Descubra quanto você pode pagar pelo seu imóvel, sua faixa provável do Minha Casa, Minha Vida e simule parcelas pelo SAC e pela Price.',
  alternates: { canonical: '/simulador' },
};

export default async function PaginaSimulador({ searchParams }: PageProps<'/simulador'>) {
  const params = await searchParams;
  const aba = params.aba === 'financiamento' ? 'financiamento' : 'bolso';
  const valorParam = Number(Array.isArray(params.valor) ? params.valor[0] : params.valor);
  const valorInicial =
    Number.isFinite(valorParam) && valorParam > 0 && valorParam < 10_000_000
      ? Math.round(valorParam)
      : PADROES_SIMULADOR.valorImovelInicial;

  return (
    <div className="container-site py-6 lg:py-8">
      <Trilha itens={[{ nome: 'Simulador', href: '/simulador' }]} />
      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Simulador</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
        Em 1 minuto, descubra quanto você pode pagar e veja como fica a parcela. Sem cadastro.
      </p>
      <Tabs defaultValue={aba} className="mt-6">
        <TabsList className="grid w-full grid-cols-2 sm:inline-grid sm:w-auto">
          <TabsTrigger value="bolso">Quanto posso pagar?</TabsTrigger>
          <TabsTrigger value="financiamento">Simular financiamento</TabsTrigger>
        </TabsList>
        <TabsContent value="bolso" className="mt-6">
          <CabeNoBolso />
        </TabsContent>
        <TabsContent value="financiamento" className="mt-6">
          <SimuladorFinanciamento valorInicial={valorInicial} />
        </TabsContent>
      </Tabs>
      <p className="mt-8 text-sm text-muted-foreground">
        Parâmetros de referência de {REFERENCIA_FINANCIAMENTO.dataReferencia}. Fonte:{' '}
        {REFERENCIA_FINANCIAMENTO.fonte}. {REFERENCIA_FINANCIAMENTO.observacao}
      </p>
    </div>
  );
}
