import 'server-only';
import { z } from 'zod';
import { corretorSchema, imovelSchema } from '@/lib/schemas/imovel';
import dadosCorretores from '@/data/corretores.json';
import dadosImoveis from '@/data/imoveis.json';
import { criarRepositorioEmMemoria } from './memoria';

/**
 * Implementação local: lê o JSON gerado por `npm run importar` a partir de `dados/imoveis.csv`.
 * Os dados são validados novamente aqui para nunca publicar um imóvel inconsistente.
 * Usada no GitHub Pages e quando o Supabase não está configurado.
 */
const dados = {
  imoveis: z.array(imovelSchema).parse(dadosImoveis),
  corretores: z.array(corretorSchema).parse(dadosCorretores),
};

export const repositorioLocal = criarRepositorioEmMemoria(async () => dados);
