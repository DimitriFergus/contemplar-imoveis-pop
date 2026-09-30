import { createClient } from '@supabase/supabase-js';
import { revalidarSitePublico } from '@/lib/admin/revalidar';
import { SUPABASE_CHAVE_PUBLICA, SUPABASE_CONFIGURADO, SUPABASE_URL } from '@/lib/supabase/config';

/**
 * Versão com servidor (Vercel): o painel chama esta rota depois de salvar, e o site público
 * é atualizado na hora. Só aceita quem é da equipe (token do Supabase + perfil ativo).
 */
export async function POST(request: Request) {
  if (!SUPABASE_CONFIGURADO) return Response.json({ ok: false }, { status: 404 });
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return Response.json({ ok: false }, { status: 401 });
  const supabase = createClient(SUPABASE_URL, SUPABASE_CHAVE_PUBLICA, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data } = await supabase.auth.getUser(token);
  if (!data.user) return Response.json({ ok: false }, { status: 401 });
  const { data: perfil } = await supabase
    .from('perfis')
    .select('ativo')
    .eq('id', data.user.id)
    .maybeSingle();
  if (!perfil?.ativo) return Response.json({ ok: false }, { status: 403 });
  revalidarSitePublico();
  return Response.json({ ok: true });
}
