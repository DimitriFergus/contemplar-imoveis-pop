/**
 * Manutenção do banco Supabase (lê as chaves de .env.local).
 *
 *   npm run supabase:migrar            aplica as migrações SQL (supabase/migrations) e o seed
 *   npm run supabase:admin -- email "Nome"   cria o primeiro administrador
 *   npm run supabase:importar          envia para o banco os imóveis da planilha (dados/imoveis.csv)
 *                                      e as fotos de public/imoveis/<CÓDIGO>/ (convertidas para WebP)
 *   npm run supabase:importar -- --atualizar   também sobrescreve imóveis que já existem no banco
 *   npm run supabase:status            confere a conexão e conta os registros
 */
import { spawnSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { z } from 'zod';
import { imovelParaDados, statusDoPainel } from '../src/lib/repositorio/converter';
import { corretorSchema, imovelSchema } from '../src/lib/schemas/imovel';

const RAIZ = path.resolve(import.meta.dirname, '..');
if (existsSync(path.join(RAIZ, '.env.local'))) process.loadEnvFile(path.join(RAIZ, '.env.local'));

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const CHAVE_SECRETA =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const BUCKET = 'imoveis';
const LADO_MAXIMO = 1920;

function falhar(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

function cliente() {
  if (!URL_SUPABASE || !CHAVE_SECRETA)
    falhar(
      'Preencha NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no arquivo .env.local (veja docs/MANUAL_ADMIN.md).',
    );
  return createClient(URL_SUPABASE, CHAVE_SECRETA, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** A senha do banco pode ter símbolos: codifica só a parte da senha na URL de conexão. */
function urlBancoCodificada(bruta: string): string {
  const m = bruta.trim().match(/^(postgres(?:ql)?:\/\/)([^:/]+):(.*)@([^@]+)$/);
  if (!m) return bruta.trim();
  const [, protocolo, usuario, senha = '', resto] = m;
  let decodificada = senha;
  try {
    decodificada = decodeURIComponent(senha);
  } catch {
    // já estava crua
  }
  return `${protocolo}${usuario}:${encodeURIComponent(decodificada)}@${resto}`;
}

async function migrar() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) falhar('Preencha SUPABASE_DB_URL no .env.local (Connect → Session pooler).');
  console.log('→ Aplicando migrações em supabase/migrations…');
  const r = spawnSync(
    'npx',
    ['supabase', 'db', 'push', '--db-url', urlBancoCodificada(url), '--include-all', '--yes'],
    { cwd: RAIZ, stdio: 'inherit', shell: process.platform === 'win32' },
  );
  if (r.status !== 0) falhar('As migrações não foram aplicadas (veja a mensagem acima).');

  console.log('→ Aplicando seed (corretor de exemplo)…');
  const { error } = await cliente()
    .from('corretores')
    .upsert(
      { id: 'corretor-exemplo', nome: 'Equipe de corretores (exemplo)' },
      { onConflict: 'id', ignoreDuplicates: true },
    );
  if (error) falhar(`Seed: ${error.message}`);
  console.log('✔ Banco atualizado.');
}

async function criarAdmin(email?: string, nome?: string) {
  if (!email || !nome) falhar('Uso: npm run supabase:admin -- email@exemplo.com "Nome Completo"');
  const supabase = cliente();
  const senha = `${randomBytes(9).toString('base64url')}-${randomBytes(3).toString('hex')}`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });
  if (error || !data.user) falhar(`Não foi possível criar o usuário: ${error?.message}`);

  const { error: erroPerfil } = await supabase
    .from('perfis')
    .insert({ id: data.user.id, nome, email, papel: 'admin', corretor_id: null });
  if (erroPerfil) {
    await supabase.auth.admin.deleteUser(data.user.id);
    falhar(`Não foi possível criar o perfil: ${erroPerfil.message}`);
  }

  // A senha vai para um arquivo local (ignorado pelo git), nunca para o terminal/chat.
  const arquivo = path.join(RAIZ, 'ACESSO_ADMIN_PROVISORIO.txt');
  await writeFile(
    arquivo,
    [
      'Acesso provisório ao painel /admin — APAGUE ESTE ARQUIVO depois do primeiro acesso.',
      '',
      `E-mail: ${email}`,
      `Senha provisória: ${senha}`,
      '',
      'No primeiro acesso o painel pede para cadastrar um app autenticador (Google Authenticator,',
      'Microsoft Authenticator ou Authy). Depois troque a senha em "Minha conta".',
      '',
    ].join('\n'),
  );
  console.log(`✔ Administrador criado: ${email}`);
  console.log(`  A senha provisória foi gravada em ${path.basename(arquivo)} (fora do git).`);
}

async function listarFotos(codigo: string) {
  const pasta = path.join(RAIZ, 'public', 'imoveis', codigo);
  if (!existsSync(pasta)) return [];
  return (await readdir(pasta))
    .filter((a) => /^\d{2,3}\.(jpe?g|png|webp|avif)$/i.test(a))
    .sort()
    .map((a) => path.join(pasta, a));
}

async function importar(atualizar: boolean) {
  const supabase = cliente();
  const imoveis = z
    .array(imovelSchema)
    .parse(JSON.parse(await readFile(path.join(RAIZ, 'src/data/imoveis.json'), 'utf8')));
  const corretores = z
    .array(corretorSchema)
    .parse(JSON.parse(await readFile(path.join(RAIZ, 'src/data/corretores.json'), 'utf8')));

  const { error: erroCorretores } = await supabase.from('corretores').upsert(
    corretores.map((c) => ({
      id: c.id,
      nome: c.nome,
      creci: c.creci,
      whatsapp: c.whatsapp,
      foto: c.foto ?? null,
    })),
    { onConflict: 'id' },
  );
  if (erroCorretores) falhar(`Corretores: ${erroCorretores.message}`);

  const { data: existentes, error: erroLista } = await supabase
    .from('imoveis')
    .select('id, codigo');
  if (erroLista) falhar(`Leitura dos imóveis: ${erroLista.message}`);
  const idPorCodigo = new Map((existentes ?? []).map((e) => [e.codigo as string, e.id as string]));

  let criados = 0;
  let atualizados = 0;
  let ignorados = 0;
  for (const imovel of imoveis) {
    const idExistente = idPorCodigo.get(imovel.codigo);
    if (idExistente && !atualizar) {
      ignorados++;
      continue;
    }
    const id = idExistente ?? randomUUID();

    // Fotos: WebP com no máximo 1920 px, na pasta do imóvel no Storage.
    const arquivos = await listarFotos(imovel.codigo);
    const fotos = [];
    for (const [n, arquivo] of arquivos.entries()) {
      const webp = await sharp(arquivo)
        .rotate()
        .resize({
          width: LADO_MAXIMO,
          height: LADO_MAXIMO,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();
      const caminho = `${id}/${String(n + 1).padStart(2, '0')}.webp`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(caminho, webp, {
          contentType: 'image/webp',
          upsert: true,
          cacheControl: '31536000',
        });
      if (error) falhar(`${imovel.codigo}, foto ${path.basename(arquivo)}: ${error.message}`);
      fotos.push({
        arquivo: supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl,
        alt: imovel.fotos[n]?.alt ?? `${imovel.titulo} – foto ${n + 1}`,
      });
    }

    const linha = {
      id,
      codigo: imovel.codigo,
      slug: imovel.slug,
      status: statusDoPainel(imovel.status),
      corretor_id: imovel.corretorResponsavelId,
      destaque: imovel.destaque,
      exemplo: imovel.exemplo,
      dados: imovelParaDados(imovel),
      fotos: fotos.length ? fotos : imovel.fotos,
      publicado_em: new Date(imovel.publicadoEm).toISOString(),
    };
    const { error } = await supabase.from('imoveis').upsert(linha, { onConflict: 'id' });
    if (error) falhar(`${imovel.codigo}: ${error.message}`);
    if (idExistente) atualizados++;
    else criados++;
    process.stdout.write(`  • ${imovel.codigo} (${fotos.length} fotos)\n`);
  }

  const { error: erroSeq } = await supabase.rpc('ajustar_sequencia_codigo');
  if (erroSeq) falhar(`Sequência de códigos: ${erroSeq.message}`);
  console.log(
    `\n✔ Importação concluída: ${criados} criados, ${atualizados} atualizados, ${ignorados} já existiam (use --atualizar para sobrescrever).`,
  );
}

async function status() {
  const supabase = cliente();
  for (const tabela of ['corretores', 'perfis', 'imoveis', 'leads', 'auditoria']) {
    const { count, error } = await supabase
      .from(tabela)
      .select('*', { count: 'exact', head: true });
    console.log(`  ${tabela.padEnd(11)} ${error ? `erro: ${error.message}` : count}`);
  }
}

const [comando, ...args] = process.argv.slice(2);
const acoes: Record<string, () => Promise<void>> = {
  migrar,
  admin: () => criarAdmin(args[0], args[1]),
  importar: () => importar(args.includes('--atualizar')),
  status,
};
const acao = comando ? acoes[comando] : undefined;
if (!acao) falhar(`Comando desconhecido. Use: ${Object.keys(acoes).join(', ')}`);
acao().catch((e) => falhar((e as Error).message));
