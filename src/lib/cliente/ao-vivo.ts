import { COLUNAS_IMOVEL, linhaParaImovel } from '@/lib/repositorio/linha';
import { paraResumo } from '@/lib/repositorio/resumo';
import { clienteAnonimo } from '@/lib/supabase/anonimo';
import type { LinhaImovel } from '@/lib/supabase/tipos';
import type { Corretor, Imovel } from '@/types';
import type { ResumoComFotos } from './resumos';

/**
 * Dados ao vivo para a versão estática do site (GitHub Pages): o navegador lê do Supabase
 * com a chave pública. As regras do banco só deixam ver imóveis que não são rascunho.
 */

export async function imoveisAoVivo(): Promise<ResumoComFotos[]> {
  const { data, error } = await clienteAnonimo()
    .from('imoveis')
    .select(COLUNAS_IMOVEL)
    .neq('status', 'rascunho')
    .order('codigo');
  if (error) throw new Error(error.message);
  return (data as LinhaImovel[]).map((l) => {
    const imovel = linhaParaImovel(l);
    return { ...paraResumo(imovel), fotos: imovel.fotos };
  });
}

export async function imovelAoVivo(
  slug: string,
): Promise<{ imovel: Imovel; corretor: Corretor | null } | null> {
  const supabase = clienteAnonimo();
  const { data } = await supabase
    .from('imoveis')
    .select(COLUNAS_IMOVEL)
    .eq('slug', slug)
    .neq('status', 'rascunho')
    .maybeSingle<LinhaImovel>();
  if (!data) return null;
  const { data: corretor } = await supabase
    .from('corretores')
    .select('id, nome, creci, whatsapp')
    .eq('id', data.corretor_id)
    .maybeSingle<Corretor>();
  return { imovel: linhaParaImovel(data), corretor };
}
