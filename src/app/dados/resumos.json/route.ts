import { repositorio } from '@/lib/repositorio';

/**
 * Resumos de todos os imóveis, gerado no build como arquivo estático.
 * Usado no navegador para favoritos, comparador e contagem ao vivo dos filtros.
 */
export const dynamic = 'force-static';

export async function GET() {
  const imoveis = await repositorio.listarResumos();
  return Response.json({ imoveis });
}
