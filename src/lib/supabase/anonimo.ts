import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CHAVE_PUBLICA, SUPABASE_URL } from './config';

let cliente: SupabaseClient | null = null;

/**
 * Cliente público do navegador, sem login: lê imóveis publicados e envia leads pela função
 * registrar_lead. Usado na versão estática do site (GitHub Pages).
 */
export function clienteAnonimo(): SupabaseClient {
  cliente ??= createClient(SUPABASE_URL, SUPABASE_CHAVE_PUBLICA, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return cliente;
}
