import { FileDown } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MENSAGENS_WHATSAPP } from '@/config/site';
import { BotaoWhatsApp } from '@/components/comum/BotaoWhatsApp';
import { Trilha } from '@/components/comum/Trilha';
import {
  ARQUIVO_PDF_CHECKLIST,
  ChecklistDocumentos,
} from '@/components/conteudo/ChecklistDocumentos';
import { Jornada } from '@/components/conteudo/Jornada';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Como comprar seu imóvel: passo a passo e documentos',
  description:
    'Da simulação às chaves: entenda cada etapa da compra do primeiro imóvel com financiamento e veja a lista de documentos.',
  alternates: { canonical: '/como-comprar' },
};

export default function PaginaComoComprar() {
  return (
    <div className="container-site py-6 lg:py-8">
      <Trilha itens={[{ nome: 'Como comprar', href: '/como-comprar' }]} />
      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Da simulação às chaves</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
        Comprar o primeiro imóvel tem 5 etapas. Veja o que acontece em cada uma e o que você precisa
        separar.
      </p>
      <section aria-labelledby="titulo-etapas" className="mt-8">
        <h2 id="titulo-etapas" className="sr-only">
          Etapas
        </h2>
        <Jornada detalhada />
      </section>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row" data-nao-imprimir>
        <Button asChild size="lg" variant="destaque">
          <Link href="/simulador">Começar pela simulação</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href={ARQUIVO_PDF_CHECKLIST} download="checklist-compra-contemplar.pdf">
            <FileDown className="size-5" aria-hidden /> Baixar checklist em PDF
          </a>
        </Button>
        <BotaoWhatsApp
          mensagem={MENSAGENS_WHATSAPP.geral}
          local="como_comprar"
          rotulo="Tirar dúvidas no WhatsApp"
          size="lg"
        />
      </div>
      <section aria-labelledby="titulo-documentos" className="mt-14">
        <h2 id="titulo-documentos" className="mb-4 text-2xl font-extrabold">
          Checklist de documentos
        </h2>
        <ChecklistDocumentos />
      </section>
    </div>
  );
}
