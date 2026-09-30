'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { SUPABASE_CONFIGURADO } from '@/lib/supabase/config';
import { clienteNavegador } from '@/lib/supabase/navegador';
import type { LinhaPerfil } from '@/lib/supabase/tipos';

/**
 * Sessão do painel no navegador. O painel roda inteiro no cliente (funciona no GitHub Pages);
 * a segurança de verdade está no banco: toda leitura e gravação passa pelas regras RLS.
 */

export type NivelMfa = 'aal1' | 'aal2';

export interface EstadoSessao {
  supabase: SupabaseClient;
  usuarioId: string;
  email: string;
  perfil: LinhaPerfil | null;
  nivelAtual: NivelMfa;
  proximoNivel: NivelMfa;
}

export interface SessaoPainel extends EstadoSessao {
  perfil: LinhaPerfil;
  ehAdmin: boolean;
  /** Recarrega perfil e nível de MFA (depois de confirmar o código, por exemplo). */
  recarregar: () => Promise<void>;
}

export async function lerSessao(): Promise<EstadoSessao | null> {
  if (!SUPABASE_CONFIGURADO) return null;
  const supabase = clienteNavegador();
  const { data } = await supabase.auth.getUser();
  const usuario = data.user;
  if (!usuario) return null;
  const [{ data: perfil }, { data: nivel }] = await Promise.all([
    supabase
      .from('perfis')
      .select('id, nome, email, papel, corretor_id, ativo, criado_em')
      .eq('id', usuario.id)
      .maybeSingle<LinhaPerfil>(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  return {
    supabase,
    usuarioId: usuario.id,
    email: usuario.email ?? '',
    perfil,
    nivelAtual: (nivel?.currentLevel ?? 'aal1') as NivelMfa,
    proximoNivel: (nivel?.nextLevel ?? 'aal1') as NivelMfa,
  };
}

/** O que falta para a sessão poder usar o painel. */
export function pendenciaDaSessao(s: EstadoSessao): 'sem-perfil' | 'mfa' | null {
  if (!s.perfil || !s.perfil.ativo) return 'sem-perfil';
  // Admin sempre com MFA; corretor que ativou o MFA também precisa confirmar o código.
  if (s.perfil.papel === 'admin' && s.nivelAtual !== 'aal2') return 'mfa';
  if (s.proximoNivel === 'aal2' && s.nivelAtual !== 'aal2') return 'mfa';
  return null;
}

const Contexto = createContext<SessaoPainel | null>(null);

export function usePainel(): SessaoPainel {
  const s = useContext(Contexto);
  if (!s) throw new Error('usePainel fora do painel');
  return s;
}

/** Protege as telas do painel: sem login vai para Entrar; sem MFA vai para a verificação. */
export function PainelProtegido({
  children,
  carregando,
}: {
  children: ReactNode;
  carregando: ReactNode;
}) {
  const router = useRouter();
  const caminho = usePathname();
  const [sessao, setSessao] = useState<SessaoPainel | null>(null);

  const carregar = useCallback(async () => {
    const s = await lerSessao();
    if (!s) return router.replace('/admin/entrar');
    const pendencia = pendenciaDaSessao(s);
    if (pendencia === 'sem-perfil') return router.replace('/admin/entrar?erro=sem-acesso');
    if (pendencia === 'mfa') return router.replace('/admin/mfa');
    const perfil = s.perfil as LinhaPerfil;
    setSessao({ ...s, perfil, ehAdmin: perfil.papel === 'admin', recarregar: carregar });
  }, [router]);

  useEffect(() => {
    void carregar();
    const { data } = clienteNavegador().auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_OUT') router.replace('/admin/entrar');
    });
    return () => data.subscription.unsubscribe();
  }, [carregar, router]);

  // Páginas só de admin.
  useEffect(() => {
    if (!sessao || sessao.ehAdmin) return;
    if (caminho.startsWith('/admin/equipe') || caminho.startsWith('/admin/historico'))
      router.replace('/admin?aviso=somente-admin');
  }, [sessao, caminho, router]);

  if (!sessao) return carregando;
  return <Contexto.Provider value={sessao}>{children}</Contexto.Provider>;
}
