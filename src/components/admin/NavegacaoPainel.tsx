'use client';

import {
  ExternalLink,
  History,
  Home,
  LogOut,
  Menu,
  Building2,
  UserCog,
  Users,
  X,
  Inbox,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { sair } from '@/lib/admin/operacoes';
import { cn } from '@/lib/utils';

const ITENS = [
  { href: '/admin', rotulo: 'Início', icone: Home, admin: false },
  { href: '/admin/imoveis', rotulo: 'Imóveis', icone: Building2, admin: false },
  { href: '/admin/leads', rotulo: 'Leads (CRM)', icone: Inbox, admin: false },
  { href: '/admin/equipe', rotulo: 'Equipe', icone: Users, admin: true },
  { href: '/admin/historico', rotulo: 'Histórico', icone: History, admin: true },
  { href: '/admin/conta', rotulo: 'Minha conta', icone: UserCog, admin: false },
];

export function NavegacaoPainel({
  nome,
  papel,
  ehAdmin,
}: {
  nome: string;
  papel: string;
  ehAdmin: boolean;
}) {
  const caminho = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const ativo = (href: string) =>
    href === '/admin' ? caminho === href : caminho === href || caminho.startsWith(`${href}/`);

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-marinho px-4 py-2 text-white lg:hidden">
        <span className="font-heading font-extrabold">Painel Contemplar</span>
        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          className="grid size-11 place-items-center rounded-lg"
          aria-expanded={aberto}
          aria-controls="menu-painel"
        >
          {aberto ? <X aria-hidden /> : <Menu aria-hidden />}
          <span className="sr-only">{aberto ? 'Fechar menu' : 'Abrir menu'}</span>
        </button>
      </div>
      <nav
        id="menu-painel"
        aria-label="Menu do painel"
        className={cn(
          'bg-marinho text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col',
          aberto ? 'block' : 'hidden lg:flex',
        )}
      >
        <div className="hidden px-5 pt-6 pb-4 lg:block">
          <p className="font-heading text-lg font-extrabold">Contemplar</p>
          <p className="text-sm text-white/70">Painel da equipe</p>
        </div>
        <ul className="space-y-1 px-3 py-3 lg:flex-1">
          {ITENS.filter((i) => !i.admin || ehAdmin).map(({ href, rotulo, icone: Icone }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setAberto(false)}
                aria-current={ativo(href) ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-xl px-3 font-semibold text-white/85 hover:bg-white/10 hover:text-white',
                  ativo(href) && 'bg-white/15 text-white',
                )}
                data-sem-sublinhado
              >
                <Icone className="size-5" aria-hidden /> {rotulo}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/"
              target="_blank"
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 font-semibold text-white/85 hover:bg-white/10"
              data-sem-sublinhado
            >
              <ExternalLink className="size-5" aria-hidden /> Ver o site
            </Link>
          </li>
        </ul>
        <div className="border-t border-white/15 px-5 py-4">
          <p className="truncate font-semibold">{nome}</p>
          <p className="text-sm text-white/70">
            {papel === 'admin' ? 'Administrador' : 'Corretor'}
          </p>
          <div className="mt-3">
            <button
              type="button"
              onClick={async () => {
                await sair();
                router.replace('/admin/entrar');
              }}
              className="flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-white/85 hover:text-white"
            >
              <LogOut className="size-4" aria-hidden /> Sair
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
