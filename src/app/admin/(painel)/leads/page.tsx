import { FileSpreadsheet, Search } from 'lucide-react';
import type { Metadata } from 'next';
import { QuadroLeads } from '@/components/admin/QuadroLeads';
import { Aviso, Selecao, TituloPagina, classeCampo } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { listarCorretores, listarLeads } from '@/lib/admin/consultas';
import { exigirSessao } from '@/lib/admin/sessao';

export const metadata: Metadata = { title: 'Leads' };

const texto = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined);

export default async function PaginaLeads({ searchParams }: PageProps<'/admin/leads'>) {
  const params = await searchParams;
  const busca = texto(params.busca);
  const corretor = texto(params.corretor);
  const aviso = texto(params.aviso);
  const { supabase, ehAdmin } = await exigirSessao();
  const [leads, corretores] = await Promise.all([
    listarLeads(supabase, { busca, corretor, limite: 600 }),
    ehAdmin ? listarCorretores(supabase) : Promise.resolve([]),
  ]);
  const nomes = Object.fromEntries(corretores.map((c) => [c.id, c.nome]));
  const exportar = new URLSearchParams();
  if (busca) exportar.set('busca', busca);
  if (corretor) exportar.set('corretor', corretor);

  return (
    <>
      <TituloPagina
        titulo="Leads"
        descricao={
          ehAdmin
            ? 'Contatos que chegaram pelo site. Leads sem corretor precisam ser distribuídos.'
            : 'Os contatos dos seus imóveis. Arraste o cartão para mudar a etapa.'
        }
        acao={
          <Button asChild variant="outline">
            <a href={`/admin/leads/exportar${exportar.size ? `?${exportar}` : ''}`} download>
              <FileSpreadsheet aria-hidden /> Exportar planilha (XLSX)
            </a>
          </Button>
        }
      />
      {aviso === 'excluido' && (
        <Aviso tom="sucesso" className="mb-4">
          Lead excluído definitivamente.
        </Aviso>
      )}
      <form className="mb-5 grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-[1fr_auto] lg:grid-cols-[1fr_14rem_auto]">
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
          <Selecao name="corretor" defaultValue={corretor ?? ''} aria-label="Filtrar por corretor">
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
      <QuadroLeads leads={leads} nomesCorretores={nomes} />
    </>
  );
}
