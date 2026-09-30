import { NavegacaoPainel } from '@/components/admin/NavegacaoPainel';
import { exigirSessao } from '@/lib/admin/sessao';

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const { perfil, ehAdmin } = await exigirSessao();
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_1fr]">
      <NavegacaoPainel nome={perfil.nome} papel={perfil.papel} ehAdmin={ehAdmin} />
      <div className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</div>
    </div>
  );
}
