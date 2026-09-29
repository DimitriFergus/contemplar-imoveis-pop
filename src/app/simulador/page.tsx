import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AbasSimulador, ConteudoAbas } from '@/components/simulador/AbasSimulador';
import { Trilha } from '@/components/comum/Trilha';
import { PADROES_SIMULADOR, REFERENCIA_FINANCIAMENTO } from '@/config/financiamento';

export const metadata: Metadata = {
  title: 'Simulador de financiamento e Cabe no Meu Bolso',
  description:
    'Descubra quanto você pode pagar pelo seu imóvel, sua faixa provável do Minha Casa, Minha Vida e simule parcelas pelo SAC e pela Price.',
  alternates: { canonical: '/simulador' },
};

export default function PaginaSimulador() {
  return (
    <div className="container-site py-6 lg:py-8">
      <Trilha itens={[{ nome: 'Simulador', href: '/simulador' }]} />
      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Simulador</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
        Em 1 minuto, descubra quanto você pode pagar e veja como fica a parcela. Sem cadastro.
      </p>
      <Suspense
        fallback={<ConteudoAbas aba="bolso" valorInicial={PADROES_SIMULADOR.valorImovelInicial} />}
      >
        <AbasSimulador />
      </Suspense>
      <p className="mt-8 text-sm text-muted-foreground">
        Parâmetros de referência de {REFERENCIA_FINANCIAMENTO.dataReferencia}. Fonte:{' '}
        {REFERENCIA_FINANCIAMENTO.fonte}. {REFERENCIA_FINANCIAMENTO.observacao}
      </p>
    </div>
  );
}
