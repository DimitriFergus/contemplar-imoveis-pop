import { repositorio } from '@/lib/repositorio';

/**
 * Resumos de todos os imóveis, gerado no build como arquivo estático.
 * Usado no navegador para favoritos, comparação (com as fotos) e contagem ao vivo dos filtros.
 */
export const dynamic = 'force-static';

export async function GET() {
  const [resumos, completos] = await Promise.all([repositorio.listarResumos(), repositorio.listar()]);
  const fotos = new Map(completos.map((i) => [i.id, i.fotos]));
  const imoveis = resumos.map((r) => ({ ...r, fotos: fotos.get(r.id) ?? [] }));
  return Response.json({ imoveis });
}
