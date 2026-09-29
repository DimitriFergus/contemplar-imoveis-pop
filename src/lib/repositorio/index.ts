import 'server-only';
import { repositorioLocal } from './local';
import type { RepositorioImoveis } from './tipos';

/** Ponto único de troca da fonte de dados (Fase 2: Supabase/CMS). */
export const repositorio: RepositorioImoveis = repositorioLocal;

export type { BairroComTotal, RepositorioImoveis, ResultadoBusca } from './tipos';
