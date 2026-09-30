'use client';

import Link from 'next/link';
import { FormularioSenha } from '@/components/admin/FormularioSenha';
import { Cartao, TituloPagina } from '@/components/admin/ui';
import { usePainel } from '@/lib/admin/sessao';
import { useConsulta } from '@/lib/admin/useConsulta';

export default function PaginaConta() {
  const { perfil, email, supabase, nivelAtual } = usePainel();
  const { dados: temMfa } = useConsulta(async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    return (data?.totp.length ?? 0) > 0;
  }, '');

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
              {temMfa === undefined
                ? '…'
                : temMfa
                  ? `Ativa${nivelAtual === 'aal2' ? ' (confirmada nesta sessão)' : ''}`
                  : 'Desativada'}
            </dd>
          </div>
        </dl>
        {temMfa === false && (
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
