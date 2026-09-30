import { TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { ROTULO_CAMPO, ROTULO_ETAPA, ROTULO_STATUS_PAINEL } from '@/lib/admin/rotulos';
import type { LinhaAuditoria } from '@/lib/supabase/tipos';
import { cn } from '@/lib/utils';
import { formatarPreco } from '@/lib/utils/formatar';

const DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Fortaleza',
});

function formatarValor(
  campo: string,
  valor: string | null,
  nomesCorretores: Record<string, string>,
): string {
  if (valor === null || valor === '') return '(vazio)';
  if (campo === 'preco' || campo === 'condominioMensal' || campo === 'iptuAnual')
    return formatarPreco(Number(valor));
  if (campo === 'status') return ROTULO_STATUS_PAINEL[valor as never] ?? valor;
  if (campo === 'etapa') return ROTULO_ETAPA[valor as never] ?? valor;
  if (campo === 'corretor_id') return nomesCorretores[valor] ?? valor;
  if (valor === 'true') return 'Sim';
  if (valor === 'false') return 'Não';
  if (campo === 'fotos') {
    try {
      const n = (JSON.parse(valor) as unknown[]).length;
      return `${n} ${n === 1 ? 'foto' : 'fotos'}`;
    } catch {
      return valor;
    }
  }
  if (valor.startsWith('[') || valor.startsWith('{')) return 'alterado';
  return valor.length > 120 ? `${valor.slice(0, 120)}…` : valor;
}

export function HistoricoAlteracoes({
  itens,
  nomesCorretores = {},
  mostrarRegistro,
}: {
  itens: LinhaAuditoria[];
  nomesCorretores?: Record<string, string>;
  /** Na tela geral: link para o imóvel/lead alterado. */
  mostrarRegistro?: (item: LinhaAuditoria) => { href: string; rotulo: string } | null;
}) {
  if (itens.length === 0)
    return <p className="text-muted-foreground">Nenhuma alteração registrada ainda.</p>;

  return (
    <ol className="divide-y" data-testid="historico">
      {itens.map((a) => {
        const preco = a.campo === 'preco';
        const antigo = Number(a.valor_antigo);
        const novo = Number(a.valor_novo);
        const variacao =
          preco && antigo > 0 && Number.isFinite(novo) ? (novo - antigo) / antigo : null;
        const registro = mostrarRegistro?.(a);
        return (
          <li
            key={a.id}
            className={cn(
              'py-3 text-[0.95rem]',
              preco && '-mx-3 rounded-xl border-l-4 border-destaque bg-destaque-suave px-3',
            )}
            data-campo={a.campo}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="font-semibold">
                {preco &&
                  (variacao !== null && variacao < 0 ? (
                    <TrendingDown className="mr-1 inline size-4 text-sucesso" aria-hidden />
                  ) : (
                    <TrendingUp className="mr-1 inline size-4 text-perda" aria-hidden />
                  ))}
                {ROTULO_CAMPO[a.campo] ?? a.campo}
                {preco && <span className="sr-only"> (mudança de preço)</span>}
                {registro && (
                  <>
                    {' · '}
                    <Link href={registro.href} className="text-primary underline">
                      {registro.rotulo}
                    </Link>
                  </>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {DATA_HORA.format(new Date(a.criado_em))} · {a.usuario_nome ?? 'Usuário removido'}
              </p>
            </div>
            {!a.campo.startsWith('(') && (
              <p className="mt-0.5 text-muted-foreground">
                <span className="line-through decoration-1">
                  {formatarValor(a.campo, a.valor_antigo, nomesCorretores)}
                </span>{' '}
                →{' '}
                <span className="font-semibold text-foreground">
                  {formatarValor(a.campo, a.valor_novo, nomesCorretores)}
                </span>
                {variacao !== null && (
                  <span
                    className={cn(
                      'ml-2 rounded-full px-2 py-0.5 text-xs font-bold',
                      variacao < 0 ? 'bg-sucesso-suave text-sucesso' : 'bg-perda-suave text-perda',
                    )}
                  >
                    {variacao > 0 ? '+' : ''}
                    {(variacao * 100).toFixed(1).replace('.', ',')}%
                  </span>
                )}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
