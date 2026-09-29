/**
 * Pós-build da versão estática (GitHub Pages).
 * O Next grava os arquivos de pré-carregamento de rotas em subpastas
 * (ex.: simulador/__next.simulador/__PAGE__.txt), mas o navegador os pede com o
 * nome achatado (simulador/__next.simulador.__PAGE__.txt). Aqui criamos as cópias
 * achatadas para evitar 404 e manter a navegação instantânea entre páginas.
 */
import { copyFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(process.argv[2] ?? 'out');
let copias = 0;

function achatar(pastaPagina, pastaNext, partes) {
  for (const nome of readdirSync(pastaNext)) {
    const atual = path.join(pastaNext, nome);
    if (statSync(atual).isDirectory()) achatar(pastaPagina, atual, [...partes, nome]);
    else {
      copyFileSync(atual, path.join(pastaPagina, [...partes, nome].join('.')));
      copias++;
    }
  }
}

function percorrer(pasta) {
  for (const nome of readdirSync(pasta)) {
    const atual = path.join(pasta, nome);
    if (!statSync(atual).isDirectory()) continue;
    if (nome.startsWith('__next.')) achatar(pasta, atual, [nome]);
    else percorrer(atual);
  }
}

percorrer(raiz);
// Sem Jekyll: o GitHub Pages ignoraria as pastas que começam com "_" (como _next).
writeFileSync(path.join(raiz, '.nojekyll'), '');
console.log(`✔ ${copias} arquivos de pré-carregamento ajustados; .nojekyll criado.`);
