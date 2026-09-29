import { lerFiltros } from '@/lib/busca/filtros';
import { repositorio } from '@/lib/repositorio';

/** Total de imóveis para um conjunto de filtros (botão "Ver X imóveis"). */
export async function GET(request: Request) {
  const filtros = lerFiltros(new URL(request.url).searchParams);
  const total = await repositorio.contar(filtros);
  return Response.json(
    { total },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
