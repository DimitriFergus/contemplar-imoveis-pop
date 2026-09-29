import type { Metadata } from 'next';
import Link from 'next/link';
import { EMPRESA, SITE, estaDefinido } from '@/config/site';
import { Trilha } from '@/components/comum/Trilha';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Sobre nós',
  description: `${SITE.nome}: imóveis populares com atendimento próximo, do primeiro contato à entrega das chaves.`,
  alternates: { canonical: '/sobre' },
};

export default function PaginaSobre() {
  return (
    <div className="container-site max-w-3xl py-6 lg:py-8">
      <Trilha itens={[{ nome: 'Sobre nós', href: '/sobre' }]} />
      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Sobre a {SITE.nome}</h1>
      <div className="mt-6 space-y-4 text-lg leading-relaxed">
        <p>
          A {SITE.nome} é a marca da Contemplar Imóveis, empresa do {SITE.grupo}, dedicada a quem
          quer comprar o primeiro imóvel. Trabalhamos com casas e apartamentos populares, prontos,
          usados e na planta.
        </p>
        <p>
          Acreditamos que comprar um imóvel começa por uma pergunta simples:{' '}
          <strong>quanto fica a parcela?</strong> Por isso mostramos sempre a parcela estimada junto
          com o preço total, explicamos cada termo em linguagem simples e acompanhamos a família em
          cada etapa, da simulação às chaves.
        </p>
        <p>
          Não prometemos aprovação de crédito: quem decide é o banco. O nosso compromisso é orientar
          com transparência, organizar a documentação e defender os seus interesses durante a
          compra.
        </p>
        <p className="text-base text-muted-foreground">
          {estaDefinido(EMPRESA.nomeEmpresarial) ? EMPRESA.nomeEmpresarial : 'Contemplar Imóveis'} ·
          CNPJ {EMPRESA.cnpj} · {EMPRESA.creciPJ}
          <br />
          {EMPRESA.endereco}
        </p>
      </div>
      <Button asChild size="lg" className="mt-8">
        <Link href="/imoveis">Ver imóveis</Link>
      </Button>
    </div>
  );
}
