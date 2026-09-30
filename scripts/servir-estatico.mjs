/**
 * Servidor mínimo para testar a exportação estática como no GitHub Pages:
 * serve a pasta `out`, entende pastas com index.html e responde 404.html para o resto.
 *
 * Uso: node scripts/servir-estatico.mjs out 3200
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';

const raiz = path.resolve(process.argv[2] ?? 'out');
const porta = Number(process.argv[3] ?? 3200);
const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
};

createServer((req, res) => {
  const pedido = new URL(req.url ?? '/', 'http://x');
  const url = decodeURIComponent(pedido.pathname);
  let arquivo = path.join(raiz, url);
  if (!arquivo.startsWith(raiz)) arquivo = raiz;
  if (existsSync(arquivo) && statSync(arquivo).isDirectory()) {
    if (!url.endsWith('/')) {
      res.writeHead(301, { Location: `${url}/${pedido.search}` });
      return res.end();
    }
    arquivo = path.join(arquivo, 'index.html');
  }
  let status = 200;
  if (!existsSync(arquivo)) {
    arquivo = path.join(raiz, '404.html');
    status = 404;
  }
  res.writeHead(status, {
    'Content-Type': tipos[path.extname(arquivo)] ?? 'application/octet-stream',
  });
  createReadStream(arquivo).pipe(res);
}).listen(porta, () => console.log(`Servindo ${raiz} em http://localhost:${porta}`));
