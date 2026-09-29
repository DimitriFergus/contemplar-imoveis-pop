'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { MENSAGENS_WHATSAPP } from '@/config/site';
import { BotaoWhatsApp } from '@/components/comum/BotaoWhatsApp';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { BotaoLeituraFacil } from './BotaoLeituraFacil';
import { LINKS_PRINCIPAIS } from './navegacao';

export function MenuCelular() {
  const [aberto, setAberto] = useState(false);
  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
          <Menu className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[85vw] max-w-sm gap-0 p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-lg font-bold">Menu</SheetTitle>
          <SheetDescription>Encontre seu imóvel e tire suas dúvidas.</SheetDescription>
        </SheetHeader>
        <nav aria-label="Menu do celular" className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="flex flex-col">
            {[
              ...LINKS_PRINCIPAIS,
              { href: '/favoritos', rotulo: 'Meus favoritos' },
              { href: '/comparar', rotulo: 'Comparar imóveis' },
              { href: '/contato', rotulo: 'Contato' },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setAberto(false)}
                  className="flex min-h-12 items-center rounded-lg px-3 text-lg font-semibold hover:bg-muted"
                >
                  {l.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-3 border-t p-4">
          <BotaoWhatsApp
            mensagem={MENSAGENS_WHATSAPP.geral}
            local="menu_celular"
            size="lg"
            className="w-full"
          />
          <BotaoLeituraFacil className="w-full" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
