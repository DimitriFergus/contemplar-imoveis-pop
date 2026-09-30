'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { FormularioEntrar } from '@/components/admin/FormularioEntrar';
import { Aviso } from '@/components/admin/ui';
import { Logo } from '@/components/marca/Logo';
import { lerSessao, pendenciaDaSessao } from '@/lib/admin/sessao';
import { SUPABASE_CONFIGURADO } from '@/lib/supabase/config';

function Conteudo() {
  const router = useRouter();
  const erro = useSearchParams().get('erro');
  const [semAcesso, setSemAcesso] = useState(erro === 'sem-acesso');

  // Já logado: segue direto.
  useEffect(() => {
    void lerSessao().then((s) => {
      if (!s) return;
      const pendencia = pendenciaDaSessao(s);
      if (pendencia === 'mfa') router.replace('/admin/mfa');
      else if (!pendencia) router.replace('/admin');
      else setSemAcesso(true);
    });
  }, [router]);

  if (!SUPABASE_CONFIGURADO)
    return (
      <Aviso tom="aviso">
        O banco de dados ainda não foi configurado. Siga o passo a passo do arquivo
        docs/MANUAL_ADMIN.md.
      </Aviso>
    );
  return (
    <>
      {semAcesso && (
        <Aviso tom="erro" className="mb-4">
          Seu usuário não tem acesso ao painel ou foi desativado. Fale com o administrador.
        </Aviso>
      )}
      <FormularioEntrar />
    </>
  );
}

export default function PaginaEntrar() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-3xl border bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-extrabold">Painel da equipe</h1>
          <p className="mt-1 mb-5 text-muted-foreground">Entre com seu e-mail e senha.</p>
          <Suspense>
            <Conteudo />
          </Suspense>
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Esqueceu a senha? Peça ao administrador para criar uma senha provisória.
        </p>
      </div>
    </div>
  );
}
