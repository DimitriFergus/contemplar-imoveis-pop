'use client';

import { Carregando } from '@/components/admin/Carregando';
import { NavegacaoPainel } from '@/components/admin/NavegacaoPainel';
import { PainelProtegido, usePainel } from '@/lib/admin/sessao';

function Estrutura({ children }: { children: React.ReactNode }) {
  const { perfil, ehAdmin } = usePainel();
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_1fr]">
      <NavegacaoPainel nome={perfil.nome} papel={perfil.papel} ehAdmin={ehAdmin} />
      <div className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</div>
    </div>
  );
}

/** Todas as telas do painel: exigem login (e MFA para administradores). */
export default function LayoutPainel({ children }: { children: React.ReactNode }) {
  return (
    <PainelProtegido carregando={<Carregando texto="Abrindo o painel…" />}>
      <Estrutura>{children}</Estrutura>
    </PainelProtegido>
  );
}
