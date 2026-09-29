/**
 * Baixa e otimiza as fotos dos imóveis FICTÍCIOS de demonstração, a partir de
 * `dados/fotos-exemplo.json` (todas com licença CC0 / domínio público, via Openverse).
 * Grava em public/imoveis/<CODIGO>/01.jpg, 02.jpg... e atualiza public/imoveis/CREDITOS.md.
 *
 * Uso: npm run fotos-exemplo            (baixa só o que falta)
 *      npm run fotos-exemplo -- --forcar (baixa tudo de novo)
 *
 * Coerência: cada imóvel tem fotos do mesmo tipo (apartamento → fachada de prédio e
 * interiores de apartamento; casa → fachada de casa, interiores e quintal; etc.).
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const RAIZ = path.resolve(import.meta.dirname, '..');
const PASTA = path.join(RAIZ, 'public', 'imoveis');
const LARGURA = 1280;

interface FotoExemplo {
  papel: string;
  arquivoOrigem: string;
  titulo: string;
  autor: string;
  pagina: string;
  fonte: string;
  licenca: string;
}

async function baixar(url: string): Promise<Buffer> {
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'contemplar-site/1.0 (fotos de exemplo CC0)' },
    });
    if (resp.ok) return Buffer.from(await resp.arrayBuffer());
    await new Promise((r) => setTimeout(r, 1500 * tentativa));
  }
  throw new Error(`Falha ao baixar ${url}`);
}

async function main() {
  const forcar = process.argv.includes('--forcar');
  const manifesto = JSON.parse(
    await readFile(path.join(RAIZ, 'dados', 'fotos-exemplo.json'), 'utf8'),
  ) as {
    imoveis: Record<string, FotoExemplo[]>;
  };
  const cache = new Map<string, Buffer>();
  let baixadas = 0;

  for (const [codigo, fotos] of Object.entries(manifesto.imoveis)) {
    const pasta = path.join(PASTA, codigo);
    await mkdir(pasta, { recursive: true });
    // Remove as ilustrações antigas (SVG) e fotos que não fazem mais parte do conjunto.
    const esperados = new Set(fotos.map((_, i) => `${String(i + 1).padStart(2, '0')}.jpg`));
    for (const arq of await readdir(pasta))
      if (!esperados.has(arq)) await rm(path.join(pasta, arq));

    for (const [i, f] of fotos.entries()) {
      const destino = path.join(pasta, `${String(i + 1).padStart(2, '0')}.jpg`);
      if (!forcar && existsSync(destino)) continue;
      let original = cache.get(f.arquivoOrigem);
      if (!original) {
        original = await baixar(f.arquivoOrigem);
        cache.set(f.arquivoOrigem, original);
      }
      await sharp(original)
        .rotate()
        .resize({
          width: LARGURA,
          height: Math.round((LARGURA * 2) / 3),
          fit: 'cover',
          withoutEnlargement: false,
        })
        .jpeg({ quality: 76, mozjpeg: true, progressive: true })
        .toFile(destino);
      baixadas++;
    }
  }

  // Créditos (CC0 não exige atribuição, mas registramos a origem de cada foto).
  const linhas = Object.entries(manifesto.imoveis).flatMap(([codigo, fotos]) =>
    fotos.map(
      (f, i) =>
        `| ${codigo}/${String(i + 1).padStart(2, '0')}.jpg | ${f.papel} | ${f.autor.replace(/\|/g, '/')} | [${f.fonte}](${f.pagina}) | ${f.licenca} |`,
    ),
  );
  await writeFile(
    path.join(PASTA, 'CREDITOS.md'),
    `# Créditos das imagens\n\nAs fotos dos imóveis de demonstração (CP-0001 a CP-0024) são **imagens ilustrativas** de bancos de imagens com licença **CC0 (domínio público)**, obtidas pelo catálogo [Openverse](https://openverse.org). Não retratam os imóveis anunciados, que são fictícios. O uso comercial é livre; registramos a origem de cada foto abaixo.\n\nAo adicionar fotos reais, registre aqui a autoria e a autorização de cada conjunto.\n\n| Arquivo | Ambiente | Autor | Origem | Licença |\n|---|---|---|---|---|\n${linhas.join('\n')}\n`,
  );
  console.log(`✔ ${baixadas} fotos baixadas/otimizadas; CREDITOS.md atualizado.`);
}

main().catch((e) => {
  console.error('✖', e);
  process.exit(1);
});
