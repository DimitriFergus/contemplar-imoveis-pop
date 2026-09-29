import type { ReactNode } from 'react';
import { Trilha } from '@/components/comum/Trilha';

export function PaginaTexto({
  titulo,
  caminho,
  atualizadoEm,
  children,
}: {
  titulo: string;
  caminho: string;
  atualizadoEm: string;
  children: ReactNode;
}) {
  return (
    <div className="container-site max-w-3xl py-6 lg:py-8">
      <Trilha itens={[{ nome: titulo, href: caminho }]} />
      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{titulo}</h1>
      <p className="mt-1 text-muted-foreground">Última atualização: {atualizadoEm}</p>
      <div className="mt-8 space-y-4 leading-relaxed [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
        {children}
      </div>
    </div>
  );
}
