'use server';

import { redirect } from 'next/navigation';
import { imovelParaDados, linhaParaImovel } from '@/lib/repositorio/converter';
import { COLUNAS_IMOVEL } from '@/lib/repositorio/supabase';
import { imovelFormularioSchema } from '@/lib/schemas/imovel';
import { BUCKET_FOTOS, caminhoDaFoto, urlPublicaFoto } from '@/lib/supabase/config';
import type { LinhaImovel } from '@/lib/supabase/tipos';
import { slugImovel } from '@/lib/utils/slug';
import type { Foto } from '@/types';
import { revalidarSitePublico } from './revalidar';
import { exigirSessao } from './sessao';

export type ResultadoSalvar =
  | { ok: true; id: string; codigo: string; slug: string }
  | { ok: false; mensagem: string; erros?: Record<string, string> };

function errosPorCampo(issues: { path: PropertyKey[]; message: string }[]) {
  const erros: Record<string, string> = {};
  for (const i of issues) {
    const campo = i.path.map(String).join('.') || 'geral';
    erros[campo] ??= i.message;
  }
  return erros;
}

/**
 * Cria (id = null) ou atualiza um imóvel. Valida de novo no servidor com o mesmo schema do
 * formulário e grava com a sessão do usuário: as regras RLS do banco impedem que um corretor
 * altere imóvel de outro, mesmo que alguém force a requisição.
 */
export async function salvarImovel(id: string | null, entrada: unknown): Promise<ResultadoSalvar> {
  const { supabase, ehAdmin, perfil } = await exigirSessao();

  const r = imovelFormularioSchema.safeParse(entrada);
  if (!r.success) {
    return {
      ok: false,
      mensagem: 'Confira os campos destacados.',
      erros: errosPorCampo(r.error.issues),
    };
  }
  const dadosForm = r.data;

  // Corretor só cadastra imóveis em seu próprio nome.
  const corretorId = ehAdmin ? dadosForm.corretorResponsavelId : perfil.corretor_id;
  if (!corretorId) {
    return {
      ok: false,
      mensagem: 'Seu usuário não está ligado a um corretor. Peça ao administrador para ajustar.',
    };
  }

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
    revalidarSitePublico();
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

  revalidarSitePublico();
  return { ok: true, ...data };
}

/** Publica direto da pré-visualização, conferindo antes se o anúncio está completo. */
export async function publicarImovel(id: string) {
  const { supabase } = await exigirSessao();
  const { data: linha } = await supabase
    .from('imoveis')
    .select(COLUNAS_IMOVEL)
    .eq('id', id)
    .maybeSingle<LinhaImovel>();
  if (!linha) redirect('/admin/imoveis?aviso=nao-encontrado');
  const imovel = linhaParaImovel(linha);
  const r = imovelFormularioSchema.safeParse({ ...imovel, status: 'publicado' });
  if (!r.success) redirect(`/admin/imoveis/${id}/previa?aviso=incompleto`);
  const { error } = await supabase.from('imoveis').update({ status: 'publicado' }).eq('id', id);
  if (error) redirect(`/admin/imoveis/${id}/previa?aviso=erro`);
  revalidarSitePublico();
  redirect(`/admin/imoveis/${id}/previa?aviso=publicado`);
}

/** Cria uma cópia em rascunho (com cópia das fotos) para cadastrar imóveis parecidos. */
export async function duplicarImovel(id: string) {
  const { supabase } = await exigirSessao();
  const { data: original } = await supabase
    .from('imoveis')
    .select('id, corretor_id, destaque, dados, fotos')
    .eq('id', id)
    .maybeSingle<Pick<LinhaImovel, 'id' | 'corretor_id' | 'destaque' | 'dados' | 'fotos'>>();
  if (!original) redirect('/admin/imoveis?aviso=nao-encontrado');

  const { data: codigo } = await supabase.rpc('proximo_codigo');
  if (typeof codigo !== 'string') redirect('/admin/imoveis?aviso=erro');
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
  if (error || !copia) redirect('/admin/imoveis?aviso=erro');

  // Copia os arquivos para a pasta do novo imóvel (fotos fora do Storage são mantidas como estão).
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
  redirect(`/admin/imoveis/${copia.id}?duplicado=1`);
}

export async function excluirImovel(id: string) {
  const { supabase } = await exigirSessao();
  const { data } = await supabase
    .from('imoveis')
    .delete()
    .eq('id', id)
    .select('fotos')
    .maybeSingle<Pick<LinhaImovel, 'fotos'>>();
  if (!data) redirect(`/admin/imoveis/${id}?aviso=sem-permissao-excluir`);
  const caminhos = data.fotos
    .map((f) => caminhoDaFoto(f.arquivo))
    .filter((c): c is string => c !== null);
  if (caminhos.length) await supabase.storage.from(BUCKET_FOTOS).remove(caminhos);
  revalidarSitePublico();
  redirect('/admin/imoveis?aviso=excluido');
}

function traduzirErro(mensagem?: string): string {
  if (!mensagem) return 'Não foi possível salvar.';
  if (/row-level security|permission denied/i.test(mensagem))
    return 'Você não tem permissão para alterar este imóvel.';
  if (/duplicate key.*slug/i.test(mensagem)) return 'Já existe um imóvel com este endereço.';
  return 'Não foi possível salvar. Tente de novo.';
}
