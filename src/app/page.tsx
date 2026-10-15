import {
  ArrowRight,
  Building2,
  CalendarClock,
  ChevronDown,
  Hammer,
  Home,
  PiggyBank,
  Tag,
  Wallet,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DestaquesAoVivo } from '@/components/imoveis/DestaquesAoVivo';
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
import { VideoFundoHero } from '@/components/layout/VideoFundoHero';
import { BotaoWhatsApp } from '@/components/comum/BotaoWhatsApp';
import { FaixasMcmv, type FaixaComImoveis } from '@/components/conteudo/FaixasMcmv';
import { condicoesNaFaixa, limiteImovelPorFaixa } from '@/lib/financiamento';
import { JsonLd } from '@/components/comum/JsonLd';
import { Secao } from '@/components/comum/Secao';
import { Termo } from '@/components/comum/Termo';
import { Depoimentos } from '@/components/conteudo/Depoimentos';
import { Faq } from '@/components/conteudo/Faq';
import { Jornada } from '@/components/conteudo/Jornada';
import { NotaPremissas } from '@/components/imoveis/NotaPremissas';
import { Button } from '@/components/ui/button';
import { FAQ_HOME } from '@/content/faq';
import { paraQueryString } from '@/lib/busca/filtros';
import { repositorio } from '@/lib/repositorio';
import { formatarPrecoCurto } from '@/lib/utils/formatar';

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
  const [destaques, bairros, resumos] = await Promise.all([
    repositorio.destaques(8),
    repositorio.bairros(),
    repositorio.listarResumos(),
  ]);
  // Para cada faixa do MCMV: até quanto a renda permite comprar e quais imóveis se encaixam.
  const faixasMcmv: FaixaComImoveis[] = FAIXAS.filter((f) => f.programa === 'MCMV').map((f) => {
    const limite = limiteImovelPorFaixa(f);
    return {
      id: f.id,
      nome: f.nome,
      rendaMinima: f.rendaMinima,
      rendaMaxima: f.rendaMaxima,
      podeTerSubsidio: f.podeTerSubsidio,
      limite,
      imoveis: resumos
        .filter(
          (i) =>
            i.status === 'disponivel' && i.condicoes.aceitaMCMV && i.preco <= limite.precoMaximo,
        )
        .sort((a, b) => a.preco - b.preco)
        .map((i) => ({
          id: i.id,
          slug: i.slug,
          codigo: i.codigo,
          titulo: i.titulo,
          tipo: i.tipo,
          bairro: i.bairro,
          preco: i.preco,
          foto: i.foto,
          ...condicoesNaFaixa(i.preco, f),
        })),
    };
  });

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
      {/* Quase tela cheia (a barra do topo só aparece ao rolar): sobra uma faixa do conteúdo
          abaixo para mostrar que a página continua. */}
      <section className="relative flex min-h-[88svh] items-center overflow-hidden bg-marinho text-white">
        <VideoFundoHero />
        <div
          aria-hidden
          className="absolute -top-24 -right-24 size-96 rounded-full bg-destaque/25 blur-3xl"
        />
        <a
          href="#atalhos"
          aria-label="Ver mais conteúdo"
          className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 rounded-full p-2 text-white/80 hover:text-white motion-safe:animate-bounce sm:block"
          data-sem-sublinhado
        >
          <ChevronDown className="size-8" aria-hidden />
        </a>
        <div className="container-site relative w-full py-8 sm:py-16">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold sm:text-sm">
            <Home className="size-4" aria-hidden /> Imóveis a partir de{' '}
            {formatarPrecoCurto(SITE.precoAPartirDe)} em {CIDADE_BASE}
          </p>
          <h1 className="mt-3 max-w-3xl text-[2rem] leading-tight font-extrabold sm:mt-4 sm:text-5xl">
            Seu primeiro imóvel, com uma parcela que{' '}
            <span className="text-destaque">cabe no seu bolso</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/85 sm:mt-4 sm:text-lg">
            Casas e apartamentos com Minha Casa, Minha Vida, uso do FGTS e entrada facilitada.
            <span className="hidden sm:inline"> Busque pelo preço ou pela parcela mensal.</span>
          </p>
          <div className="mt-6 max-w-4xl sm:mt-8">
            <BuscaHero bairros={bairros} />
          </div>
          <Link
            href="/simulador"
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl text-base font-bold text-destaque underline-offset-4 hover:underline sm:mt-5 sm:text-lg"
          >
            <PiggyBank className="size-6" aria-hidden /> Descubra quanto você pode pagar em 1 minuto
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Atalhos */}
      <nav
        id="atalhos"
        aria-label="Atalhos de busca"
        className="container-site -mt-1 scroll-mt-20 pt-8"
      >
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
          <DestaquesAoVivo iniciais={destaques} />
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
        <p className="-mt-2 mb-4 font-semibold text-primary">
          Toque na sua faixa para ver os imóveis que cabem na sua renda.
        </p>
        <Suspense>
          <FaixasMcmv faixas={faixasMcmv} />
        </Suspense>
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
