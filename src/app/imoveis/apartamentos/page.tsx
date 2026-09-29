import { criarPaginaCategoria } from '@/components/busca/categorias';

const { generateMetadata, Pagina } = criarPaginaCategoria('apartamento');

export { generateMetadata };
export default Pagina;
