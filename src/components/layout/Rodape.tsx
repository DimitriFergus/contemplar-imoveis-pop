import Link from 'next/link';
import { AVISO_SIMULACAO } from '@/config/financiamento';
import { CONTATO, EMPRESA, REDES_SOCIAIS, SITE, estaDefinido } from '@/config/site';
import { Logo } from '@/components/marca/Logo';
import { ROTULO_TIPO_PLURAL, SLUG_CATEGORIA_TIPO } from '@/lib/rotulos';
import { formatarPrecoCurto } from '@/lib/utils/formatar';
import { BotaoLeituraFacil } from './BotaoLeituraFacil';
import { BotaoApagarDados } from './BotaoApagarDados';

const exibir = (valor: string, rotuloPendente: string) =>
  estaDefinido(valor) ? valor : rotuloPendente;

export function Rodape() {
  const categorias = (['casa', 'apartamento', 'casa_condominio', 'sobrado'] as const).map((t) => ({
    href: `/imoveis/${SLUG_CATEGORIA_TIPO[t]}`,
    rotulo: ROTULO_TIPO_PLURAL[t],
  }));
  return (
    <footer className="mt-16 border-t bg-muted/60 pb-24 lg:pb-0">
      <div className="container-site grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="text-muted-foreground">
            {SITE.slogan}. Imóveis populares a partir de {formatarPrecoCurto(SITE.precoAPartirDe)}.
          </p>
          <BotaoLeituraFacil />
        </div>
        <nav aria-label="Imóveis">
          <h2 className="mb-3 text-base font-bold">Imóveis</h2>
          <ul className="space-y-1">
            <li>
              <Link className="inline-flex min-h-11 items-center hover:underline" href="/imoveis">
                Todos os imóveis
              </Link>
            </li>
            {categorias.map((c) => (
              <li key={c.href}>
                <Link className="inline-flex min-h-11 items-center hover:underline" href={c.href}>
                  {c.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Ajuda">
          <h2 className="mb-3 text-base font-bold">Ajuda</h2>
          <ul className="space-y-1">
            {[
              ['/simulador', 'Simulador de financiamento'],
              ['/minha-casa-minha-vida', 'Minha Casa, Minha Vida'],
              ['/como-comprar', 'Como comprar (passo a passo)'],
              ['/anuncie', 'Anuncie seu imóvel'],
              ['/sobre', 'Sobre nós'],
              ['/contato', 'Contato'],
            ].map(([href, rotulo]) => (
              <li key={href}>
                <Link className="inline-flex min-h-11 items-center hover:underline" href={href!}>
                  {rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-2 text-[0.95rem]">
          <h2 className="mb-3 text-base font-bold">Contato</h2>
          <p>WhatsApp: {exibir(CONTATO.telefoneExibicao, 'a definir')}</p>
          <p>E-mail: {exibir(CONTATO.email, 'a definir')}</p>
          <p className="text-muted-foreground">{EMPRESA.horarioAtendimento}</p>
          {REDES_SOCIAIS.length > 0 && (
            <ul className="flex gap-3">
              {REDES_SOCIAIS.map((r) => (
                <li key={r.url}>
                  <a href={r.url} className="underline" target="_blank" rel="noopener noreferrer">
                    {r.nome}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="border-t">
        <div className="container-site space-y-3 py-6 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">
            {exibir(EMPRESA.nomeEmpresarial, `${SITE.nome} (razão social a definir)`)} · CNPJ{' '}
            {exibir(EMPRESA.cnpj, 'a definir')} · {exibir(EMPRESA.creciPJ, 'CRECI PJ a definir')}
          </p>
          <p>
            {SITE.nome} é uma marca da Contemplar Imóveis, empresa do {SITE.grupo}.{' '}
            {estaDefinido(EMPRESA.endereco) ? EMPRESA.endereco : ''}
          </p>
          <p>{AVISO_SIMULACAO}</p>
          <p>
            Fotos e valores sujeitos a alteração sem aviso prévio. Imagens podem ser ilustrativas. A
            localização no mapa é aproximada.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              className="inline-flex min-h-11 items-center underline"
              href="/politica-de-privacidade"
            >
              Política de Privacidade
            </Link>
            <Link className="inline-flex min-h-11 items-center underline" href="/termos-de-uso">
              Termos de Uso
            </Link>
            <BotaoApagarDados />
          </div>
          <p>
            © {new Date().getFullYear()} {SITE.nome}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
