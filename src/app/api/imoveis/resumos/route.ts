import { repositorio } from '@/lib/repositorio';

const ID_VALIDO = /^cp-\d{4}$/;

/** Resumos de imóveis por id (favoritos e comparador, que ficam salvos no navegador). */
export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get('ids') ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => ID_VALIDO.test(s))
    .slice(0, 50);
  const imoveis = await repositorio.obterResumosPorIds(ids);
  return Response.json(
    { imoveis },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
