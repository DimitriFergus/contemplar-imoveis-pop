import { randomUUID } from 'node:crypto';
import { LIMITE_LEADS } from '@/config/site';
import { bancoDeLeadsAtivo, gravarLeadNoBanco } from '@/lib/leads/gravar';
import { permitirRequisicao } from '@/lib/leads/limite';
import { leadEntradaSchema } from '@/lib/schemas/lead';
import type { Lead } from '@/types';

const TAMANHO_MAXIMO_CORPO = 10_000;

function ipDe(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'desconhecido'
  );
}

function mascarar(whatsapp: string) {
  return whatsapp.replace(/^(\d{4})\d+(\d{2})$/, '$1*****$2');
}

async function enviarParaWebhook(lead: Lead, gravadoNoBanco: boolean) {
  const url = process.env.LEADS_WEBHOOK_URL;
  if (!url) {
    if (gravadoNoBanco) return;
    // Sem webhook: registra no log do servidor (dados mascarados fora do desenvolvimento).
    const registro =
      process.env.NODE_ENV === 'development'
        ? lead
        : { ...lead, whatsapp: mascarar(lead.whatsapp), email: lead.email ? '***' : undefined };
    console.info('[lead recebido — LEADS_WEBHOOK_URL não configurada]', JSON.stringify(registro));
    return;
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.LEADS_WEBHOOK_TOKEN)
    headers.Authorization = `Bearer ${process.env.LEADS_WEBHOOK_TOKEN}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(lead),
    signal: AbortSignal.timeout(8000),
  });
  if (!resp.ok) throw new Error(`Webhook respondeu ${resp.status}`);
}

export async function POST(request: Request) {
  if (
    !permitirRequisicao(`lead:${ipDe(request)}`, LIMITE_LEADS.maxRequisicoes, LIMITE_LEADS.janelaMs)
  ) {
    return Response.json(
      {
        mensagem: 'Muitas tentativas em pouco tempo. Aguarde alguns minutos ou fale pelo WhatsApp.',
      },
      { status: 429 },
    );
  }

  const texto = await request.text();
  if (texto.length > TAMANHO_MAXIMO_CORPO) {
    return Response.json({ mensagem: 'Dados muito grandes.' }, { status: 413 });
  }
  let corpo: unknown;
  try {
    corpo = JSON.parse(texto);
  } catch {
    return Response.json({ mensagem: 'Formato inválido.' }, { status: 400 });
  }

  // Honeypot preenchido: responde sucesso sem registrar (não ensina o robô).
  if (
    typeof corpo === 'object' &&
    corpo !== null &&
    'site' in corpo &&
    (corpo as { site?: unknown }).site
  ) {
    return Response.json({ ok: true });
  }

  const resultado = leadEntradaSchema.safeParse(corpo);
  if (!resultado.success) {
    const erros: Record<string, string> = {};
    for (const issue of resultado.error.issues) {
      const campo = String(issue.path[0] ?? 'geral');
      erros[campo] ??= issue.message;
    }
    return Response.json({ mensagem: 'Confira os campos destacados.', erros }, { status: 422 });
  }

  const dados = { ...resultado.data };
  delete dados.site;
  const lead: Lead = { ...dados, id: randomUUID(), criadoEm: new Date().toISOString() };

  // 1) Banco (CRM do painel /admin), quando o Supabase está configurado.
  let gravadoNoBanco = false;
  try {
    gravadoNoBanco = await gravarLeadNoBanco(lead);
  } catch (e) {
    console.error('[lead] falha ao gravar no banco', (e as Error).message, { id: lead.id });
  }

  // 2) Webhook (n8n, Make, planilha...), como cópia extra ou destino principal.
  try {
    await enviarParaWebhook(lead, gravadoNoBanco);
  } catch (e) {
    console.error('[lead] falha ao enviar para o webhook', (e as Error).message, { id: lead.id });
    if (!gravadoNoBanco)
      return Response.json(
        { mensagem: 'Não conseguimos registrar agora. Fale com a gente pelo WhatsApp.' },
        { status: 502 },
      );
  }
  // Banco configurado, mas a gravação falhou e não há webhook: o lead se perderia.
  if (!gravadoNoBanco && bancoDeLeadsAtivo() && !process.env.LEADS_WEBHOOK_URL)
    return Response.json(
      { mensagem: 'Não conseguimos registrar agora. Fale com a gente pelo WhatsApp.' },
      { status: 502 },
    );
  return Response.json({ ok: true, id: lead.id }, { status: 201 });
}
