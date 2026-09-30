import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_CHAVE_PUBLICA, SUPABASE_CONFIGURADO, SUPABASE_URL } from '@/lib/supabase/config';

/**
 * Painel /admin: renova a sessão do Supabase (cookies) a cada acesso e manda quem não está
 * logado para a tela de entrada. É só uma checagem otimista: cada página e ação do painel
 * confere a sessão de novo no servidor (src/lib/admin/sessao.ts) e o banco aplica RLS.
 */
export async function proxy(request: NextRequest) {
  if (!SUPABASE_CONFIGURADO) return NextResponse.next();

  let resposta = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_CHAVE_PUBLICA, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(lista) {
        for (const { name, value } of lista) request.cookies.set(name, value);
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of lista) resposta.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const publica = request.nextUrl.pathname === '/admin/entrar';
  if (!data?.claims && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/entrar';
    url.search = '';
    return NextResponse.redirect(url);
  }
  resposta.headers.set('X-Robots-Tag', 'noindex, nofollow');
  resposta.headers.set('Cache-Control', 'private, no-store');
  return resposta;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
