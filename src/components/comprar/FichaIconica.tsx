import { Bath, Bed, BedDouble, Car, Maximize } from 'lucide-react';
import { formatarArea } from '@/lib/utils/formatar';
import { cn } from '@/lib/utils';

interface Props {
  quartos: number;
  suites?: number;
  banheiros: number;
  vagas: number;
  areaUtilM2: number;
  className?: string;
}

/** Linha de ícones (quartos, suítes, banheiros, vagas, área) no lugar de uma frase corrida. */
export function FichaIconica({
  quartos,
  suites = 0,
  banheiros,
  vagas,
  areaUtilM2,
  className,
}: Props) {
  const itens = [
    { Icone: BedDouble, texto: `${quartos} ${quartos === 1 ? 'quarto' : 'quartos'}` },
    suites > 0 ? { Icone: Bed, texto: `${suites} ${suites === 1 ? 'suíte' : 'suítes'}` } : null,
    { Icone: Bath, texto: `${banheiros} ${banheiros === 1 ? 'banheiro' : 'banheiros'}` },
    vagas > 0 ? { Icone: Car, texto: `${vagas} ${vagas === 1 ? 'vaga' : 'vagas'}` } : null,
    { Icone: Maximize, texto: formatarArea(areaUtilM2) },
  ].filter((item): item is { Icone: typeof BedDouble; texto: string } => item !== null);

  return (
    <ul className={cn('flex flex-wrap items-center gap-x-3 gap-y-1.5', className)} aria-label="Características do imóvel">
      {itens.map(({ Icone, texto }, idx) => (
        <li key={idx} className="flex items-center gap-1.5 text-sm font-semibold">
          <Icone className="size-4 shrink-0 text-primary" aria-hidden />
          {texto}
        </li>
      ))}
    </ul>
  );
}
