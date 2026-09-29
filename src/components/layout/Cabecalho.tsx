import Link from 'next/link';
import { MENSAGENS_WHATSAPP } from '@/config/site';
import { BotaoWhatsApp } from '@/components/comum/BotaoWhatsApp';
import { Logo } from '@/components/marca/Logo';
import { LinkFavoritos } from './LinkFavoritos';
import { MenuCelular } from './MenuCelular';
import { LINKS_PRINCIPAIS } from './navegacao';

export function Cabecalho() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="container-site flex h-16 items-center justify-between gap-3">
        <Logo />
        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {LINKS_PRINCIPAIS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-[0.95rem] font-semibold text-foreground/85 hover:bg-muted hover:text-foreground"
                >
                  {l.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1.5">
          <LinkFavoritos />
          <BotaoWhatsApp
            mensagem={MENSAGENS_WHATSAPP.geral}
            local="cabecalho"
            rotulo="WhatsApp"
            size="sm"
            className="hidden sm:inline-flex"
          />
          <MenuCelular />
        </div>
      </div>
    </header>
  );
}
