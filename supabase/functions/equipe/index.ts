// Edge Function "equipe": cria acessos, ativa/desativa e define senha provisória.
// Roda nos servidores do Supabase (a chave secreta nunca vai para o navegador).
// Só atende administradores com MFA confirmado (a função eh_admin() do banco confere).
//
// Instalar/atualizar: npx supabase functions deploy equipe --project-ref <ref>

import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const responder = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

function slugify(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const whatsapp = (v: unknown) => {
  const d = String(v ?? '').replace(/\D/g, '');
  return d ? (d.startsWith('55') ? d : `55${d}`) : 'A_DEFINIR';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return responder({ erro: 'Método não permitido' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const chavePublica = Deno.env.get('SUPABASE_ANON_KEY')!;
  const chaveSecreta = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // 1) Quem está chamando? (com o token da própria pessoa)
  const autorizacao = req.headers.get('Authorization') ?? '';
  const comoUsuario = createClient(url, chavePublica, {
    global: { headers: { Authorization: autorizacao } },
    auth: { persistSession: false },
  });
  const { data: ehAdmin, error: erroAdmin } = await comoUsuario.rpc('eh_admin');
  if (erroAdmin || ehAdmin !== true)
    return responder(
      { erro: 'Apenas administradores (com o app autenticador) podem fazer isso.' },
      403,
    );
  const { data: eu } = await comoUsuario.auth.getUser();

  const servico = createClient(url, chaveSecreta, { auth: { persistSession: false } });
  let corpo: Record<string, unknown>;
  try {
    corpo = await req.json();
  } catch {
    return responder({ erro: 'Dados inválidos' }, 400);
  }
  const acao = String(corpo.acao ?? '');

  if (acao === 'criar') {
    const nome = String(corpo.nome ?? '').trim();
    const email = String(corpo.email ?? '')
      .trim()
      .toLowerCase();
    const senha = String(corpo.senha ?? '');
    const papel = corpo.papel === 'admin' ? 'admin' : 'corretor';
    if (nome.length < 3) return responder({ erro: 'Informe o nome completo' }, 422);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return responder({ erro: 'E-mail inválido' }, 422);
    if (senha.length < 10)
      return responder({ erro: 'A senha provisória precisa ter pelo menos 10 caracteres' }, 422);

    const { data: usuario, error } = await servico.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    });
    if (error || !usuario.user)
      return responder(
        {
          erro: /already|registered|exists/i.test(error?.message ?? '')
            ? 'Já existe um usuário com este e-mail.'
            : 'Não foi possível criar o usuário.',
        },
        422,
      );

    const base = slugify(nome) || 'corretor';
    const { data: existentes } = await servico
      .from('corretores')
      .select('id')
      .like('id', `${base}%`);
    const usados = new Set((existentes ?? []).map((c: { id: string }) => c.id));
    let corretorId = base;
    for (let n = 2; usados.has(corretorId); n++) corretorId = `${base}-${n}`;

    const { error: erroCorretor } = await servico.from('corretores').insert({
      id: corretorId,
      nome,
      creci: String(corpo.creci ?? '').trim() || 'A_DEFINIR',
      whatsapp: whatsapp(corpo.whatsapp),
    });
    const { error: erroPerfil } = await servico.from('perfis').insert({
      id: usuario.user.id,
      nome,
      email,
      papel,
      corretor_id: erroCorretor ? null : corretorId,
    });
    if (erroPerfil) {
      await servico.auth.admin.deleteUser(usuario.user.id);
      return responder({ erro: 'Não foi possível criar o perfil. Nada foi gravado.' }, 500);
    }
    return responder({
      ok: `${nome} já pode entrar no painel com o e-mail ${email} e a senha provisória. Peça para trocar a senha em "Minha conta".`,
    });
  }

  const id = String(corpo.id ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return responder({ erro: 'Usuário inválido' }, 422);

  if (acao === 'ativar' || acao === 'desativar') {
    if (id === eu.user?.id) return responder({ erro: 'Você não pode desativar a si mesmo.' }, 422);
    const ativo = acao === 'ativar';
    await servico.from('perfis').update({ ativo }).eq('id', id);
    await servico.auth.admin.updateUserById(id, { ban_duration: ativo ? 'none' : '876000h' });
    return responder({ ok: ativo ? 'Acesso reativado.' : 'Acesso desativado.' });
  }

  if (acao === 'senha') {
    const senha = String(corpo.senha ?? '');
    if (senha.length < 10) return responder({ erro: 'Mínimo de 10 caracteres.' }, 422);
    const { error } = await servico.auth.admin.updateUserById(id, { password: senha });
    if (error) return responder({ erro: 'Não foi possível trocar a senha.' }, 500);
    return responder({ ok: 'Senha provisória definida. Envie para a pessoa por um canal seguro.' });
  }

  return responder({ erro: 'Ação desconhecida' }, 400);
});
