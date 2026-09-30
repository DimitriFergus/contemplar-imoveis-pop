import 'server-only';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { SUPABASE_CONFIGURADO } from '@/lib/supabase/config';
import { clienteDaSessao } from '@/lib/supabase/servidor';
import type { LinhaPerfil } from '@/lib/supabase/tipos';

export type NivelMfa = 'aal1' | 'aal2';

export interface Sessao {
  supabase: Awaited<ReturnType<typeof clienteDaSessao>>;
  usuarioId: string;
  email: string;
  perfil: LinhaPerfil | null;
  nivelAtual: NivelMfa;
  /** aal2 quando a pessoa já tem MFA cadastrado (e precisa confirmar o código). */
  proximoNivel: NivelMfa;
}

/**
 * Camada de acesso (DAL): lê e confere a sessão no Supabase Auth.
 * Memorizada por requisição com React cache.
 */
export const obterSessao = cache(async (): Promise<Sessao | null> => {
  if (!SUPABASE_CONFIGURADO) return null;
  const supabase = await clienteDaSessao();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const [{ data: perfil }, { data: nivel }] = await Promise.all([
    supabase
      .from('perfis')
      .select('id, nome, email, papel, corretor_id, ativo, criado_em')
      .eq('id', claims.sub)
      .maybeSingle<LinhaPerfil>(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  return {
    supabase,
    usuarioId: claims.sub,
    email: typeof claims.email === 'string' ? claims.email : '',
    perfil,
    nivelAtual: (nivel?.currentLevel ?? 'aal1') as NivelMfa,
    proximoNivel: (nivel?.nextLevel ?? 'aal1') as NivelMfa,
  };
});

/** O que falta para a sessão poder usar o painel. */
export function pendenciaDaSessao(s: Sessao): 'sem-perfil' | 'mfa' | null {
  if (!s.perfil || !s.perfil.ativo) return 'sem-perfil';
  // Admin sempre com MFA; corretor que ativou o MFA também precisa confirmar o código.
  if (s.perfil.papel === 'admin' && s.nivelAtual !== 'aal2') return 'mfa';
  if (s.proximoNivel === 'aal2' && s.nivelAtual !== 'aal2') return 'mfa';
  return null;
}

export interface SessaoValida extends Sessao {
  perfil: LinhaPerfil;
  ehAdmin: boolean;
}

/**
 * Exige sessão válida (e MFA quando aplicável). Use em toda página, Server Action e
 * Route Handler do painel. Com `apenasAdmin`, corretores voltam para o início do painel.
 */
export async function exigirSessao(opcoes: { apenasAdmin?: boolean } = {}): Promise<SessaoValida> {
  const s = await obterSessao();
  if (!s) redirect('/admin/entrar');
  const pendencia = pendenciaDaSessao(s);
  if (pendencia === 'sem-perfil') redirect('/admin/entrar?erro=sem-acesso');
  if (pendencia === 'mfa') redirect('/admin/mfa');
  const perfil = s.perfil as LinhaPerfil;
  const ehAdmin = perfil.papel === 'admin';
  if (opcoes.apenasAdmin && !ehAdmin) redirect('/admin?aviso=somente-admin');
  return { ...s, perfil, ehAdmin };
}
