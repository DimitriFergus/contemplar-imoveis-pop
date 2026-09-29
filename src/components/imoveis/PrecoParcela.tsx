import { formatarPreco } from '@/lib/utils/formatar';
import { cn } from '@/lib/utils';
import { ID_NOTA_SIMULACAO } from './NotaPremissas';

/**
 * Parcela em destaque com o preço total sempre visível (CDC). O asterisco leva às premissas.
 */
export function PrecoParcela({
  preco,
  parcela,
  tamanho = 'card',
  className,
}: {
  preco: number;
  parcela: number;
  tamanho?: 'card' | 'anuncio';
  className?: string;
}) {
  const grande = tamanho === 'anuncio';
  return (
    <div className={cn('flex flex-col', className)}>
      <span className={cn('text-muted-foreground', grande ? 'text-base' : 'text-sm')}>
        Parcelas a partir de
      </span>
      <span className={cn('numero-destaque text-primary', grande ? 'text-4xl' : 'text-2xl')}>
        {formatarPreco(parcela)}
        <span className={cn('font-sans font-semibold', grande ? 'text-xl' : 'text-base')}>
          /mês
        </span>
        <a
          href={`#${ID_NOTA_SIMULACAO}`}
          className="relative z-10 ml-0.5 align-super text-base text-muted-foreground no-underline"
          aria-label="Ver premissas da simulação"
          data-sem-sublinhado
        >
          *
        </a>
      </span>
      <span className={cn('font-semibold', grande ? 'mt-1 text-xl' : 'text-base')}>
        Valor total: <span className="numero-destaque font-bold">{formatarPreco(preco)}</span>
      </span>
    </div>
  );
}
