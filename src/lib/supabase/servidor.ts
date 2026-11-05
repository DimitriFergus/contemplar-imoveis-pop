import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CHAVE_PUBLICA, SUPABASE_URL, TAG_IMOVEIS } from './config';

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
