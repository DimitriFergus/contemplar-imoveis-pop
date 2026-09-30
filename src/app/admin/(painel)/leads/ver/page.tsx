'use client';

import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Carregando } from '@/components/admin/Carregando';
import { FormularioLeadPainel } from '@/components/admin/FormularioLeadPainel';
import { HistoricoAlteracoes } from '@/components/admin/HistoricoAlteracoes';
import { SeloEtapa } from '@/components/admin/Selos';
import { Aviso, Cartao, TituloPagina } from '@/components/admin/ui';
import { IconeWhatsApp } from '@/components/comum/IconeWhatsApp';
import { Button } from '@/components/ui/button';
import { historico, listarCorretores, obterLead } from '@/lib/admin/consultas';
import { excluirLead } from '@/lib/admin/operacoes';
import { ROTULO_FAIXA_RENDA, ROTULO_ORIGEM, ROTULO_PERIODO } from '@/lib/admin/rotulos';
import { usePainel } from '@/lib/admin/sessao';
import { useConsulta } from '@/lib/admin/useConsulta';

const DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'America/Fortaleza',
});

function Lead() {
  const sessao = usePainel();
  const { supabase, ehAdmin } = sessao;
  const router = useRouter();
  const id = useSearchParams().get('id') ?? '';
  const [erro, setErro] = useState<string>();
  const { dados, recarregar } = useConsulta(
    () =>
      Promise.all([
        obterLead(supabase, id),
        listarCorretores(supabase),
        historico(supabase, { tabela: 'leads', id }),
      ]),
    `${id}`,
  );

  if (!dados) return <Carregando />;
  const [l, corretores, hist] = dados;
  if (!l)
    return (
      <div className="rounded-2xl border border-dashed bg-card p-10 text-center" role="alert">
        <p className="text-lg font-bold">Lead não encontrado</p>
        <p className="text-muted-foreground">
          Ele não existe ou é de outro corretor. <Link href="/admin/leads">Voltar</Link>
        </p>
      </div>
    );

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
    <>
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
      {erro && (
        <Aviso tom="erro" className="mb-4">
          {erro}
        </Aviso>
      )}
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
                        href={`/admin/imoveis/editar?id=${l.imovel_id}`}
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
            <HistoricoAlteracoes itens={hist} nomesCorretores={nomes} />
          </Cartao>
        </div>
        <div className="space-y-6">
          <Cartao titulo="Atendimento">
            <FormularioLeadPainel
              key={l.atualizado_em}
              id={l.id}
              etapa={l.etapa}
              observacoes={l.observacoes ?? ''}
              motivoPerda={l.motivo_perda ?? ''}
              corretorId={l.corretor_id ?? ''}
              corretores={ehAdmin ? corretores.map((c) => ({ id: c.id, nome: c.nome })) : null}
              aoSalvar={() => void recarregar()}
            />
          </Cartao>
          {ehAdmin && (
            <Cartao titulo="Excluir dados (LGPD)">
              <p className="mb-3 text-sm text-muted-foreground">
                Use quando a pessoa pedir a exclusão dos dados dela. Não dá para desfazer.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  if (!window.confirm(`Excluir os dados de ${l.nome} definitivamente?`)) return;
                  const r = await excluirLead(sessao, l.id);
                  if (r.ok) router.replace('/admin/leads?aviso=excluido');
                  else setErro(r.erro);
                }}
              >
                <Trash2 aria-hidden /> Excluir lead
              </Button>
            </Cartao>
          )}
        </div>
      </div>
    </>
  );
}

export default function PaginaLead() {
  return (
    <div className="mx-auto max-w-4xl">
      <p className="mb-2 text-sm">
        <Link href="/admin/leads" className="text-primary underline">
          ← Leads
        </Link>
      </p>
      <Suspense fallback={<Carregando />}>
        <Lead />
      </Suspense>
    </div>
  );
}
