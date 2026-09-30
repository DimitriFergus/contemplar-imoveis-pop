import type { Metadata } from 'next';
import Link from 'next/link';
import { HistoricoAlteracoes } from '@/components/admin/HistoricoAlteracoes';
import { Cartao, TituloPagina } from '@/components/admin/ui';
import { listarCorretores } from '@/lib/admin/consultas';
import { exigirSessao } from '@/lib/admin/sessao';
import type { LinhaAuditoria } from '@/lib/supabase/tipos';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Histórico' };

export default async function PaginaHistorico({ searchParams }: PageProps<'/admin/historico'>) {
  const { filtro } = await searchParams;
  const { supabase } = await exigirSessao({ apenasAdmin: true });
  let q = supabase
    .from('auditoria')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(300);
  if (filtro === 'precos') q = q.eq('campo', 'preco');
  if (filtro === 'leads') q = q.eq('tabela', 'leads');
  if (filtro === 'imoveis') q = q.eq('tabela', 'imoveis');
  const [{ data }, corretores] = await Promise.all([q, listarCorretores(supabase)]);
  const nomes = Object.fromEntries(corretores.map((c) => [c.id, c.nome]));

  const abas = [
    { valor: undefined, rotulo: 'Tudo' },
    { valor: 'precos', rotulo: 'Mudanças de preço' },
    { valor: 'imoveis', rotulo: 'Imóveis' },
    { valor: 'leads', rotulo: 'Leads' },
  ];

  return (
    <>
      <TituloPagina
        titulo="Histórico de alterações"
        descricao="Registro automático de quem alterou o quê, com valor antigo e novo."
      />
      <nav aria-label="Filtros do histórico" className="mb-4 flex flex-wrap gap-2">
        {abas.map((a) => (
          <Link
            key={a.rotulo}
            href={a.valor ? `/admin/historico?filtro=${a.valor}` : '/admin/historico'}
            aria-current={filtro === a.valor ? 'page' : undefined}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-semibold',
              filtro === a.valor ? 'border-primary bg-primary text-primary-foreground' : 'bg-card',
            )}
            data-sem-sublinhado
          >
            {a.rotulo}
          </Link>
        ))}
      </nav>
      <Cartao>
        <HistoricoAlteracoes
          itens={(data ?? []) as LinhaAuditoria[]}
          nomesCorretores={nomes}
          mostrarRegistro={(a) => ({
            href: `/admin/${a.tabela}/${a.registro_id}`,
            rotulo: a.tabela === 'imoveis' ? 'ver imóvel' : 'ver lead',
          })}
        />
      </Cartao>
    </>
  );
}
