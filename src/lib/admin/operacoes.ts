'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { BASE_PATH, MODO_ESTATICO } from '@/config/site';
import { COLUNAS_IMOVEL, imovelParaDados, linhaParaImovel } from '@/lib/repositorio/linha';
import { imovelFormularioSchema } from '@/lib/schemas/imovel';
import { BUCKET_FOTOS, caminhoDaFoto, urlPublicaFoto } from '@/lib/supabase/config';
import { clienteNavegador } from '@/lib/supabase/navegador';
import { ETAPAS_LEAD, type EtapaLead, type LinhaImovel } from '@/lib/supabase/tipos';
import { slugImovel } from '@/lib/utils/slug';
import type { Foto } from '@/types';
import type { SessaoPainel } from './sessao';

/**
 * Operações do painel (rodam no navegador com a sessão de quem está logado).
 * O banco confere cada gravação pelas regras RLS: um corretor não altera o que não é dele,
 * mesmo que alguém modifique o código no navegador.
 */

export interface Resultado {
  ok?: string;
  erro?: string;
}

// ── Acesso ─────────────────────────────────────────────────────────────────
const entradaSchema = z.object({
  email: z.email('Informe um e-mail válido').trim().toLowerCase(),
  senha: z.string().min(6, 'Informe a senha'),
});

export async function entrar(email: string, senha: string): Promise<Resultado> {
  const r = entradaSchema.safeParse({ email, senha });
  if (!r.success) return { erro: r.error.issues[0]?.message ?? 'Confira os dados.' };
  const { error } = await clienteNavegador().auth.signInWithPassword({
    email: r.data.email,
    password: r.data.senha,
  });
  if (error)
    return {
      erro:
        error.status === 429
          ? 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
          : 'E-mail ou senha incorretos.',
    };
  return { ok: 'Entrou.' };
}

export async function sair() {
  await clienteNavegador().auth.signOut();
}

export interface CadastroMfa {
  fatorId: string;
  qrCode: string;
  segredo: string;
}

/** Começa o cadastro do app autenticador (TOTP): devolve o QR Code para escanear. */
export async function iniciarCadastroMfa(): Promise<CadastroMfa | { erro: string }> {
  const supabase = clienteNavegador();
  const { data: fatores } = await supabase.auth.mfa.listFactors();
  for (const f of fatores?.all ?? []) {
    if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `Contemplar ${new Date().toISOString().slice(0, 16)}`,
    issuer: 'Contemplar Imóveis',
  });
  if (error || !data) return { erro: 'Não foi possível gerar o QR Code. Tente de novo.' };
  return { fatorId: data.id, qrCode: data.totp.qr_code, segredo: data.totp.secret };
}

/** Confere o código de 6 dígitos e eleva a sessão para aal2. */
export async function confirmarCodigoMfa(codigo: string, fatorId?: string): Promise<Resultado> {
  const limpo = codigo.replace(/\s/g, '');
  if (!/^\d{6}$/.test(limpo)) return { erro: 'O código tem 6 números' };
  const supabase = clienteNavegador();
  let fator = fatorId;
  if (!fator) {
    const { data } = await supabase.auth.mfa.listFactors();
    fator = data?.totp[0]?.id;
  }
  if (!fator) return { erro: 'Nenhum app autenticador cadastrado.' };
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: fator, code: limpo });
  if (error) return { erro: 'Código incorreto ou vencido. Confira o app e tente de novo.' };
  return { ok: 'Confirmado.' };
}

export async function trocarSenha(senha: string, confirmacao: string): Promise<Resultado> {
  if (senha.length < 10) return { erro: 'A senha precisa ter pelo menos 10 caracteres' };
  if (senha !== confirmacao) return { erro: 'As senhas não conferem' };
  const { error } = await clienteNavegador().auth.updateUser({ password: senha });
  if (error) return { erro: 'Não foi possível trocar a senha. Use uma senha diferente da atual.' };
  return { ok: 'Senha alterada.' };
}

// ── Site público ───────────────────────────────────────────────────────────
/**
 * Avisa o site que os imóveis mudaram. Com servidor (Vercel), revalida as páginas na hora.
 * No GitHub Pages o site lê os dados ao vivo do banco, e as páginas estáticas são regeradas
 * pelo GitHub Actions (ver .github/workflows/pages.yml).
 */
async function avisarSite(supabase: SupabaseClient) {
  if (MODO_ESTATICO) return;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  await fetch(`${BASE_PATH}/api/revalidar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => undefined);
}

// ── Imóveis ────────────────────────────────────────────────────────────────
export type ResultadoSalvar =
  | { ok: true; id: string; codigo: string; slug: string }
  | { ok: false; mensagem: string; erros?: Record<string, string> };

function traduzirErro(mensagem?: string): string {
  if (!mensagem) return 'Não foi possível salvar.';
  if (/row-level security|permission denied/i.test(mensagem))
    return 'Você não tem permissão para alterar este imóvel.';
  if (/duplicate key.*slug/i.test(mensagem)) return 'Já existe um imóvel com este endereço.';
  return 'Não foi possível salvar. Tente de novo.';
}

export async function salvarImovel(
  sessao: SessaoPainel,
  id: string | null,
  entrada: unknown,
): Promise<ResultadoSalvar> {
  const { supabase, ehAdmin, perfil } = sessao;
  const r = imovelFormularioSchema.safeParse(entrada);
  if (!r.success) {
    const erros: Record<string, string> = {};
    for (const i of r.error.issues) erros[i.path.map(String).join('.') || 'geral'] ??= i.message;
    return { ok: false, mensagem: 'Confira os campos destacados.', erros };
  }
  const dadosForm = r.data;
  // Corretor só cadastra imóveis em seu próprio nome.
  const corretorId = ehAdmin ? dadosForm.corretorResponsavelId : perfil.corretor_id;
  if (!corretorId)
    return {
      ok: false,
      mensagem: 'Seu usuário não está ligado a um corretor. Peça ao administrador para ajustar.',
    };

  const colunas = {
    status: dadosForm.status,
    corretor_id: corretorId,
    destaque: dadosForm.destaque,
    fotos: dadosForm.fotos,
    dados: imovelParaDados(dadosForm),
  };

  if (id === null) {
    const { data: codigo, error: erroCodigo } = await supabase.rpc('proximo_codigo');
    if (erroCodigo || typeof codigo !== 'string')
      return { ok: false, mensagem: 'Não foi possível gerar o código do imóvel.' };
    const slug = slugImovel(dadosForm.titulo, codigo);
    const { data, error } = await supabase
      .from('imoveis')
      .insert({ ...colunas, codigo, slug })
      .select('id, codigo, slug')
      .single();
    if (error || !data) return { ok: false, mensagem: traduzirErro(error?.message) };
    await avisarSite(supabase);
    return { ok: true, ...data };
  }

  const { data: anterior } = await supabase
    .from('imoveis')
    .select('fotos')
    .eq('id', id)
    .maybeSingle<Pick<LinhaImovel, 'fotos'>>();
  if (!anterior) return { ok: false, mensagem: 'Imóvel não encontrado ou sem permissão.' };

  const { data, error } = await supabase
    .from('imoveis')
    .update(colunas)
    .eq('id', id)
    .select('id, codigo, slug')
    .maybeSingle();
  if (error || !data) return { ok: false, mensagem: traduzirErro(error?.message) };

  // Apaga do Storage as fotos que saíram do anúncio.
  const atuais = new Set(dadosForm.fotos.map((f) => f.arquivo));
  const removidas = anterior.fotos
    .filter((f) => !atuais.has(f.arquivo))
    .map((f) => caminhoDaFoto(f.arquivo))
    .filter((c): c is string => c !== null);
  if (removidas.length) await supabase.storage.from(BUCKET_FOTOS).remove(removidas);

  await avisarSite(supabase);
  return { ok: true, ...data };
}

/** Publica direto da pré-visualização, conferindo antes se o anúncio está completo. */
export async function publicarImovel(sessao: SessaoPainel, id: string): Promise<Resultado> {
  const { supabase } = sessao;
  const { data: linha } = await supabase
    .from('imoveis')
    .select(COLUNAS_IMOVEL)
    .eq('id', id)
    .maybeSingle<LinhaImovel>();
  if (!linha) return { erro: 'Imóvel não encontrado.' };
  const r = imovelFormularioSchema.safeParse({ ...linhaParaImovel(linha), status: 'publicado' });
  if (!r.success)
    return {
      erro: 'Faltam informações no anúncio. Volte, edite e salve.',
    };
  const { error } = await supabase.from('imoveis').update({ status: 'publicado' }).eq('id', id);
  if (error) return { erro: 'Não foi possível publicar. Tente de novo.' };
  await avisarSite(supabase);
  return { ok: 'Publicado! O imóvel já aparece no site.' };
}

/** Cria uma cópia em rascunho (com cópia das fotos). Devolve o id da cópia. */
export async function duplicarImovel(
  sessao: SessaoPainel,
  id: string,
): Promise<{ id?: string; erro?: string }> {
  const { supabase } = sessao;
  const { data: original } = await supabase
    .from('imoveis')
    .select('id, corretor_id, dados, fotos')
    .eq('id', id)
    .maybeSingle<Pick<LinhaImovel, 'id' | 'corretor_id' | 'dados' | 'fotos'>>();
  if (!original) return { erro: 'Imóvel não encontrado.' };

  const { data: codigo } = await supabase.rpc('proximo_codigo');
  if (typeof codigo !== 'string') return { erro: 'Não foi possível gerar o código.' };
  const titulo = String(original.dados.titulo ?? 'Imóvel');
  const { data: copia, error } = await supabase
    .from('imoveis')
    .insert({
      codigo,
      slug: slugImovel(titulo, codigo),
      status: 'rascunho',
      corretor_id: original.corretor_id,
      destaque: false,
      dados: original.dados,
      fotos: [],
    })
    .select('id')
    .single();
  if (error || !copia) return { erro: 'Não foi possível duplicar.' };

  const fotos: Foto[] = [];
  for (const [n, foto] of original.fotos.entries()) {
    const origem = caminhoDaFoto(foto.arquivo);
    if (!origem) {
      fotos.push(foto);
      continue;
    }
    const destino = `${copia.id}/${String(n + 1).padStart(2, '0')}-${crypto.randomUUID().slice(0, 8)}.webp`;
    const { error: erroCopia } = await supabase.storage.from(BUCKET_FOTOS).copy(origem, destino);
    if (!erroCopia) fotos.push({ ...foto, arquivo: urlPublicaFoto(destino) });
  }
  if (fotos.length) await supabase.from('imoveis').update({ fotos }).eq('id', copia.id);
  return { id: copia.id };
}

export async function excluirImovel(sessao: SessaoPainel, id: string): Promise<Resultado> {
  const { supabase } = sessao;
  const { data } = await supabase
    .from('imoveis')
    .delete()
    .eq('id', id)
    .select('fotos')
    .maybeSingle<Pick<LinhaImovel, 'fotos'>>();
  if (!data)
    return { erro: 'Só o administrador pode excluir imóveis já publicados. Marque como vendido.' };
  const caminhos = data.fotos
    .map((f) => caminhoDaFoto(f.arquivo))
    .filter((c): c is string => c !== null);
  if (caminhos.length) await supabase.storage.from(BUCKET_FOTOS).remove(caminhos);
  await avisarSite(supabase);
  return { ok: 'Imóvel excluído.' };
}

// ── Leads ──────────────────────────────────────────────────────────────────
export async function moverLead(
  sessao: SessaoPainel,
  id: string,
  etapa: EtapaLead,
): Promise<Resultado> {
  if (!ETAPAS_LEAD.includes(etapa)) return { erro: 'Etapa inválida.' };
  const { data, error } = await sessao.supabase
    .from('leads')
    .update({ etapa })
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error || !data) return { erro: 'Não foi possível mover o lead.' };
  return { ok: 'Movido.' };
}

export async function atualizarLead(
  sessao: SessaoPainel,
  id: string,
  campos: { etapa: EtapaLead; observacoes: string; motivoPerda: string; corretorId?: string },
): Promise<Resultado> {
  if (!ETAPAS_LEAD.includes(campos.etapa)) return { erro: 'Etapa inválida.' };
  if (campos.etapa === 'perdido' && !campos.motivoPerda.trim())
    return { erro: 'Informe o motivo da perda (ajuda a melhorar o atendimento).' };
  const mudancas: Record<string, unknown> = {
    etapa: campos.etapa,
    observacoes: campos.observacoes.trim().slice(0, 5000) || null,
    motivo_perda: campos.etapa === 'perdido' ? campos.motivoPerda.trim().slice(0, 300) : null,
  };
  // Só o admin distribui leads entre corretores.
  if (sessao.ehAdmin && campos.corretorId !== undefined)
    mudancas.corretor_id = campos.corretorId || null;
  const { data, error } = await sessao.supabase
    .from('leads')
    .update(mudancas)
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error || !data) return { erro: 'Não foi possível salvar. Você tem acesso a este lead?' };
  return { ok: 'Lead atualizado.' };
}

/** Exclusão definitiva (pedido do titular dos dados, LGPD). Somente admin (RLS). */
export async function excluirLead(sessao: SessaoPainel, id: string): Promise<Resultado> {
  const { data } = await sessao.supabase.from('leads').delete().eq('id', id).select('id');
  return data?.length ? { ok: 'Lead excluído.' } : { erro: 'Não foi possível excluir.' };
}

// ── Equipe (Edge Function "equipe": usa a chave secreta só no servidor do Supabase) ──
export async function chamarEquipe(
  sessao: SessaoPainel,
  acao: 'criar' | 'ativar' | 'desativar' | 'senha',
  dados: Record<string, unknown>,
): Promise<Resultado> {
  const { data, error } = await sessao.supabase.functions.invoke<Resultado>('equipe', {
    body: { acao, ...dados },
  });
  if (error) {
    let mensagem = 'Não foi possível concluir.';
    try {
      const corpo = (await (error as { context?: Response }).context?.json()) as Resultado;
      if (corpo?.erro) mensagem = corpo.erro;
    } catch {
      if (/Failed to send|not found|404/i.test(error.message))
        mensagem = 'A função "equipe" ainda não foi instalada no Supabase (ver MANUAL_ADMIN).';
    }
    return { erro: mensagem };
  }
  return data ?? { ok: 'Feito.' };
}

export async function atualizarCorretor(
  sessao: SessaoPainel,
  id: string,
  campos: { nome: string; creci: string; whatsapp: string },
): Promise<Resultado> {
  if (campos.nome.trim().length < 2 || !campos.creci.trim())
    return { erro: 'Confira nome e CRECI.' };
  const digitos = campos.whatsapp.replace(/\D/g, '');
  const { error } = await sessao.supabase
    .from('corretores')
    .update({
      nome: campos.nome.trim(),
      creci: campos.creci.trim(),
      whatsapp: digitos ? (digitos.startsWith('55') ? digitos : `55${digitos}`) : 'A_DEFINIR',
    })
    .eq('id', id);
  if (error) return { erro: 'Não foi possível salvar.' };
  await avisarSite(sessao.supabase);
  return { ok: 'Salvo.' };
}
