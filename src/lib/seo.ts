import type { Metadata } from 'next';
import { CIDADE_BASE, MODO_ESTATICO, SITE } from '@/config/site';
import { chipsAtivos, lerFiltros } from '@/lib/busca/filtros';

type Params = Record<string, string | string[] | undefined>;

/**
 * Metadados de páginas de listagem: canonical sem filtros (evita conteúdo duplicado) e
 * noindex para combinações de filtros, mantendo a paginação indexável.
 */
export async function metadadosListagem(
  caminho: string,
  params: Promise<Params>,
  titulo: string,
  descricao: string,
): Promise<Metadata> {
  // Na versão estática não há leitura da URL no servidor (página pré-gerada sem filtros).
  const filtros = lerFiltros(MODO_ESTATICO ? {} : await params);
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
