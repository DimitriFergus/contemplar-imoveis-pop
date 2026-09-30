'use client';

import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_CHAVE_PUBLICA, SUPABASE_URL } from './config';

let cliente: ReturnType<typeof createBrowserClient> | null = null;

/** Cliente do navegador (usa a sessão dos cookies). Usado para enviar fotos direto ao Storage. */
export function clienteNavegador() {
  cliente ??= createBrowserClient(SUPABASE_URL, SUPABASE_CHAVE_PUBLICA);
  return cliente;
}
