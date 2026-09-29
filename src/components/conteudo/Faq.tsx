import { JsonLd } from '@/components/comum/JsonLd';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { PerguntaFrequente } from '@/content/faq';

export function Faq({ perguntas }: { perguntas: PerguntaFrequente[] }) {
  return (
    <>
      <Accordion type="single" collapsible className="divide-y rounded-2xl border bg-card px-5">
        {perguntas.map((p, i) => (
          <AccordionItem key={p.pergunta} value={`p${i}`} className="border-0">
            <AccordionTrigger className="text-lg">{p.pergunta}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{p.resposta}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: perguntas.map((p) => ({
            '@type': 'Question',
            name: p.pergunta,
            acceptedAnswer: { '@type': 'Answer', text: p.resposta },
          })),
        }}
      />
    </>
  );
}
