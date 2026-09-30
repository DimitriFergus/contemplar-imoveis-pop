'use client';

import { FileSpreadsheet, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Carregando } from '@/components/admin/Carregando';
import { QuadroLeads } from '@/components/admin/QuadroLeads';
import { Aviso, Selecao, TituloPagina, classeCampo } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { listarCorretores, listarLeads } from '@/lib/admin/consultas';
import { usePainel } from '@/lib/admin/sessao';
import { useConsulta } from '@/lib/admin/useConsulta';

function Funil() {
  const { supabase, ehAdmin } = usePainel();
  const router = useRouter();
  const params = useSearchParams();
  const busca = params.get('busca') ?? '';
  const corretor = params.get('corretor') ?? '';
  const [exportando, setExportando] = useState(false);

  const { dados, setDados, erro } = useConsulta(
    () =>
      Promise.all([
        listarLeads(supabase, { busca, corretor, limite: 600 }),
        ehAdmin ? listarCorretores(supabase) : Promise.resolve([]),
      ]),
    `${busca}|${corretor}|${ehAdmin}`,
  );
  const [leads, corretores] = dados ?? [null, []];
  const nomes = Object.fromEntries(corretores.map((c) => [c.id, c.nome]));

  async function exportar() {
    setExportando(true);
    try {
      const todos = await listarLeads(supabase, { busca, corretor, limite: 10_000 });
      const { exportarLeadsXlsx } = await import('@/lib/admin/exportar-leads');
      await exportarLeadsXlsx(todos, new Map(Object.entries(nomes)));
    } finally {
      setExportando(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" onClick={exportar} disabled={exportando || !leads}>
          <FileSpreadsheet aria-hidden />{' '}
          {exportando ? 'Gerando planilha…' : 'Exportar planilha (XLSX)'}
        </Button>
      </div>
      {params.get('aviso') === 'excluido' && (
        <Aviso tom="sucesso" className="mb-4">
          Lead excluído definitivamente.
        </Aviso>
      )}
      {erro && (
        <Aviso tom="erro" className="mb-4">
          {erro}
        </Aviso>
      )}
      <form
        className="mb-5 grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-[1fr_auto] lg:grid-cols-[1fr_14rem_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const q = new URLSearchParams();
          for (const k of ['busca', 'corretor']) {
            const v = String(f.get(k) ?? '');
            if (v) q.set(k, v);
          }
          router.push(`/admin/leads${q.size ? `?${q}` : ''}`);
        }}
      >
        <label className="relative">
          <span className="sr-only">Buscar por nome, WhatsApp ou código do imóvel</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            name="busca"
            defaultValue={busca}
            placeholder="Nome, WhatsApp ou código do imóvel"
            className={`${classeCampo} pl-10`}
          />
        </label>
        {ehAdmin && (
          <Selecao name="corretor" defaultValue={corretor} aria-label="Filtrar por corretor">
            <option value="">Todos os corretores</option>
            <option value="sem">Sem corretor</option>
            {corretores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Selecao>
        )}
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>
      {!leads ? (
        <Carregando />
      ) : (
        <QuadroLeads
          leads={leads}
          nomesCorretores={nomes}
          aoMover={(id, etapa) =>
            setDados((d) => (d ? [d[0].map((l) => (l.id === id ? { ...l, etapa } : l)), d[1]] : d))
          }
        />
      )}
    </>
  );
}

export default function PaginaLeads() {
  const { ehAdmin } = usePainel();
  return (
    <>
      <TituloPagina
        titulo="Leads"
        descricao={
          ehAdmin
            ? 'Contatos que chegaram pelo site. Leads sem corretor precisam ser distribuídos.'
            : 'Os contatos dos seus imóveis. Arraste o cartão para mudar a etapa.'
        }
      />
      <Suspense fallback={<Carregando />}>
        <Funil />
      </Suspense>
    </>
  );
}
