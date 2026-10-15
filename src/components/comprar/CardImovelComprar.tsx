import { MapPin, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ROTULO_STATUS, ROTULO_TIPO } from '@/lib/rotulos';
import { caminhoPublico } from '@/lib/utils/caminho';
import { formatarPreco } from '@/lib/utils/formatar';
import { cn } from '@/lib/utils';
import type { ImovelResumo } from '@/types';
import { FichaIconica } from './FichaIconica';

interface Props {
  imovel: ImovelResumo;
  prioridade?: boolean;
  className?: string;
}

/**
 * Card enxuto da página Comprar: foto grande, preço e lupa sobre a imagem, e só o essencial
 * embaixo (título, bairro e quartos/banheiros/área) — sem selos e comparação da listagem padrão.
 */
export function CardImovelComprar({ imovel: i, prioridade = false, className }: Props) {
  const indisponivel = i.status !== 'disponivel';
  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl bg-card text-card-foreground shadow-card ring-1 ring-border transition-shadow hover:shadow-card-hover',
        className,
      )}
      data-testid="card-imovel-comprar"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        {i.foto ? (
          <Image
            src={caminhoPublico(i.foto.arquivo)}
            alt={i.foto.alt}
            fill
            sizes="(min-width: 1280px) 360px, (min-width: 1024px) 45vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            priority={prioridade}
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">Foto em breve</div>
        )}
        {i.exemplo && !indisponivel && (
          <span className="absolute top-3 left-3 rounded-md bg-black/55 px-1.5 py-0.5 text-[0.7rem] font-medium text-white">
            Ilustrativa
          </span>
        )}
        <span className="absolute bottom-3 left-3 rounded-lg bg-primary px-3 py-1.5 text-base font-extrabold text-primary-foreground shadow">
          {formatarPreco(i.preco)}
        </span>
        <span
          className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-black/60 text-white"
          aria-hidden
        >
          <Search className="size-4" />
        </span>
        {indisponivel && (
          <span className="absolute inset-x-0 bottom-0 bg-marinho/90 py-1.5 text-center text-sm font-bold tracking-wide text-white uppercase">
            {ROTULO_STATUS[i.status]}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-lg leading-snug font-bold wrap-anywhere">
          <Link
            href={`/imoveis/${i.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-2xl focus-visible:after:outline focus-visible:after:outline-3 focus-visible:after:outline-ring"
            data-sem-sublinhado
          >
            {ROTULO_TIPO[i.tipo]} à venda
          </Link>
        </h3>
        <p className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden />
          {i.bairro}, {i.cidade}, {i.uf}
        </p>
        <FichaIconica
          className="mt-1"
          quartos={i.quartos}
          suites={i.suites}
          banheiros={i.banheiros}
          vagas={i.vagas}
          areaUtilM2={i.areaUtilM2}
        />
      </div>
    </article>
  );
}
