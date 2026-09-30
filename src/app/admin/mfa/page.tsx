import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ConfirmarMfa } from '@/components/admin/ConfirmarMfa';
import { Logo } from '@/components/marca/Logo';
import { sair } from '@/lib/admin/acoes-acesso';
import { obterSessao, pendenciaDaSessao } from '@/lib/admin/sessao';

export const metadata: Metadata = { title: 'Verificação em duas etapas' };

export default async function PaginaMfa({ searchParams }: PageProps<'/admin/mfa'>) {
  const { ativar } = await searchParams;
  const sessao = await obterSessao();
  if (!sessao) redirect('/admin/entrar');
  const pendencia = pendenciaDaSessao(sessao);
  if (pendencia === 'sem-perfil') redirect('/admin/entrar?erro=sem-acesso');
  const { data } = await sessao.supabase.auth.mfa.listFactors();
  const temFator = (data?.totp.length ?? 0) > 0;
  // Sem pendência: só fica aqui quem pediu para ativar o MFA e ainda não tem.
  if (!pendencia && !(ativar && !temFator)) redirect('/admin');

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-3xl border bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-extrabold">Verificação em duas etapas</h1>
          <p className="mt-1 mb-5 text-muted-foreground">
            {temFator
              ? 'Abra o app autenticador no celular e digite o código de 6 números.'
              : 'Para proteger os dados dos clientes, o acesso de administrador exige um app autenticador (Google Authenticator, Microsoft Authenticator ou Authy).'}
          </p>
          <ConfirmarMfa cadastrar={!temFator} />
        </div>
        <form action={sair} className="mt-4 text-center">
          <button type="submit" className="text-sm text-muted-foreground underline">
            Sair e entrar com outra conta
          </button>
        </form>
      </div>
    </div>
  );
}
