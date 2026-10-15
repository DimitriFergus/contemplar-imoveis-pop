import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { MENSAGENS_WHATSAPP } from '@/config/site';
import { BotaoWhatsApp } from '@/components/comum/BotaoWhatsApp';
import { Logo } from '@/components/marca/Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BotaoLeituraFacil } from './BotaoLeituraFacil';
import { LinkFavoritos } from './LinkFavoritos';
import { MenuCelular } from './MenuCelular';
import { LINKS_PRINCIPAIS } from './navegacao';

const CLASSE_LINK =
  'inline-flex min-h-11 items-center rounded-lg px-3 text-[0.95rem] font-semibold text-foreground/85 hover:bg-muted hover:text-foreground';

export function Cabecalho() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="container-site flex h-16 items-center justify-between gap-3">
        <Logo />
        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {LINKS_PRINCIPAIS.map((item) => (
              <li key={item.tipo === 'menu' ? item.rotulo : item.href}>
                {item.tipo === 'link' ? (
                  <Link href={item.href} className={CLASSE_LINK}>
                    {item.rotulo}
                  </Link>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger className={`${CLASSE_LINK} gap-1 outline-none`}>
                      {item.rotulo}
                      <ChevronDown className="size-4" aria-hidden />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {item.itens.map((l) => (
                        <DropdownMenuItem key={l.href} asChild>
                          <Link href={l.href}>{l.rotulo}</Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1">
          <BotaoLeituraFacil />
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
