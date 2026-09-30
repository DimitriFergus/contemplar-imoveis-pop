import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { SUPABASE_CHAVE_PUBLICA, SUPABASE_URL, TAG_IMOVEIS } from './config';

/**
 * Cliente com a sessão de quem está logado (lê/grava cookies). Tudo passa pelas regras de
 * RLS do banco: um corretor nunca enxerga dados de outro, mesmo que o código peça.
 */
export async function clienteDaSessao() {
  const armazenamento = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_CHAVE_PUBLICA, {
    cookies: {
      getAll: () => armazenamento.getAll(),
      setAll(lista) {
        try {
          for (const { name, value, options } of lista) armazenamento.set(name, value, options);
        } catch {
          // Chamado de um Server Component: o proxy renova os cookies na próxima requisição.
        }
      },
    },
  });
}

/**
 * Cliente anônimo do site público: sem sessão, só enxerga imóveis que não são rascunho.
 * As respostas ficam em cache com a etiqueta "imoveis", invalidada quando o painel salva.
 */
export function clientePublico() {
  return createClient(SUPABASE_URL, SUPABASE_CHAVE_PUBLICA, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (entrada, init) =>
        fetch(entrada, {
          ...init,
          cache: 'force-cache',
          next: { revalidate: 3600, tags: [TAG_IMOVEIS] },
        }),
    },
  });
}

/**
 * Cliente com a chave secreta: ignora RLS. Uso restrito ao servidor, para gravar leads do
 * site e para o admin criar usuários. Nunca exponha SUPABASE_SECRET_KEY no navegador.
 */
export function clienteServico() {
  const chave = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) throw new Error('SUPABASE_SECRET_KEY não configurada');
  return createClient(SUPABASE_URL, chave, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function servicoConfigurado(): boolean {
  return Boolean(process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY);
}
