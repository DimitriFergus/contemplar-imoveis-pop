'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Carregando } from '@/components/admin/Carregando';
import { HistoricoAlteracoes } from '@/components/admin/HistoricoAlteracoes';
import { Cartao, TituloPagina } from '@/components/admin/ui';
import { historico, listarCorretores } from '@/lib/admin/consultas';
import { usePainel } from '@/lib/admin/sessao';
import { useConsulta } from '@/lib/admin/useConsulta';
import { cn } from '@/lib/utils';

const ABAS = [
  { valor: '', rotulo: 'Tudo' },
  { valor: 'precos', rotulo: 'Mudanças de preço' },
  { valor: 'imoveis', rotulo: 'Imóveis' },
  { valor: 'leads', rotulo: 'Leads' },
];

function Registro() {
  const { supabase } = usePainel();
  const filtro = useSearchParams().get('filtro') ?? '';
  const { dados } = useConsulta(
    () =>
      Promise.all([
        historico(supabase, {
          limite: 300,
          campo: filtro === 'precos' ? 'preco' : undefined,
          tabela: filtro === 'leads' || filtro === 'imoveis' ? filtro : undefined,
        }),
        listarCorretores(supabase),
      ]),
    `${filtro}`,
  );

  return (
    <>
      <nav aria-label="Filtros do histórico" className="mb-4 flex flex-wrap gap-2">
        {ABAS.map((a) => (
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
        {!dados ? (
          <Carregando />
        ) : (
          <HistoricoAlteracoes
            itens={dados[0]}
            nomesCorretores={Object.fromEntries(dados[1].map((c) => [c.id, c.nome]))}
            mostrarRegistro={(a) => ({
              href:
                a.tabela === 'imoveis'
                  ? `/admin/imoveis/editar?id=${a.registro_id}`
                  : `/admin/leads/ver?id=${a.registro_id}`,
              rotulo: a.tabela === 'imoveis' ? 'ver imóvel' : 'ver lead',
            })}
          />
        )}
      </Cartao>
    </>
  );
}

export default function PaginaHistorico() {
  return (
    <>
      <TituloPagina
        titulo="Histórico de alterações"
        descricao="Registro automático de quem alterou o quê, com valor antigo e novo."
      />
      <Suspense fallback={<Carregando />}>
        <Registro />
      </Suspense>
    </>
  );
}
