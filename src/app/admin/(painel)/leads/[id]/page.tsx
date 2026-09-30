import { Trash2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FormularioLeadPainel } from '@/components/admin/FormularioLeadPainel';
import { HistoricoAlteracoes } from '@/components/admin/HistoricoAlteracoes';
import { SeloEtapa } from '@/components/admin/Selos';
import { Cartao, TituloPagina } from '@/components/admin/ui';
import { IconeWhatsApp } from '@/components/comum/IconeWhatsApp';
import { Button } from '@/components/ui/button';
import { excluirLead } from '@/lib/admin/acoes-leads';
import { COLUNAS_LEAD, historicoDoRegistro, listarCorretores } from '@/lib/admin/consultas';
import { ROTULO_FAIXA_RENDA, ROTULO_ORIGEM, ROTULO_PERIODO } from '@/lib/admin/rotulos';
import { exigirSessao } from '@/lib/admin/sessao';
import type { LinhaLead } from '@/lib/supabase/tipos';

export const metadata: Metadata = { title: 'Lead' };

const DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'America/Fortaleza',
});

export default async function PaginaLead({ params }: PageProps<'/admin/leads/[id]'>) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, ehAdmin } = await exigirSessao();
  const [{ data }, corretores, historico] = await Promise.all([
    supabase.from('leads').select(COLUNAS_LEAD).eq('id', id).maybeSingle<LinhaLead>(),
    listarCorretores(supabase),
    historicoDoRegistro(supabase, 'leads', id),
  ]);
  if (!data) notFound();
  const l = data;
  const nomes = Object.fromEntries(corretores.map((c) => [c.id, c.nome]));
  const telefone = l.whatsapp.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');

  const linhas: [string, string | null][] = [
    ['Recebido em', DATA_HORA.format(new Date(l.criado_em))],
    ['Origem', ROTULO_ORIGEM[l.origem] ?? l.origem],
    ['WhatsApp', telefone],
    ['E-mail', l.email],
    ['Faixa de renda', l.renda_faixa ? (ROTULO_FAIXA_RENDA[l.renda_faixa] ?? l.renda_faixa) : null],
    [
      'Visita desejada',
      l.data_visita
        ? `${l.data_visita.split('-').reverse().join('/')}${l.periodo_visita ? ` · ${ROTULO_PERIODO[l.periodo_visita] ?? ''}` : ''}`
        : null,
    ],
    [
      'Campanha',
      l.utm
        ? Object.entries(l.utm)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' · ')
        : null,
    ],
    ['Consentimento LGPD', l.consentimento_lgpd ? 'Sim' : 'Não'],
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <p className="mb-2 text-sm">
        <Link href="/admin/leads" className="text-primary underline">
          ← Leads
        </Link>
      </p>
      <TituloPagina
        titulo={
          <span className="flex flex-wrap items-center gap-3">
            {l.nome} <SeloEtapa etapa={l.etapa} />
          </span>
        }
        acao={
          <Button asChild variant="whatsapp">
            <a href={`https://wa.me/${l.whatsapp}`} target="_blank" rel="noopener noreferrer">
              <IconeWhatsApp className="size-5" /> Chamar no WhatsApp
            </a>
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Cartao titulo="Dados do contato">
            <dl className="grid gap-3 sm:grid-cols-2">
              {linhas
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-sm text-muted-foreground">{k}</dt>
                    <dd className="font-semibold break-words">{v}</dd>
                  </div>
                ))}
              {l.codigo_imovel && (
                <div>
                  <dt className="text-sm text-muted-foreground">Imóvel de interesse</dt>
                  <dd className="font-semibold">
                    {l.imovel_id ? (
                      <Link
                        href={`/admin/imoveis/${l.imovel_id}`}
                        className="text-primary underline"
                      >
                        {l.codigo_imovel}
                      </Link>
                    ) : (
                      l.codigo_imovel
                    )}
                  </dd>
                </div>
              )}
            </dl>
            {l.mensagem && (
              <div className="mt-4 rounded-xl bg-muted p-3">
                <p className="text-sm text-muted-foreground">Mensagem</p>
                <p className="whitespace-pre-line">{l.mensagem}</p>
              </div>
            )}
          </Cartao>
          <Cartao titulo="Histórico">
            <HistoricoAlteracoes itens={historico} nomesCorretores={nomes} />
          </Cartao>
        </div>
        <div className="space-y-6">
          <Cartao titulo="Atendimento">
            <FormularioLeadPainel
              id={l.id}
              etapa={l.etapa}
              observacoes={l.observacoes ?? ''}
              motivoPerda={l.motivo_perda ?? ''}
              corretorId={l.corretor_id ?? ''}
              corretores={ehAdmin ? corretores.map((c) => ({ id: c.id, nome: c.nome })) : null}
            />
          </Cartao>
          {ehAdmin && (
            <Cartao titulo="Excluir dados (LGPD)">
              <p className="mb-3 text-sm text-muted-foreground">
                Use quando a pessoa pedir a exclusão dos dados dela. Não dá para desfazer.
              </p>
              <form action={excluirLead.bind(null, l.id)}>
                <Button type="submit" variant="destructive" size="sm">
                  <Trash2 aria-hidden /> Excluir lead
                </Button>
              </form>
            </Cartao>
          )}
        </div>
      </div>
    </div>
  );
}
