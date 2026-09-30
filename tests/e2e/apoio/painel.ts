/**
 * Apoio aos testes do painel: cria e remove contas de teste direto no Supabase (chave secreta)
 * e calcula códigos do app autenticador (TOTP, RFC 6238) para testar o MFA do admin.
 */
import { createHmac, randomBytes } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const CHAVE_PUBLICA =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  '';
const CHAVE_SECRETA =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export const supabaseDisponivel = Boolean(URL_SUPABASE && CHAVE_PUBLICA && CHAVE_SECRETA);

export function servico(): SupabaseClient {
  return createClient(URL_SUPABASE, CHAVE_SECRETA, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface ContaTeste {
  id: string;
  email: string;
  senha: string;
  nome: string;
  papel: 'admin' | 'corretor';
  corretorId: string | null;
}

const PREFIXO = 'e2e-painel';

export async function criarConta(papel: 'admin' | 'corretor', sufixo: string): Promise<ContaTeste> {
  const s = servico();
  const email = `${PREFIXO}-${sufixo}-${Date.now()}@teste.contemplar.dev`;
  const senha = `T${randomBytes(12).toString('base64url')}9!`;
  const nome = `Teste ${sufixo.toUpperCase()}`;
  const { data, error } = await s.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser: ${error?.message}`);
  let corretorId: string | null = null;
  if (papel === 'corretor') {
    corretorId = `${PREFIXO}-${sufixo}-${Date.now()}`;
    const r = await s.from('corretores').insert({ id: corretorId, nome, creci: 'TESTE' });
    if (r.error) throw new Error(`corretor: ${r.error.message}`);
  }
  const r = await s
    .from('perfis')
    .insert({ id: data.user.id, nome, email, papel, corretor_id: corretorId });
  if (r.error) throw new Error(`perfil: ${r.error.message}`);
  return { id: data.user.id, email, senha, nome, papel, corretorId };
}

/** Remove tudo o que os testes criaram (imóveis, fotos, leads, contas e corretores). */
export async function limparContas(contas: ContaTeste[]) {
  const s = servico();
  const corretores = contas.map((c) => c.corretorId).filter((c): c is string => c !== null);
  if (corretores.length) {
    const { data: imoveis } = await s.from('imoveis').select('id').in('corretor_id', corretores);
    for (const { id } of imoveis ?? []) {
      const { data: arquivos } = await s.storage.from('imoveis').list(id);
      if (arquivos?.length)
        await s.storage.from('imoveis').remove(arquivos.map((a) => `${id}/${a.name}`));
    }
    await s.from('leads').delete().in('corretor_id', corretores);
    await s.from('imoveis').delete().in('corretor_id', corretores);
  }
  for (const c of contas) await s.auth.admin.deleteUser(c.id);
  if (corretores.length) await s.from('corretores').delete().in('id', corretores);
}

function base32(segredo: string): Buffer {
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of segredo.replace(/=+$/, '').toUpperCase())
    bits += alfabeto.indexOf(c).toString(2).padStart(5, '0');
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

/** Código de 6 dígitos que o app autenticador mostraria agora. */
export function codigoTotp(segredo: string, momento = Date.now()): string {
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(Math.floor(momento / 1000 / 30)));
  const hmac = createHmac('sha1', base32(segredo)).update(contador).digest();
  const deslocamento = (hmac.at(-1) ?? 0) & 0xf;
  const numero = (hmac.readUInt32BE(deslocamento) & 0x7fffffff) % 1_000_000;
  return String(numero).padStart(6, '0');
}
