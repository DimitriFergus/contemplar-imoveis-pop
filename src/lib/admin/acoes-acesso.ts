'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { SUPABASE_CONFIGURADO } from '@/lib/supabase/config';
import { clienteDaSessao } from '@/lib/supabase/servidor';
import { obterSessao } from './sessao';

export interface EstadoFormulario {
  erro?: string;
  ok?: string;
}

const entradaSchema = z.object({
  email: z.email('Informe um e-mail válido').trim().toLowerCase(),
  senha: z.string().min(6, 'Informe a senha'),
});

export async function entrar(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  if (!SUPABASE_CONFIGURADO) return { erro: 'O banco de dados ainda não foi configurado.' };
  const r = entradaSchema.safeParse({ email: form.get('email'), senha: form.get('senha') });
  if (!r.success) return { erro: r.error.issues[0]?.message ?? 'Confira os dados.' };

  const supabase = await clienteDaSessao();
  const { error } = await supabase.auth.signInWithPassword({
    email: r.data.email,
    password: r.data.senha,
  });
  if (error) {
    return {
      erro:
        error.status === 429
          ? 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
          : 'E-mail ou senha incorretos.',
    };
  }
  redirect('/admin');
}

export async function sair() {
  if (SUPABASE_CONFIGURADO) {
    const supabase = await clienteDaSessao();
    await supabase.auth.signOut();
  }
  redirect('/admin/entrar');
}

export interface CadastroMfa {
  fatorId: string;
  qrCode: string;
  segredo: string;
}

/** Começa o cadastro do app autenticador (TOTP): devolve o QR Code para escanear. */
export async function iniciarCadastroMfa(): Promise<CadastroMfa | { erro: string }> {
  const sessao = await obterSessao();
  if (!sessao) redirect('/admin/entrar');
  const { supabase } = sessao;

  // Remove tentativas anteriores não concluídas.
  const { data: fatores } = await supabase.auth.mfa.listFactors();
  for (const f of fatores?.all ?? []) {
    if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `Contemplar ${new Date().toISOString().slice(0, 16)}`,
    issuer: 'Contemplar Imóveis',
  });
  if (error || !data) return { erro: 'Não foi possível gerar o QR Code. Tente de novo.' };
  return { fatorId: data.id, qrCode: data.totp.qr_code, segredo: data.totp.secret };
}

const codigoSchema = z.string().regex(/^\d{6}$/, 'O código tem 6 números');

/** Confere o código de 6 dígitos (no cadastro ou em cada entrada) e eleva a sessão para aal2. */
export async function confirmarCodigoMfa(
  _: EstadoFormulario,
  form: FormData,
): Promise<EstadoFormulario> {
  const sessao = await obterSessao();
  if (!sessao) redirect('/admin/entrar');
  const codigo = codigoSchema.safeParse(String(form.get('codigo') ?? '').replace(/\s/g, ''));
  if (!codigo.success) return { erro: codigo.error.issues[0]?.message };

  let fatorId = String(form.get('fatorId') ?? '');
  if (!fatorId) {
    const { data } = await sessao.supabase.auth.mfa.listFactors();
    fatorId = data?.totp[0]?.id ?? '';
  }
  if (!fatorId) return { erro: 'Nenhum app autenticador cadastrado.' };

  const { error } = await sessao.supabase.auth.mfa.challengeAndVerify({
    factorId: fatorId,
    code: codigo.data,
  });
  if (error) return { erro: 'Código incorreto ou vencido. Confira o app e tente de novo.' };
  redirect('/admin');
}

const senhaSchema = z
  .object({
    senha: z.string().min(10, 'A senha precisa ter pelo menos 10 caracteres'),
    confirmacao: z.string(),
  })
  .refine((v) => v.senha === v.confirmacao, {
    path: ['confirmacao'],
    message: 'As senhas não conferem',
  });

export async function trocarSenha(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const sessao = await obterSessao();
  if (!sessao) redirect('/admin/entrar');
  const r = senhaSchema.safeParse({
    senha: form.get('senha'),
    confirmacao: form.get('confirmacao'),
  });
  if (!r.success) return { erro: r.error.issues[0]?.message };
  const { error } = await sessao.supabase.auth.updateUser({ password: r.data.senha });
  if (error) return { erro: 'Não foi possível trocar a senha. Use uma senha diferente da atual.' };
  return { ok: 'Senha alterada.' };
}
