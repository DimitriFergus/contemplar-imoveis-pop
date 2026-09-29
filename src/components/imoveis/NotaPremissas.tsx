import {
  AVISO_SIMULACAO,
  FAIXAS,
  PREMISSAS_PARCELA_ANUNCIO,
  SEGUROS_E_TAXA_ADM_ESTIMADOS,
} from '@/config/financiamento';
import { formatarBRL, formatarPercentual, formatarPrazo } from '@/lib/utils/formatar';
import { cn } from '@/lib/utils';

export const ID_NOTA_SIMULACAO = 'nota-simulacao';

export function textoPremissasParcela(): string {
  const p = PREMISSAS_PARCELA_ANUNCIO;
  const refs = p.faixasReferencia
    .map((id) => FAIXAS.find((f) => f.id === id))
    .filter((f) => f !== undefined)
    .map(
      (f) =>
        `${formatarPercentual(p.usarTaxaMaxima ? f.taxaAnualMaxima : f.taxaAnualMinima)} a.a. ${f.tipoTaxa} (${f.nome}${f.tetoImovel ? `, imóveis até ${formatarBRL(f.tetoImovel).replace(',00', '')}` : ''})`,
    );
  const seguros =
    100_000 * SEGUROS_E_TAXA_ADM_ESTIMADOS.percentualMensalSobreFinanciado +
    SEGUROS_E_TAXA_ADM_ESTIMADOS.taxaAdministracaoMensal;
  return `*Parcela estimada com entrada de ${formatarPercentual(p.percentualEntrada)}, prazo de ${formatarPrazo(p.prazoMeses)}, ${p.sistema === 'price' ? 'Tabela Price (parcelas iguais)' : 'SAC (primeira parcela)'} e taxa de referência de ${refs.join('; ')}. Não inclui seguros e taxa de administração (estimativa de ${formatarBRL(seguros)}/mês para cada R$ 100 mil financiados).`;
}

/** Nota obrigatória sempre que houver parcela na página (premissas + aviso de simulação). */
export function NotaPremissas({ className }: { className?: string }) {
  return (
    <aside
      id={ID_NOTA_SIMULACAO}
      className={cn('rounded-xl border bg-muted/50 p-4 text-sm text-muted-foreground', className)}
      aria-label="Premissas da simulação"
    >
      <p>{textoPremissasParcela()}</p>
      <p className="mt-2 font-medium">{AVISO_SIMULACAO}</p>
    </aside>
  );
}
