/**
 * Impressão digital dos dados públicos no Supabase (imóveis não rascunho + corretores).
 * O GitHub Actions compara com a publicada em /dados/versao.txt para só regerar o site
 * quando algo mudou no painel.
 *
 * Uso: node scripts/versao-dados.mjs            → imprime a versão atual do banco
 *      node scripts/versao-dados.mjs out        → grava out/dados/versao.txt
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !chave) {
  console.log('sem-supabase');
  process.exit(0);
}

async function ler(caminho) {
  const r = await fetch(`${url}/rest/v1/${caminho}`, {
    headers: { apikey: chave, Authorization: `Bearer ${chave}` },
  });
  if (!r.ok) throw new Error(`Supabase respondeu ${r.status} em ${caminho}`);
  return r.text();
}

const [imoveis, corretores] = await Promise.all([
  ler('imoveis?select=codigo,status,atualizado_em&status=neq.rascunho&order=codigo'),
  ler('corretores?select=id,nome,creci,whatsapp&order=id'),
]);
const versao = createHash('sha256').update(imoveis).update(corretores).digest('hex').slice(0, 16);

const destino = process.argv[2];
if (destino) {
  mkdirSync(path.join(destino, 'dados'), { recursive: true });
  writeFileSync(path.join(destino, 'dados', 'versao.txt'), versao);
}
console.log(versao);
