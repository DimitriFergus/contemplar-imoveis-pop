import { BadgeCheck, Camera, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { MENSAGENS_WHATSAPP } from '@/config/site';
import { BotaoWhatsApp } from '@/components/comum/BotaoWhatsApp';
import { Trilha } from '@/components/comum/Trilha';
import { FormularioLead } from '@/components/leads/FormularioLead';
import { ROTULO_TIPO } from '@/lib/rotulos';
import { TIPOS_IMOVEL } from '@/lib/constantes';

export const metadata: Metadata = {
  title: 'Anuncie seu imóvel',
  description:
    'Quer vender sua casa ou apartamento? Anuncie com a Contemplar Imóveis Pop e alcance compradores que já sabem quanto podem pagar.',
  alternates: { canonical: '/anuncie' },
};

const VANTAGENS = [
  {
    icone: Users,
    titulo: 'Compradores preparados',
    texto: 'Nosso público usa o simulador e chega sabendo quanto pode pagar.',
  },
  {
    icone: Camera,
    titulo: 'Anúncio caprichado',
    texto: 'Orientamos as fotos e a descrição para destacar o seu imóvel.',
  },
  {
    icone: BadgeCheck,
    titulo: 'Acompanhamento até o fim',
    texto: 'Cuidamos das visitas, da documentação e do financiamento do comprador.',
  },
];

export default function PaginaAnuncie() {
  return (
    <div className="container-site py-6 lg:py-8">
      <Trilha itens={[{ nome: 'Anuncie seu imóvel', href: '/anuncie' }]} />
      <div className="mt-3 grid gap-10 lg:grid-cols-[1fr_28rem]">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Quer vender seu imóvel?</h1>
          <p className="mt-2 max-w-xl text-lg text-muted-foreground">
            Conte um pouco sobre o imóvel e um corretor entra em contato para combinar a avaliação e
            o anúncio.
          </p>
          <ul className="mt-8 space-y-5">
            {VANTAGENS.map(({ icone: Icone, titulo, texto }) => (
              <li key={titulo} className="flex gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-destaque-suave text-destaque-foreground">
                  <Icone className="size-6" aria-hidden />
                </span>
                <div>
                  <h2 className="text-lg font-bold">{titulo}</h2>
                  <p className="text-muted-foreground">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
          <BotaoWhatsApp
            mensagem={MENSAGENS_WHATSAPP.anuncie}
            local="anuncie"
            rotulo="Prefiro falar pelo WhatsApp"
            size="lg"
            className="mt-8"
          />
        </div>
        <section
          aria-labelledby="titulo-form-anuncie"
          className="rounded-2xl border bg-card p-5 sm:p-6"
        >
          <h2 id="titulo-form-anuncie" className="mb-4 text-xl font-bold">
            Dados do imóvel
          </h2>
          <FormularioLead
            origem="anuncie"
            mensagemWhatsApp={MENSAGENS_WHATSAPP.anuncie}
            textoBotao="Quero anunciar"
            pedirEmail
            camposExtras={[
              {
                nome: 'tipoImovel',
                rotulo: 'Tipo de imóvel',
                tipo: 'select',
                opcoes: TIPOS_IMOVEL.map((t) => ROTULO_TIPO[t]),
                obrigatorio: true,
              },
              {
                nome: 'bairro',
                rotulo: 'Bairro',
                tipo: 'texto',
                obrigatorio: true,
                placeholder: 'Ex.: Jardim Exemplo',
              },
              {
                nome: 'valorPretendido',
                rotulo: 'Valor pretendido',
                tipo: 'texto',
                placeholder: 'Ex.: R$ 220.000',
              },
            ]}
            mensagem={{
              rotulo: 'Conte mais sobre o imóvel',
              placeholder: 'Quartos, área, se está quitado, se aceita financiamento...',
            }}
          />
          <p className="mt-3 text-sm text-muted-foreground">
            Em breve: envio de fotos direto por aqui.
          </p>
        </section>
      </div>
    </div>
  );
}
