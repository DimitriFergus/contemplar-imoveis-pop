import { CalendarClock, Check, MapPin, UserRound } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { EMPRESA, LISTAGEM, estaDefinido } from '@/config/site';
import { JsonLd } from '@/components/comum/JsonLd';
import { Selo } from '@/components/comum/Selo';
import { Trilha } from '@/components/comum/Trilha';
import { AcoesImovel } from '@/components/imoveis/AcoesImovel';
import { BotaoCompartilhar } from '@/components/imoveis/BotaoCompartilhar';
import { CardImovel } from '@/components/imoveis/CardImovel';
import { FichaTecnica } from '@/components/imoveis/FichaTecnica';
import { Galeria } from '@/components/imoveis/Galeria';
import { NotaPremissas } from '@/components/imoveis/NotaPremissas';
import { PertoDeVoce } from '@/components/imoveis/PertoDeVoce';
import { PrecoParcela } from '@/components/imoveis/PrecoParcela';
import { SeloCabeNoBolso } from '@/components/imoveis/SeloCabeNoBolso';
import { SeloIlustrativo } from '@/components/imoveis/SeloIlustrativo';
import { SelosCondicoes } from '@/components/imoveis/SelosCondicoes';
import { FormularioLead } from '@/components/leads/FormularioLead';
import { MapaImovel } from '@/components/mapa/Mapas';
import { SimuladorImovel } from '@/components/simulador/SimuladorImovel';
import { parcelaEstimadaAnuncio } from '@/lib/financiamento';
import { repositorio } from '@/lib/repositorio';
import { ROTULO_SITUACAO, ROTULO_TIPO_PLURAL, SLUG_CATEGORIA_TIPO } from '@/lib/rotulos';
import { jsonLdImovel } from '@/lib/seo-imovel';
import { formatarBRL, formatarData, formatarMesAno, formatarPreco } from '@/lib/utils/formatar';
import { slugify } from '@/lib/utils/slug';
import { mensagemImovel } from '@/lib/utils/whatsapp';

/** Páginas geradas no build (SSG) e revalidadas a cada hora. */
export const revalidate = 3600;

export async function generateStaticParams() {
  const imoveis = await repositorio.listar();
  return imoveis.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/imoveis/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const i = await repositorio.obterPorSlug(slug);
  if (!i) return { title: 'Imóvel não encontrado' };
  const parcela = parcelaEstimadaAnuncio(i.preco).parcela;
  const descricao = `${i.titulo} por ${formatarPreco(i.preco)} (parcelas a partir de ${formatarPreco(parcela)}/mês, estimativa). ${i.quartos} quartos, ${i.areaUtilM2} m². Cód. ${i.codigo}.`;
  return {
    title: `${i.titulo} — ${formatarPreco(i.preco)}`,
    description: descricao,
    alternates: { canonical: `/imoveis/${i.slug}` },
    openGraph: {
      type: 'website',
      title: `${i.titulo} — ${formatarPreco(i.preco)}`,
      description: descricao,
      url: `/imoveis/${i.slug}`,
    },
  };
}

export default async function PaginaImovel({ params }: PageProps<'/imoveis/[slug]'>) {
  const { slug } = await params;
  const imovel = await repositorio.obterPorSlug(slug);
  if (!imovel) notFound();
  const [semelhantes, corretor] = await Promise.all([
    repositorio.semelhantes(imovel, LISTAGEM.maxSemelhantes),
    repositorio.obterCorretor(imovel.corretorResponsavelId),
  ]);
  const parcela = parcelaEstimadaAnuncio(imovel.preco).parcela;
  const disponivel = imovel.status === 'disponivel';
  const categoria = SLUG_CATEGORIA_TIPO[imovel.tipo];
  const mensagem = mensagemImovel(imovel);

  return (
    <div className="pb-24 lg:pb-0">
      <JsonLd dados={jsonLdImovel(imovel)} />
      {!disponivel && (
        <div className="bg-marinho text-white" role="status">
          <p className="container-site py-3 text-center font-semibold">
            Este imóvel está {imovel.status === 'vendido' ? 'VENDIDO' : 'RESERVADO'}.{' '}
            <a href="#semelhantes" className="underline">
              Veja imóveis semelhantes
            </a>
          </p>
        </div>
      )}
      <div className="container-site pt-4">
        <Trilha
          itens={[
            { nome: 'Imóveis', href: '/imoveis' },
            { nome: ROTULO_TIPO_PLURAL[imovel.tipo], href: `/imoveis/${categoria}` },
            { nome: imovel.codigo, href: `/imoveis/${imovel.slug}` },
          ]}
        />
      </div>

      <div className="container-site mt-3 !px-0 sm:!px-6 lg:!px-8">
        <Galeria
          fotos={imovel.fotos}
          titulo={imovel.titulo}
          videoUrl={imovel.videoUrl}
          tour360Url={imovel.tour360Url}
          ilustrativa={imovel.exemplo}
        />
      </div>

      <div className="container-site mt-6 lg:grid lg:grid-cols-[1fr_22rem] lg:gap-10">
        <article className="min-w-0 space-y-10">
          <header className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <SeloIlustrativo exemplo={imovel.exemplo} />
              <SeloCabeNoBolso preco={imovel.preco} />
              {!disponivel && (
                <Selo tom="escuro">{imovel.status === 'vendido' ? 'Vendido' : 'Reservado'}</Selo>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold sm:text-4xl">{imovel.titulo}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-lg text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-5" aria-hidden />
                  <span>
                    <Link
                      href={`/imoveis/bairro/${slugify(imovel.bairro)}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {imovel.bairro}
                    </Link>
                    , {imovel.cidade} - {imovel.uf}
                  </span>
                </span>
                <span>· Cód. {imovel.codigo}</span>
              </p>
            </div>
            <SelosCondicoes condicoes={imovel.condicoes} situacao={imovel.situacao} />
            <PrecoParcela preco={imovel.preco} parcela={parcela} tamanho="anuncio" />
            <FichaTecnica
              quartos={imovel.quartos}
              suites={imovel.suites}
              banheiros={imovel.banheiros}
              vagas={imovel.vagas}
              areaUtilM2={imovel.areaUtilM2}
              tamanho="anuncio"
            />
          </header>

          <section aria-labelledby="titulo-sobre" className="space-y-4">
            <h2 id="titulo-sobre" className="text-2xl font-bold">
              Sobre o imóvel
            </h2>
            <p className="text-lg leading-relaxed">{imovel.descricao}</p>
            <dl className="grid gap-3 rounded-2xl bg-muted/60 p-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Situação</dt>
                <dd className="font-semibold">
                  {ROTULO_SITUACAO[imovel.situacao]}
                  {imovel.previsaoEntrega && (
                    <span className="flex items-center gap-1 font-normal">
                      <CalendarClock className="size-4" aria-hidden /> Previsão de entrega:{' '}
                      {formatarMesAno(imovel.previsaoEntrega)}
                    </span>
                  )}
                </dd>
              </div>
              {imovel.areaTerrenoM2 && (
                <div>
                  <dt className="text-sm text-muted-foreground">Área do terreno</dt>
                  <dd className="font-semibold">{imovel.areaTerrenoM2} m²</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-muted-foreground">Condomínio</dt>
                <dd className="font-semibold">
                  {imovel.condominioMensal
                    ? `${formatarBRL(imovel.condominioMensal)}/mês`
                    : 'Não tem'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">IPTU</dt>
                <dd className="font-semibold">
                  {imovel.iptuAnual ? `${formatarBRL(imovel.iptuAnual)}/ano` : 'A informar'}
                </dd>
              </div>
            </dl>
            {imovel.caracteristicas.length > 0 && (
              <div>
                <h3 className="text-lg font-bold">Características</h3>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {imovel.caracteristicas.map((c) => (
                    <li key={c} className="flex items-center gap-2">
                      <Check className="size-5 shrink-0 text-sucesso" aria-hidden />{' '}
                      <span className="first-letter:uppercase">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {imovel.lazer.length > 0 && (
              <div>
                <h3 className="text-lg font-bold">Lazer do condomínio</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {imovel.lazer.map((l) => (
                    <li key={l}>
                      <Selo tom="info" className="text-sm first-letter:uppercase">
                        {l}
                      </Selo>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-2 lg:hidden">
              <BotaoCompartilhar
                titulo={imovel.titulo}
                texto={`${imovel.titulo} — ${formatarPreco(imovel.preco)} (cód. ${imovel.codigo})`}
                codigo={imovel.codigo}
              />
            </div>
          </section>

          {/* Fronteiras de Suspense: o React hidrata em partes e libera a pintura mais cedo. */}
          <Suspense>
            <SimuladorImovel preco={imovel.preco} cidade={imovel.cidade} uf={imovel.uf} />
          </Suspense>

          <section aria-labelledby="titulo-localizacao" className="space-y-4">
            <h2 id="titulo-localizacao" className="text-2xl font-bold">
              Localização
            </h2>
            <p className="text-muted-foreground">
              Mostramos a <strong>região aproximada</strong> do imóvel, no bairro {imovel.bairro}. O
              endereço completo é informado pelo corretor ao agendar a visita.
            </p>
            <div className="h-72 overflow-hidden rounded-2xl ring-1 ring-border sm:h-96">
              <MapaImovel
                lat={imovel.localizacaoAproximada.lat}
                lng={imovel.localizacaoAproximada.lng}
                raioMetros={imovel.localizacaoAproximada.raioMetros}
              />
            </div>
            <PertoDeVoce proximidades={imovel.proximidades} />
          </section>

          <section
            aria-labelledby="titulo-contato"
            className="rounded-2xl border bg-card p-5 sm:p-6"
          >
            <h2 id="titulo-contato" className="text-2xl font-bold">
              Quer saber mais sobre este imóvel?
            </h2>
            <p className="mt-1 mb-5 text-muted-foreground">
              Deixe seu contato e um corretor chama você no WhatsApp.
            </p>
            <Suspense>
              <FormularioLead
                origem="formulario_imovel"
                codigoImovel={imovel.codigo}
                mensagemWhatsApp={mensagem}
                textoBotao="Quero receber contato"
                pedirRenda
                mensagem={{
                  rotulo: 'Mensagem',
                  valorInicial: `Olá! Tenho interesse no imóvel ${imovel.codigo}.`,
                }}
              />
            </Suspense>
          </section>

          <section
            aria-labelledby="titulo-responsavel"
            className="flex items-start gap-4 rounded-2xl bg-muted/60 p-5"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-background">
              <UserRound className="size-6 text-muted-foreground" aria-hidden />
            </span>
            <div className="text-[0.95rem]">
              <h2 id="titulo-responsavel" className="font-bold">
                Corretor responsável
              </h2>
              <p>
                {corretor && estaDefinido(corretor.creci)
                  ? `${corretor.nome} · CRECI ${corretor.creci}`
                  : 'Equipe de corretores Contemplar'}
              </p>
              <p className="text-muted-foreground">
                {estaDefinido(EMPRESA.nomeEmpresarial)
                  ? EMPRESA.nomeEmpresarial
                  : 'Contemplar Imóveis'}
                {estaDefinido(EMPRESA.creciPJ) ? ` · ${EMPRESA.creciPJ}` : ''}
                {estaDefinido(EMPRESA.cnpj) ? ` · CNPJ ${EMPRESA.cnpj}` : ''}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Anúncio publicado em {formatarData(imovel.publicadoEm)} e atualizado em{' '}
                {formatarData(imovel.atualizadoEm)}. Valores e disponibilidade sujeitos a alteração.
              </p>
            </div>
          </section>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <Suspense>
              <AcoesImovel
                id={imovel.id}
                codigo={imovel.codigo}
                titulo={imovel.titulo}
                preco={imovel.preco}
                parcela={parcela}
                disponivel={disponivel}
                bairro={imovel.bairro}
                foto={imovel.fotos[0] ?? null}
                modo="lateral"
              />
            </Suspense>
          </div>
        </aside>
      </div>
      <AcoesImovel
        id={imovel.id}
        codigo={imovel.codigo}
        titulo={imovel.titulo}
        preco={imovel.preco}
        parcela={parcela}
        disponivel={disponivel}
        bairro={imovel.bairro}
        foto={imovel.fotos[0] ?? null}
        modo="barra"
      />

      {semelhantes.length > 0 && (
        <section
          id="semelhantes"
          aria-labelledby="titulo-semelhantes"
          className="container-site mt-14"
        >
          <h2 id="titulo-semelhantes" className="text-2xl font-bold">
            Imóveis semelhantes
          </h2>
          <Suspense>
            <ul className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {semelhantes.map((s) => (
                <li key={s.id}>
                  <CardImovel imovel={s} />
                </li>
              ))}
            </ul>
          </Suspense>
        </section>
      )}

      <div className="container-site mt-10">
        <NotaPremissas />
      </div>
    </div>
  );
}
