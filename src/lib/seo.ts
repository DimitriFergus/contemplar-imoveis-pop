import type { Metadata } from 'next';
import { CIDADE_BASE, SITE } from '@/config/site';
import { chipsAtivos, lerFiltros } from '@/lib/busca/filtros';

type Params = Record<string, string | string[] | undefined>;

/**
 * Metadados de páginas de listagem: canonical sem filtros (evita conteúdo duplicado) e
 * noindex para combinações de filtros, mantendo a paginação indexável.
 */
export function metadadosListagem(
  caminho: string,
  params: Params,
  titulo: string,
  descricao: string,
): Metadata {
  const filtros = lerFiltros(params);
  const pagina = filtros.pagina ?? 1;
  const temFiltros =
    chipsAtivos(filtros).length > 0 || Boolean(filtros.ordem) || filtros.visao === 'mapa';
  const canonical = pagina > 1 ? `${caminho}?pagina=${pagina}` : caminho;
  const tituloFinal = pagina > 1 ? `${titulo} — página ${pagina}` : titulo;
  return {
    title: tituloFinal,
    description: descricao,
    alternates: { canonical },
    robots: temFiltros ? { index: false, follow: true } : undefined,
    openGraph: { title: `${tituloFinal} | ${SITE.nome}`, description: descricao, url: canonical },
  };
}

export const NOME_CIDADE = CIDADE_BASE;
