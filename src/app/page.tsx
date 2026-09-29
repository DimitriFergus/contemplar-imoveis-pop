import {
  ArrowRight,
  Building2,
  CalendarClock,
  Hammer,
  Home,
  PiggyBank,
  Tag,
  Wallet,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { FAIXAS } from '@/config/financiamento';
import {
  ATALHO_PRECO_MAXIMO,
  CIDADE_BASE,
  EMPRESA,
  MENSAGENS_WHATSAPP,
  SITE,
  estaDefinido,
} from '@/config/site';
import { BuscaHero } from '@/components/busca/BuscaHero';
import { BotaoWhatsApp } from '@/components/comum/BotaoWhatsApp';
import { JsonLd } from '@/components/comum/JsonLd';
import { Secao } from '@/components/comum/Secao';
import { Termo } from '@/components/comum/Termo';
import { Depoimentos } from '@/components/conteudo/Depoimentos';
import { Faq } from '@/components/conteudo/Faq';
import { Jornada } from '@/components/conteudo/Jornada';
import { CardImovel } from '@/components/imoveis/CardImovel';
import { NotaPremissas } from '@/components/imoveis/NotaPremissas';
import { Button } from '@/components/ui/button';
import { FAQ_HOME } from '@/content/faq';
import { paraQueryString } from '@/lib/busca/filtros';
import { repositorio } from '@/lib/repositorio';
import { formatarPreco, formatarPrecoCurto } from '@/lib/utils/formatar';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const ATALHOS = [
  { rotulo: 'Casas', href: '/imoveis/casas', icone: Home },
  { rotulo: 'Apartamentos', href: '/imoveis/apartamentos', icone: Building2 },
  {
    rotulo: 'Pronto para morar',
    href: `/imoveis${paraQueryString({ situacao: ['pronto'] })}`,
    icone: CalendarClock,
  },
  {
    rotulo: 'Na planta',
    href: `/imoveis${paraQueryString({ situacao: ['na_planta'] })}`,
    icone: Hammer,
  },
  {
    rotulo: 'Aceita FGTS',
    href: `/imoveis${paraQueryString({ condicoes: ['aceitaFGTS'] })}`,
    icone: Wallet,
  },
  {
    rotulo: `Até ${formatarPrecoCurto(ATALHO_PRECO_MAXIMO)}`,
    href: `/imoveis${paraQueryString({ precoMax: ATALHO_PRECO_MAXIMO })}`,
    icone: Tag,
  },
];

export default async function PaginaInicial() {
  const [destaques, bairros] = await Promise.all([repositorio.destaques(8), repositorio.bairros()]);
  const faixasMcmv = FAIXAS.filter((f) => f.programa === 'MCMV');

  return (
    <>
      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@type': 'RealEstateAgent',
          name: estaDefinido(EMPRESA.nomeEmpresarial) ? EMPRESA.nomeEmpresarial : SITE.nome,
          url: SITE.url,
          description: SITE.descricao,
          areaServed: CIDADE_BASE,
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-marinho text-white">
        <div
          aria-hidden
          className="absolute -top-24 -right-24 size-96 rounded-full bg-destaque/25 blur-3xl"
        />
        <div className="container-site relative py-10 sm:py-16">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
            <Home className="size-4" aria-hidden /> Imóveis a partir de{' '}
            {formatarPrecoCurto(SITE.precoAPartirDe)} em {CIDADE_BASE}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-extrabold sm:text-5xl">
            Seu primeiro imóvel, com uma parcela que{' '}
            <span className="text-destaque">cabe no seu bolso</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">
            Casas e apartamentos com Minha Casa, Minha Vida, uso do FGTS e entrada facilitada.
            Busque pelo preço ou pela parcela mensal.
          </p>
          <div className="mt-8 max-w-4xl">
            <BuscaHero bairros={bairros} />
          </div>
          <Link
            href="/simulador"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl text-lg font-bold text-destaque underline-offset-4 hover:underline"
          >
            <PiggyBank className="size-6" aria-hidden /> Descubra quanto você pode pagar em 1 minuto
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Atalhos */}
      <nav aria-label="Atalhos de busca" className="container-site -mt-1 pt-8">
        <ul className="rolagem-horizontal -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-6 md:px-0">
          {ATALHOS.map(({ rotulo, href, icone: Icone }) => (
            <li key={rotulo} className="shrink-0">
              <Link
                href={href}
                className="flex min-h-24 min-w-32 flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-3 text-center font-semibold shadow-card hover:border-primary hover:text-primary"
                data-sem-sublinhado
              >
                <Icone className="size-7 text-destaque-texto" aria-hidden />
                {rotulo}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Destaques */}
      <Secao
        id="destaques"
        titulo="Imóveis em destaque"
        subtitulo="Selecionados para quem está comprando o primeiro imóvel."
        acao={
          <Button asChild variant="outline">
            <Link href="/imoveis">
              Ver todos <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        }
      >
        <Suspense>
          <ul
            className="rolagem-horizontal -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0"
            aria-label="Lista de imóveis em destaque (role para o lado)"
          >
            {destaques.map((i, idx) => (
              <li key={i.id} className="w-[85%] max-w-sm shrink-0 sm:w-80">
                <CardImovel imovel={i} prioridade={idx === 0} />
              </li>
            ))}
          </ul>
        </Suspense>
        <NotaPremissas className="mt-4" />
      </Secao>

      {/* Jornada */}
      <div className="bg-muted/60">
        <Secao
          id="jornada"
          titulo="Da simulação às chaves"
          subtitulo="Você não precisa entender de financiamento. A gente acompanha cada passo."
          acao={
            <Button asChild variant="outline">
              <Link href="/como-comprar">Ver passo a passo completo</Link>
            </Button>
          }
        >
          <Jornada />
        </Secao>
      </div>

      {/* MCMV */}
      <Secao
        id="mcmv"
        titulo={<>Minha Casa, Minha Vida: veja se você se encaixa</>}
        subtitulo={
          <>
            A faixa depende da renda bruta da família. Quanto menor a renda, menores os juros, e
            pode haver <Termo chave="subsidio">subsídio</Termo>.
          </>
        }
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {faixasMcmv.map((f) => (
            <li key={f.id} className="rounded-2xl border bg-card p-5">
              <p className="text-sm font-bold tracking-wide text-destaque-texto uppercase">
                {f.nome}
              </p>
              <p className="mt-2 text-xl font-bold">
                {f.rendaMinima > 0 ? `${formatarPreco(f.rendaMinima)} a ` : 'Até '}
                {formatarPreco(f.rendaMaxima ?? 0)}
              </p>
              <p className="text-sm text-muted-foreground">de renda familiar por mês</p>
              <p className="mt-3 text-[0.95rem]">
                {f.podeTerSubsidio ? 'Pode ter subsídio do governo' : 'Juros menores que o mercado'}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/minha-casa-minha-vida">Entender o Minha Casa, Minha Vida</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/simulador">Simular minha faixa</Link>
          </Button>
        </div>
      </Secao>

      {/* Depoimentos */}
      <div className="bg-muted/60">
        <Secao id="depoimentos" titulo="Quem já passou por aqui">
          <Depoimentos />
        </Secao>
      </div>

      {/* FAQ */}
      <Secao
        id="faq"
        titulo="Perguntas frequentes"
        subtitulo="Respostas diretas para as dúvidas mais comuns de quem vai comprar o primeiro imóvel."
      >
        <Suspense>
          <Faq perguntas={FAQ_HOME} />
        </Suspense>
      </Secao>

      {/* CTA final */}
      <section aria-labelledby="titulo-vender" className="container-site pb-4">
        <div className="flex flex-col items-start gap-5 rounded-3xl bg-destaque p-8 text-destaque-foreground sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 id="titulo-vender" className="text-2xl font-extrabold sm:text-3xl">
              Quer vender seu imóvel?
            </h2>
            <p className="mt-2 max-w-xl text-lg">
              Anuncie com a Contemplar e fale com compradores que já sabem quanto podem pagar.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/anuncie">Anunciar meu imóvel</Link>
            </Button>
            <BotaoWhatsApp mensagem={MENSAGENS_WHATSAPP.anuncie} local="home_vender" size="lg" />
          </div>
        </div>
      </section>
    </>
  );
}
