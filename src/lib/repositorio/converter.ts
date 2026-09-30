import { imovelSchema } from '@/lib/schemas/imovel';
import type { LinhaImovel } from '@/lib/supabase/tipos';
import type { Imovel } from '@/types';
import { linhaParaImovel } from './linha';

export {
  CAMPOS_FORA_DE_DADOS,
  imovelParaDados,
  linhaParaImovel,
  statusDoPainel,
  statusPublico,
} from './linha';

/** Converte e valida com o mesmo schema do site; devolve null (e registra) se estiver inválido. */
export function linhaParaImovelValido(l: LinhaImovel): Imovel | null {
  const r = imovelSchema.safeParse(linhaParaImovel(l));
  if (r.success) return r.data;
  console.error(
    `[repositorio] imóvel ${l.codigo} ignorado por dados inválidos:`,
    r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
  );
  return null;
}
