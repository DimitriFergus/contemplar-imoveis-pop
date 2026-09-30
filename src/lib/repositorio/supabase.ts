import 'server-only';
import { cache } from 'react';
import { corretorSchema } from '@/lib/schemas/imovel';
import { clientePublico } from '@/lib/supabase/servidor';
import type { LinhaImovel } from '@/lib/supabase/tipos';
import type { Corretor, Imovel } from '@/types';
import { linhaParaImovelValido } from './converter';
import { criarRepositorioEmMemoria } from './memoria';

import { COLUNAS_IMOVEL } from './linha';

/**
 * Implementação Supabase: lê os imóveis publicados, reservados e vendidos com a chave pública
 * (as regras do banco escondem os rascunhos) e reaproveita as mesmas regras de busca.
 */
const carregar = cache(async () => {
  const supabase = clientePublico();
  const [imoveis, corretores] = await Promise.all([
    supabase.from('imoveis').select(COLUNAS_IMOVEL).neq('status', 'rascunho').order('codigo'),
    supabase.from('corretores').select('id, nome, creci, whatsapp, foto'),
  ]);
  if (imoveis.error) throw new Error(`Supabase (imóveis): ${imoveis.error.message}`);
  if (corretores.error) throw new Error(`Supabase (corretores): ${corretores.error.message}`);
  return {
    imoveis: (imoveis.data as LinhaImovel[])
      .map(linhaParaImovelValido)
      .filter((i): i is Imovel => i !== null),
    corretores: corretores.data.flatMap((c): Corretor[] => {
      const r = corretorSchema.safeParse({ ...c, foto: c.foto ?? undefined });
      return r.success ? [r.data] : [];
    }),
  };
});

export const repositorioSupabase = criarRepositorioEmMemoria(carregar);
