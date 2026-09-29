import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { SITE } from '@/config/site';
import { AlertaPendencias } from '@/components/layout/AlertaPendencias';
import { SCRIPT_LEITURA_FACIL } from '@/components/layout/BotaoLeituraFacil';
import { Cabecalho } from '@/components/layout/Cabecalho';
import { CapturaUTM } from '@/components/layout/CapturaUTM';
import { FaixaDemo } from '@/components/layout/FaixaDemo';
import { Rodape } from '@/components/layout/Rodape';
import { WhatsAppFlutuante } from '@/components/layout/WhatsAppFlutuante';
import './globals.css';

// display 'optional': sem troca de fonte tardia (melhor LCP/CLS em 3G/4G); a fonte da marca entra quando já está em cache.
const fonteTexto = Inter({ subsets: ['latin'], variable: '--fonte-texto', display: 'optional' });
const fonteTitulo = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--fonte-titulo',
  display: 'optional',
  weight: ['700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.nome} — ${SITE.slogan}`,
    template: `%s | ${SITE.nome}`,
  },
  description: SITE.descricao,
  applicationName: SITE.nome,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: SITE.nome,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fffdf9' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1322' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="pt-BR"
      className={`${fonteTexto.variable} ${fonteTitulo.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_LEITURA_FACIL }} />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#conteudo"
          className="sr-only z-50 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Pular para o conteúdo
        </a>
        <FaixaDemo />
        <Cabecalho />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <Rodape />
        <WhatsAppFlutuante />
        <CapturaUTM />
        <AlertaPendencias />
      </body>
    </html>
  );
}
