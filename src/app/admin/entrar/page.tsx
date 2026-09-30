import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Aviso } from '@/components/admin/ui';
import { FormularioEntrar } from '@/components/admin/FormularioEntrar';
import { Logo } from '@/components/marca/Logo';
import { obterSessao, pendenciaDaSessao } from '@/lib/admin/sessao';
import { SUPABASE_CONFIGURADO } from '@/lib/supabase/config';

export const metadata: Metadata = { title: 'Entrar' };

export default async function PaginaEntrar({ searchParams }: PageProps<'/admin/entrar'>) {
  const { erro } = await searchParams;
  const sessao = await obterSessao();
  if (sessao) {
    const pendencia = pendenciaDaSessao(sessao);
    if (pendencia === 'mfa') redirect('/admin/mfa');
    if (!pendencia) redirect('/admin');
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-3xl border bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-extrabold">Painel da equipe</h1>
          <p className="mt-1 mb-5 text-muted-foreground">Entre com seu e-mail e senha.</p>
          {!SUPABASE_CONFIGURADO ? (
            <Aviso tom="aviso">
              O banco de dados ainda não foi configurado. Siga o passo a passo do arquivo
              docs/MANUAL_ADMIN.md.
            </Aviso>
          ) : (
            <>
              {(erro === 'sem-acesso' ||
                (sessao && pendenciaDaSessao(sessao) === 'sem-perfil')) && (
                <Aviso tom="erro" className="mb-4">
                  Seu usuário não tem acesso ao painel ou foi desativado. Fale com o administrador.
                </Aviso>
              )}
              <FormularioEntrar />
            </>
          )}
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Esqueceu a senha? Peça ao administrador para criar uma senha provisória.
        </p>
      </div>
    </div>
  );
}
