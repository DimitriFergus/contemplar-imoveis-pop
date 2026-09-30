'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Carregando } from '@/components/admin/Carregando';
import { ConfirmarMfa } from '@/components/admin/ConfirmarMfa';
import { Logo } from '@/components/marca/Logo';
import { sair } from '@/lib/admin/operacoes';
import { lerSessao, pendenciaDaSessao } from '@/lib/admin/sessao';

function Conteudo() {
  const router = useRouter();
  const ativar = useSearchParams().get('ativar');
  const [temFator, setTemFator] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      const s = await lerSessao();
      if (!s) return router.replace('/admin/entrar');
      const pendencia = pendenciaDaSessao(s);
      if (pendencia === 'sem-perfil') return router.replace('/admin/entrar?erro=sem-acesso');
      const { data } = await s.supabase.auth.mfa.listFactors();
      const tem = (data?.totp.length ?? 0) > 0;
      // Sem pendência: só fica aqui quem pediu para ativar o MFA e ainda não tem.
      if (!pendencia && !(ativar && !tem)) return router.replace('/admin');
      setTemFator(tem);
    })();
  }, [router, ativar]);

  if (temFator === null) return <Carregando />;
  return (
    <>
      <p className="mt-1 mb-5 text-muted-foreground">
        {temFator
          ? 'Abra o app autenticador no celular e digite o código de 6 números.'
          : 'Para proteger os dados dos clientes, o acesso de administrador exige um app autenticador (Google Authenticator, Microsoft Authenticator ou Authy).'}
      </p>
      <ConfirmarMfa cadastrar={!temFator} />
    </>
  );
}

export default function PaginaMfa() {
  const router = useRouter();
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-3xl border bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-extrabold">Verificação em duas etapas</h1>
          <Suspense>
            <Conteudo />
          </Suspense>
        </div>
        <p className="mt-4 text-center">
          <button
            type="button"
            className="text-sm text-muted-foreground underline"
            onClick={async () => {
              await sair();
              router.replace('/admin/entrar');
            }}
          >
            Sair e entrar com outra conta
          </button>
        </p>
      </div>
    </div>
  );
}
