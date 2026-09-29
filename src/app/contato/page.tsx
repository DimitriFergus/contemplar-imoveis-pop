import { Clock, Mail, MessageCircle } from 'lucide-react';
import type { Metadata } from 'next';
import { CONTATO, EMPRESA, MENSAGENS_WHATSAPP, estaDefinido } from '@/config/site';
import { BotaoWhatsApp } from '@/components/comum/BotaoWhatsApp';
import { Trilha } from '@/components/comum/Trilha';
import { FormularioLead } from '@/components/leads/FormularioLead';

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com a Contemplar Imóveis Pop pelo WhatsApp ou deixe sua mensagem.',
  alternates: { canonical: '/contato' },
};

export default function PaginaContato() {
  return (
    <div className="container-site py-6 lg:py-8">
      <Trilha itens={[{ nome: 'Contato', href: '/contato' }]} />
      <div className="mt-3 grid gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Fale com a gente</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            O jeito mais rápido é pelo WhatsApp. Se preferir, deixe sua mensagem que retornamos.
          </p>
          <BotaoWhatsApp
            mensagem={MENSAGENS_WHATSAPP.geral}
            local="contato"
            size="lg"
            className="mt-6"
          />
          <ul className="mt-8 space-y-4">
            <li className="flex items-center gap-3">
              <MessageCircle className="size-5 text-primary" aria-hidden /> WhatsApp:{' '}
              {estaDefinido(CONTATO.telefoneExibicao) ? CONTATO.telefoneExibicao : 'a definir'}
            </li>
            <li className="flex items-center gap-3">
              <Mail className="size-5 text-primary" aria-hidden /> E-mail:{' '}
              {estaDefinido(CONTATO.email) ? CONTATO.email : 'a definir'}
            </li>
            <li className="flex items-center gap-3">
              <Clock className="size-5 text-primary" aria-hidden /> {EMPRESA.horarioAtendimento}
            </li>
          </ul>
        </div>
        <section
          aria-labelledby="titulo-form-contato"
          className="rounded-2xl border bg-card p-5 sm:p-6"
        >
          <h2 id="titulo-form-contato" className="mb-4 text-xl font-bold">
            Envie sua mensagem
          </h2>
          <FormularioLead
            origem="formulario_contato"
            mensagemWhatsApp={MENSAGENS_WHATSAPP.geral}
            textoBotao="Enviar mensagem"
            pedirEmail
            pedirRenda
            mensagem={{ rotulo: 'Como podemos ajudar?', obrigatoria: true }}
          />
        </section>
      </div>
    </div>
  );
}
