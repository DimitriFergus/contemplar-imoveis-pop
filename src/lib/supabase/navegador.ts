'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CHAVE_PUBLICA, SUPABASE_URL } from './config';

let cliente: SupabaseClient | null = null;

/** Cliente do navegador com a sessão de quem está logado no painel (guardada em cookies). */
export function clienteNavegador(): SupabaseClient {
  cliente ??= createBrowserClient(SUPABASE_URL, SUPABASE_CHAVE_PUBLICA);
  return cliente;
}
