import type { Metadata } from 'next';
import Link from 'next/link';
import { FormularioSenha } from '@/components/admin/FormularioSenha';
import { Cartao, TituloPagina } from '@/components/admin/ui';
import { exigirSessao } from '@/lib/admin/sessao';

export const metadata: Metadata = { title: 'Minha conta' };

export default async function PaginaConta() {
  const { perfil, email, supabase, nivelAtual } = await exigirSessao();
  const { data } = await supabase.auth.mfa.listFactors();
  const temMfa = (data?.totp.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <TituloPagina titulo="Minha conta" />
      <Cartao titulo="Dados">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Nome</dt>
            <dd className="font-semibold">{perfil.nome}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">E-mail</dt>
            <dd className="font-semibold break-all">{email}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Papel</dt>
            <dd className="font-semibold">
              {perfil.papel === 'admin' ? 'Administrador' : 'Corretor'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Verificação em duas etapas</dt>
            <dd className="font-semibold">
              {temMfa
                ? `Ativa${nivelAtual === 'aal2' ? ' (confirmada nesta sessão)' : ''}`
                : 'Desativada'}
            </dd>
          </div>
        </dl>
        {!temMfa && (
          <p className="mt-4 text-sm">
            Recomendado:{' '}
            <Link href="/admin/mfa?ativar=1" className="font-semibold text-primary underline">
              ativar a verificação em duas etapas
            </Link>
            .
          </p>
        )}
      </Cartao>
      <Cartao titulo="Trocar senha">
        <FormularioSenha />
      </Cartao>
    </div>
  );
}
