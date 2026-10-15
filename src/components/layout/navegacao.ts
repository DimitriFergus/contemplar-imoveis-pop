export interface LinkNavegacao {
  href: string;
  rotulo: string;
}

export type ItemNavegacao =
  | ({ tipo: 'link' } & LinkNavegacao)
  | { tipo: 'menu'; rotulo: string; itens: LinkNavegacao[] };

/** Itens soltos na barra (Imóveis, Mapa, Anuncie) e um menu com as páginas de apoio à compra. */
export const LINKS_PRINCIPAIS: ItemNavegacao[] = [
  { tipo: 'link', href: '/imoveis', rotulo: 'Imóveis' },
  { tipo: 'link', href: '/comprar', rotulo: 'Mapa' },
  {
    tipo: 'menu',
    rotulo: 'Financiamento',
    itens: [
      { href: '/simulador', rotulo: 'Simulador' },
      { href: '/minha-casa-minha-vida', rotulo: 'Minha Casa Minha Vida' },
      { href: '/como-comprar', rotulo: 'Como comprar' },
    ],
  },
  { tipo: 'link', href: '/anuncie', rotulo: 'Anuncie seu imóvel' },
];

/** Todos os links (sem os menus), usados no menu do celular, que não precisa de submenu. */
export const LINKS_TODOS: LinkNavegacao[] = LINKS_PRINCIPAIS.flatMap((item) =>
  item.tipo === 'menu' ? item.itens : [{ href: item.href, rotulo: item.rotulo }],
);
