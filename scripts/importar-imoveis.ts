/**
 * Importa a planilha `dados/imoveis.csv` (e `dados/corretores.csv`), valida cada linha e gera
 * `src/data/imoveis.json` e `src/data/corretores.json`, que o site lê.
 *
 * Uso: npm run importar
 *
 * - Fotos: coloque em public/imoveis/<CODIGO>/01.jpg, 02.jpg... (também aceita .png, .webp, .avif, .svg).
 *   O script associa automaticamente, na ordem do número, e reduz fotos muito grandes
 *   (guardando o original em dados/fotos-originais/).
 * - Se houver qualquer erro, nada é gravado e o site continua com os dados anteriores.
 */
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { z } from 'zod';
import { converterLinha } from '../src/lib/importacao/imovel-csv';
import { corretorSchema } from '../src/lib/schemas/imovel';
import { lerCSVComoObjetos } from '../src/lib/utils/csv';
import type { Corretor, Imovel } from '../src/types';

const RAIZ = path.resolve(import.meta.dirname, '..');
const ARQ_IMOVEIS = path.join(RAIZ, 'dados', 'imoveis.csv');
const ARQ_CORRETORES = path.join(RAIZ, 'dados', 'corretores.csv');
const PASTA_FOTOS = path.join(RAIZ, 'public', 'imoveis');
const PASTA_ORIGINAIS = path.join(RAIZ, 'dados', 'fotos-originais');
const SAIDA = path.join(RAIZ, 'src', 'data');

const EXTENSOES_FOTO = /^(\d{2,3})\.(jpe?g|png|webp|avif|svg)$/i;
const LARGURA_MAXIMA = 1600;
const TAMANHO_MAXIMO_BYTES = 400 * 1024;

async function otimizarFoto(codigo: string, arquivo: string): Promise<string | null> {
  const caminho = path.join(PASTA_FOTOS, codigo, arquivo);
  if (/\.svg$/i.test(arquivo)) return null;
  const [info, meta] = await Promise.all([stat(caminho), sharp(caminho).metadata()]);
  if ((meta.width ?? 0) <= LARGURA_MAXIMA && info.size <= TAMANHO_MAXIMO_BYTES) return null;

  const backup = path.join(PASTA_ORIGINAIS, codigo);
  await mkdir(backup, { recursive: true });
  await copyFile(caminho, path.join(backup, arquivo));

  let pipeline = sharp(caminho)
    .rotate()
    .resize({ width: LARGURA_MAXIMA, withoutEnlargement: true });
  if (/\.jpe?g$/i.test(arquivo)) pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
  else if (/\.png$/i.test(arquivo)) pipeline = pipeline.png({ compressionLevel: 9, palette: true });
  else if (/\.webp$/i.test(arquivo)) pipeline = pipeline.webp({ quality: 80 });
  else pipeline = pipeline.avif({ quality: 60 });
  const buffer = await pipeline.toBuffer();
  await writeFile(caminho, buffer);
  return `${codigo}/${arquivo}: ${Math.round(info.size / 1024)} KB → ${Math.round(buffer.length / 1024)} KB`;
}

async function listarFotos(codigo: string): Promise<string[]> {
  const pasta = path.join(PASTA_FOTOS, codigo);
  if (!existsSync(pasta)) return [];
  const arquivos = (await readdir(pasta)).filter((a) => EXTENSOES_FOTO.test(a));
  return arquivos.sort(
    (a, b) => Number(a.match(EXTENSOES_FOTO)?.[1]) - Number(b.match(EXTENSOES_FOTO)?.[1]),
  );
}

async function importarCorretores(erros: string[]): Promise<Corretor[]> {
  if (!existsSync(ARQ_CORRETORES)) {
    erros.push('Arquivo dados/corretores.csv não encontrado');
    return [];
  }
  const linhas = lerCSVComoObjetos(await readFile(ARQ_CORRETORES, 'utf8'));
  const corretores: Corretor[] = [];
  for (const { linha, dados } of linhas) {
    const r = corretorSchema.safeParse({ ...dados, foto: dados.foto || undefined });
    if (r.success) corretores.push(r.data);
    else
      for (const issue of r.error.issues)
        erros.push(
          `corretores.csv, linha ${linha}: campo '${String(issue.path[0])}' ${issue.message}`,
        );
  }
  return corretores;
}

async function main() {
  const erros: string[] = [];
  const avisos: string[] = [];
  const otimizadas: string[] = [];

  if (!existsSync(ARQ_IMOVEIS)) {
    console.error(
      '✖ Arquivo dados/imoveis.csv não encontrado. Rode "npm run gerar-exemplos" ou crie a planilha a partir de dados/MODELO_IMOVEIS.csv.',
    );
    process.exit(1);
  }

  const corretores = await importarCorretores(erros);
  const idsCorretores = new Set(corretores.map((c) => c.id));
  const linhas = lerCSVComoObjetos(await readFile(ARQ_IMOVEIS, 'utf8'));
  const imoveis: Imovel[] = [];
  const codigos = new Map<string, number>();
  const slugs = new Map<string, number>();

  for (const { linha, dados } of linhas) {
    const codigo = (dados.codigo ?? '').toUpperCase();
    const fotos = codigo ? await listarFotos(codigo) : [];
    for (const foto of fotos) {
      try {
        const r = await otimizarFoto(codigo, foto);
        if (r) otimizadas.push(r);
      } catch (e) {
        avisos.push(
          `Linha ${linha}, ${codigo}: não foi possível otimizar a foto ${foto} (${(e as Error).message})`,
        );
      }
    }
    const r = converterLinha(
      dados,
      linha,
      fotos.map((f) => `/imoveis/${codigo}/${f}`),
    );
    erros.push(...r.erros);
    avisos.push(...r.avisos);
    if (!r.imovel) continue;

    const i = r.imovel;
    if (codigos.has(i.codigo))
      erros.push(
        `Linha ${linha}, ${i.codigo}: código repetido (já usado na linha ${codigos.get(i.codigo)})`,
      );
    if (slugs.has(i.slug))
      erros.push(
        `Linha ${linha}, ${i.codigo}: título + código geram endereço repetido (linha ${slugs.get(i.slug)})`,
      );
    if (!idsCorretores.has(i.corretorResponsavelId))
      erros.push(
        `Linha ${linha}, ${i.codigo}: corretor '${i.corretorResponsavelId}' não existe em dados/corretores.csv`,
      );
    codigos.set(i.codigo, linha);
    slugs.set(i.slug, linha);
    imoveis.push(i);
  }

  console.log('\n=== Importação de imóveis ===');
  console.log(
    `Linhas lidas: ${linhas.length} | Imóveis válidos: ${imoveis.length} | Corretores: ${corretores.length}`,
  );
  if (otimizadas.length) {
    console.log(`\nFotos otimizadas (${otimizadas.length}):`);
    for (const o of otimizadas) console.log(`  • ${o}`);
  }
  if (avisos.length) {
    console.log(`\n⚠ Avisos (${avisos.length}) — o site funciona, mas vale corrigir:`);
    for (const a of avisos) console.log(`  • ${a}`);
  }
  if (erros.length) {
    console.error(
      `\n✖ Erros (${erros.length}) — nada foi gravado. Corrija a planilha e rode de novo:`,
    );
    for (const e of erros) console.error(`  • ${e}`);
    process.exit(1);
  }

  // Validação final (garante que o JSON gerado é o mesmo que o site espera).
  z.array(corretorSchema).parse(corretores);
  await mkdir(SAIDA, { recursive: true });
  await writeFile(path.join(SAIDA, 'imoveis.json'), JSON.stringify(imoveis, null, 2) + '\n');
  await writeFile(path.join(SAIDA, 'corretores.json'), JSON.stringify(corretores, null, 2) + '\n');
  console.log(`\n✔ Tudo certo! ${imoveis.length} imóveis gravados em src/data/imoveis.json\n`);
}

main().catch((e) => {
  console.error('✖ Falha inesperada na importação:', e);
  process.exit(1);
});
