import { ArrowRight, Building2, Inbox, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { HistoricoAlteracoes } from '@/components/admin/HistoricoAlteracoes';
import { SeloEtapa } from '@/components/admin/Selos';
import { Aviso, Cartao, TituloPagina } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { ROTULO_ETAPA, ROTULO_ORIGEM, ROTULO_STATUS_PAINEL } from '@/lib/admin/rotulos';
import { exigirSessao } from '@/lib/admin/sessao';
import { STATUS_PAINEL } from '@/lib/schemas/imovel';
import { ETAPAS_LEAD, type LinhaAuditoria, type LinhaLead } from '@/lib/supabase/tipos';

export const metadata: Metadata = { title: 'Início' };

export default async function InicioPainel({ searchParams }: PageProps<'/admin'>) {
  const { aviso } = await searchParams;
  const { supabase, perfil, ehAdmin } = await exigirSessao();

  const [imoveis, leads, recentes, precos] = await Promise.all([
    supabase.from('imoveis').select('status'),
    supabase.from('leads').select('etapa'),
    supabase
      .from('leads')
      .select('id, nome, origem, etapa, codigo_imovel, criado_em')
      .order('criado_em', { ascending: false })
      .limit(6),
    supabase
      .from('auditoria')
      .select('*')
      .eq('tabela', 'imoveis')
      .eq('campo', 'preco')
      .order('criado_em', { ascending: false })
      .limit(5),
  ]);
  const contar = <T extends string>(linhas: { [k: string]: unknown }[] | null, campo: string) => {
    const mapa = new Map<T, number>();
    for (const l of linhas ?? []) mapa.set(l[campo] as T, (mapa.get(l[campo] as T) ?? 0) + 1);
    return mapa;
  };
  const porStatus = contar(imoveis.data, 'status');
  const porEtapa = contar(leads.data, 'etapa');
  const novos = porEtapa.get('novo') ?? 0;

  return (
    <>
      <TituloPagina
        titulo={`Olá, ${perfil.nome.split(' ')[0]}!`}
        descricao={ehAdmin ? 'Visão geral da imobiliária.' : 'Seus imóveis e contatos.'}
        acao={
          <Button asChild variant="destaque">
            <Link href="/admin/imoveis/novo">
              <Plus aria-hidden /> Cadastrar imóvel
            </Link>
          </Button>
        }
      />
      {aviso === 'somente-admin' && (
        <Aviso tom="aviso" className="mb-4">
          Essa área é só para administradores.
        </Aviso>
      )}
      {novos > 0 && (
        <Link
          href="/admin/leads"
          className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-destaque p-4 font-bold text-destaque-foreground"
          data-sem-sublinhado
        >
          <span className="flex items-center gap-2">
            <Inbox aria-hidden /> {novos} {novos === 1 ? 'lead novo' : 'leads novos'} esperando
            atendimento
          </span>
          <ArrowRight aria-hidden />
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Cartao
          titulo="Imóveis"
          acao={
            <Link href="/admin/imoveis" className="text-sm font-semibold text-primary underline">
              Ver todos
            </Link>
          }
        >
          <ul className="grid grid-cols-2 gap-3">
            {STATUS_PAINEL.map((s) => (
              <li key={s}>
                <Link
                  href={`/admin/imoveis?status=${s}`}
                  className="block rounded-xl bg-muted p-3 hover:bg-info-suave"
                  data-sem-sublinhado
                >
                  <span className="block text-2xl font-extrabold">{porStatus.get(s) ?? 0}</span>
                  <span className="text-sm text-muted-foreground">{ROTULO_STATUS_PAINEL[s]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Cartao>
        <Cartao
          titulo="Funil de leads"
          acao={
            <Link href="/admin/leads" className="text-sm font-semibold text-primary underline">
              Abrir funil
            </Link>
          }
        >
          <ul className="grid grid-cols-3 gap-3">
            {ETAPAS_LEAD.map((e) => (
              <li key={e} className="rounded-xl bg-muted p-3">
                <span className="block text-2xl font-extrabold">{porEtapa.get(e) ?? 0}</span>
                <span className="text-sm text-muted-foreground">{ROTULO_ETAPA[e]}</span>
              </li>
            ))}
          </ul>
        </Cartao>
        <Cartao titulo="Últimos leads">
          {(recentes.data ?? []).length === 0 ? (
            <p className="text-muted-foreground">Nenhum lead ainda.</p>
          ) : (
            <ul className="divide-y">
              {(recentes.data as LinhaLead[]).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/leads/${l.id}`}
                      className="font-semibold text-primary underline"
                    >
                      {l.nome}
                    </Link>
                    <p className="truncate text-sm text-muted-foreground">
                      {ROTULO_ORIGEM[l.origem] ?? l.origem}
                      {l.codigo_imovel && ` · ${l.codigo_imovel}`}
                    </p>
                  </div>
                  <SeloEtapa etapa={l.etapa} />
                </li>
              ))}
            </ul>
          )}
        </Cartao>
        <Cartao titulo="Mudanças de preço recentes">
          <HistoricoAlteracoes
            itens={(precos.data ?? []) as LinhaAuditoria[]}
            mostrarRegistro={(a) => ({
              href: `/admin/imoveis/${a.registro_id}`,
              rotulo: 'ver imóvel',
            })}
          />
        </Cartao>
      </div>
      {!ehAdmin && !perfil.corretor_id && (
        <Aviso tom="aviso" className="mt-6">
          <Building2 className="mr-1 inline size-4" aria-hidden /> Seu usuário ainda não está ligado
          a um corretor. Peça ao administrador para ajustar em Equipe.
        </Aviso>
      )}
    </>
  );
}
