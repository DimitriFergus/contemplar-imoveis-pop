import { BASE_PATH } from '@/config/site';

/** Caminho de arquivo em /public com o prefixo do site (necessário quando há basePath). */
export function caminhoPublico(caminho: string): string {
  if (!caminho.startsWith('/') || caminho.startsWith('//')) return caminho;
  return `${BASE_PATH}${caminho}`;
}
