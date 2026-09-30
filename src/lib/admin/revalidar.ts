import 'server-only';
import { revalidatePath, revalidateTag } from 'next/cache';
import { TAG_IMOVEIS } from '@/lib/supabase/config';

/**
 * Atualiza o site público na hora (revalidação sob demanda) depois de salvar no painel:
 * dados em cache, todas as páginas, a lista usada no navegador e o sitemap.
 */
export function revalidarSitePublico() {
  revalidateTag(TAG_IMOVEIS, { expire: 0 });
  revalidatePath('/', 'layout');
  revalidatePath('/dados/resumos.json');
  revalidatePath('/sitemap.xml');
}
