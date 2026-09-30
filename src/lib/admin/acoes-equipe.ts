'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { clienteServico } from '@/lib/supabase/servidor';
import { slugify } from '@/lib/utils/slug';
import { revalidarSitePublico } from './revalidar';
import { exigirSessao } from './sessao';

export interface EstadoEquipe {
  ok?: string;
  erro?: string;
}

const novoMembroSchema = z.object({
  nome: z.string().trim().min(3, 'Informe o nome completo'),
  email: z.email('E-mail inválido').trim().toLowerCase(),
  senha: z.string().min(10, 'A senha provisória precisa ter pelo menos 10 caracteres'),
  papel: z.enum(['admin', 'corretor']),
  creci: z.string().trim().max(30),
  whatsapp: z.string().trim().max(20),
});

/**
 * Cria o acesso de um corretor ou admin: usuário no Supabase Auth, cartão público de corretor
 * e perfil. Usa a chave secreta (só no servidor) e só pode ser chamada por admin com MFA.
 */
export async function criarMembro(_: EstadoEquipe, form: FormData): Promise<EstadoEquipe> {
  await exigirSessao({ apenasAdmin: true });
  const r = novoMembroSchema.safeParse(Object.fromEntries(form));
  if (!r.success) return { erro: r.error.issues[0]?.message };
  const d = r.data;
  const servico = clienteServico();

  const { data: usuario, error } = await servico.auth.admin.createUser({
    email: d.email,
    password: d.senha,
    email_confirm: true,
    user_metadata: { nome: d.nome },
  });
  if (error || !usuario.user) {
    return {
      erro: /already|registered|exists/i.test(error?.message ?? '')
        ? 'Já existe um usuário com este e-mail.'
        : 'Não foi possível criar o usuário.',
    };
  }

  // Identificador público do corretor (usado nos anúncios), único.
  let corretorId = slugify(d.nome) || 'corretor';
  const { data: existentes } = await servico
    .from('corretores')
    .select('id')
    .like('id', `${corretorId}%`);
  const usados = new Set((existentes ?? []).map((c) => c.id));
  for (let n = 2; usados.has(corretorId); n++) corretorId = `${slugify(d.nome)}-${n}`;

  const whatsapp = d.whatsapp.replace(/\D/g, '');
  const { error: erroCorretor } = await servico.from('corretores').insert({
    id: corretorId,
    nome: d.nome,
    creci: d.creci || 'A_DEFINIR',
    whatsapp: whatsapp ? (whatsapp.startsWith('55') ? whatsapp : `55${whatsapp}`) : 'A_DEFINIR',
  });
  const { error: erroPerfil } = await servico.from('perfis').insert({
    id: usuario.user.id,
    nome: d.nome,
    email: d.email,
    papel: d.papel,
    corretor_id: erroCorretor ? null : corretorId,
  });
  if (erroPerfil) {
    await servico.auth.admin.deleteUser(usuario.user.id);
    return { erro: 'Não foi possível criar o perfil. Nada foi gravado.' };
  }
  revalidatePath('/admin/equipe');
  return {
    ok: `${d.nome} já pode entrar em /admin com o e-mail ${d.email} e a senha provisória. Peça para trocar a senha em "Minha conta".`,
  };
}

export async function alternarAtivo(id: string, ativo: boolean) {
  const { usuarioId } = await exigirSessao({ apenasAdmin: true });
  if (id === usuarioId) return;
  const servico = clienteServico();
  await servico.from('perfis').update({ ativo }).eq('id', id);
  // Desativado: não consegue mais entrar (banimento no Auth) e as regras do banco o bloqueiam.
  await servico.auth.admin.updateUserById(id, { ban_duration: ativo ? 'none' : '876000h' });
  revalidatePath('/admin/equipe');
}

export async function redefinirSenha(
  id: string,
  _: EstadoEquipe,
  form: FormData,
): Promise<EstadoEquipe> {
  await exigirSessao({ apenasAdmin: true });
  const senha = String(form.get('senha') ?? '');
  if (senha.length < 10) return { erro: 'Mínimo de 10 caracteres.' };
  const { error } = await clienteServico().auth.admin.updateUserById(id, { password: senha });
  if (error) return { erro: 'Não foi possível trocar a senha.' };
  return { ok: 'Senha provisória definida. Envie para a pessoa por um canal seguro.' };
}

const corretorSchema = z.object({
  nome: z.string().trim().min(2),
  creci: z.string().trim().min(1).max(30),
  whatsapp: z.string().trim().max(20),
});

export async function atualizarCorretor(
  id: string,
  _: EstadoEquipe,
  form: FormData,
): Promise<EstadoEquipe> {
  const { supabase } = await exigirSessao({ apenasAdmin: true });
  const r = corretorSchema.safeParse(Object.fromEntries(form));
  if (!r.success) return { erro: 'Confira nome, CRECI e WhatsApp.' };
  const digitos = r.data.whatsapp.replace(/\D/g, '');
  const { error } = await supabase
    .from('corretores')
    .update({
      nome: r.data.nome,
      creci: r.data.creci,
      whatsapp: digitos ? (digitos.startsWith('55') ? digitos : `55${digitos}`) : 'A_DEFINIR',
    })
    .eq('id', id);
  if (error) return { erro: 'Não foi possível salvar.' };
  revalidatePath('/admin/equipe');
  revalidarSitePublico();
  return { ok: 'Salvo.' };
}
