import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s · Painel Contemplar' },
  robots: { index: false, follow: false },
};

/**
 * Contra clickjacking: o painel nunca roda dentro de um iframe de outro site. No servidor isso vem
 * do cabeçalho frame-ancestors; no GitHub Pages (sem cabeçalhos), deste script.
 */
const SCRIPT_SEM_IFRAME = `if(window.top!==window.self){document.documentElement.style.display='none';try{window.top.location.href=window.self.location.href}catch(e){}}`;

export default function LayoutAdmin({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="min-h-dvh bg-muted/50">
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_SEM_IFRAME }} />
      {children}
    </div>
  );
}
