import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s · Painel Contemplar' },
  robots: { index: false, follow: false },
};

export default function LayoutAdmin({ children }: LayoutProps<'/admin'>) {
  return <div className="min-h-dvh bg-muted/50">{children}</div>;
}
