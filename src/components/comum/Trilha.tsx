import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { SITE } from '@/config/site';
import { JsonLd } from './JsonLd';

/** Trilha de navegação (breadcrumb) com dados estruturados. */
export function Trilha({ itens }: { itens: { nome: string; href: string }[] }) {
  const todos = [{ nome: 'Início', href: '/' }, ...itens];
  return (
    <>
      <nav aria-label="Você está em" className="text-[0.95rem] text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          {todos.map((item, i) => (
            <li key={item.href} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-4" aria-hidden />}
              {i === todos.length - 1 ? (
                <span aria-current="page" className="font-semibold text-foreground">
                  {item.nome}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center hover:underline"
                >
                  {item.nome}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: todos.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.nome,
            item: `${SITE.url}${item.href}`,
          })),
        }}
      />
    </>
  );
}
