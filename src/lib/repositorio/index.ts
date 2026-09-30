import 'server-only';
import { SUPABASE_CONFIGURADO } from '@/lib/supabase/config';
import { repositorioLocal } from './local';
import { repositorioSupabase } from './supabase';
import type { RepositorioImoveis } from './tipos';

/**
 * Ponto único de troca da fonte de dados: Supabase quando configurado (painel /admin);
 * senão, os arquivos gerados a partir de dados/imoveis.csv (GitHub Pages e desenvolvimento).
 */
export const repositorio: RepositorioImoveis = SUPABASE_CONFIGURADO
  ? repositorioSupabase
  : repositorioLocal;

export type { BairroComTotal, RepositorioImoveis, ResultadoBusca } from './tipos';
