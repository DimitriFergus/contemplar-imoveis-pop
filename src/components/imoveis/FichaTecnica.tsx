import { Bath, BedDouble, Car, Maximize } from 'lucide-react';
import { formatarArea, plural } from '@/lib/utils/formatar';
import { cn } from '@/lib/utils';

interface Props {
  quartos: number;
  suites?: number;
  banheiros: number;
  vagas: number;
  areaUtilM2: number;
  tamanho?: 'card' | 'anuncio';
  className?: string;
}

export function FichaTecnica({
  quartos,
  suites = 0,
  banheiros,
  vagas,
  areaUtilM2,
  tamanho = 'card',
  className,
}: Props) {
  const grande = tamanho === 'anuncio';
  const itens = [
    {
      icone: BedDouble,
      texto: plural(quartos, 'quarto', 'quartos'),
      extra: suites ? `${plural(suites, 'suíte', 'suítes')}` : '',
    },
    { icone: Bath, texto: plural(banheiros, 'banheiro', 'banheiros'), extra: '' },
    { icone: Car, texto: vagas ? plural(vagas, 'vaga', 'vagas') : 'Sem vaga', extra: '' },
    { icone: Maximize, texto: formatarArea(areaUtilM2), extra: grande ? 'área útil' : '' },
  ];
  return (
    <ul
      className={cn(
        grande
          ? 'grid grid-cols-2 gap-3 sm:grid-cols-4'
          : 'flex flex-wrap gap-x-4 gap-y-1 text-[0.95rem]',
        className,
      )}
      aria-label="Ficha técnica"
    >
      {itens.map(({ icone: Icone, texto, extra }) => (
        <li
          key={texto}
          className={cn(
            'flex items-center gap-1.5',
            grande && 'flex-col rounded-xl border bg-card p-3 text-center',
          )}
        >
          <Icone
            className={cn('text-muted-foreground', grande ? 'size-6' : 'size-4')}
            aria-hidden
          />
          <span className={cn(grande && 'font-semibold')}>{texto}</span>
          {extra && <span className="text-sm text-muted-foreground">{extra}</span>}
        </li>
      ))}
    </ul>
  );
}
