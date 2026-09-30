import { Camera, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Selo } from '@/components/comum/Selo';
import { ROTULO_SITUACAO, ROTULO_STATUS, ROTULO_TIPO } from '@/lib/rotulos';
import { formatarMesAno } from '@/lib/utils/formatar';
import { cn } from '@/lib/utils';
import type { ImovelResumo } from '@/types';
import { DiferencasCard } from '@/components/comparacao/DiferencasCard';
import { BotaoComparar } from './BotaoComparar';
import { BotaoFavoritar } from './BotaoFavoritar';
import { FichaTecnica } from './FichaTecnica';
import { PrecoParcela } from './PrecoParcela';
import { SeloCabeNoBolso } from './SeloCabeNoBolso';
import { SeloIlustrativo } from './SeloIlustrativo';
import { SelosCondicoes } from './SelosCondicoes';
import { caminhoPublico } from '@/lib/utils/caminho';

interface Props {
  imovel: ImovelResumo;
  prioridade?: boolean;
  /** Título em h2 (listagem) ou h3 (seções). */
  nivelTitulo?: 'h2' | 'h3';
  className?: string;
  /** Mostra a comparação (botão + ganhos/perdas). Só na listagem de imóveis. */
  comparavel?: boolean;
}

export function CardImovel({
  imovel: i,
  prioridade = false,
  nivelTitulo = 'h3',
  className,
  comparavel = false,
}: Props) {
  const Titulo = nivelTitulo;
  const indisponivel = i.status !== 'disponivel';
  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl bg-card text-card-foreground shadow-card ring-1 ring-border transition-shadow hover:shadow-card-hover',
        'has-[[data-comparacao=base]]:ring-3 has-[[data-comparacao=base]]:ring-primary has-[[data-comparacao=comparado]]:ring-3 has-[[data-comparacao=comparado]]:ring-destaque',
        className,
      )}
      data-testid="card-imovel"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-muted">
        {i.foto ? (
          <Image
            src={caminhoPublico(i.foto.arquivo)}
            alt={i.foto.alt}
            fill
            sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            priority={prioridade}
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">Foto em breve</div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pr-14">
          <Selo tom="escuro">{ROTULO_TIPO[i.tipo]}</Selo>
          <SeloIlustrativo exemplo={i.exemplo} />
        </div>
        <BotaoFavoritar id={i.id} codigo={i.codigo} className="absolute top-2.5 right-2.5" />
        {i.exemplo && !indisponivel && (
          <span className="absolute bottom-3 left-3 rounded-md bg-black/55 px-1.5 py-0.5 text-[0.7rem] font-medium text-white">
            Imagem ilustrativa
          </span>
        )}
        {i.totalFotos > 1 && (
          <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white">
            <Camera className="size-3.5" aria-hidden /> {i.totalFotos}
            <span className="sr-only">fotos</span>
          </span>
        )}
        {indisponivel && (
          <span className="absolute inset-x-0 bottom-0 bg-marinho/90 py-1.5 text-center text-sm font-bold tracking-wide text-white uppercase">
            {ROTULO_STATUS[i.status]}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <SeloCabeNoBolso preco={i.preco} className="self-start" />
        <PrecoParcela preco={i.preco} parcela={i.parcelaEstimada} />
        <div>
          <Titulo className="text-lg leading-snug font-bold wrap-anywhere">
            <Link
              href={`/imoveis/${i.slug}`}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-2xl focus-visible:after:outline focus-visible:after:outline-3 focus-visible:after:outline-ring"
              data-sem-sublinhado
            >
              {i.titulo}
            </Link>
          </Titulo>
          <p className="mt-1 flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-4 shrink-0" aria-hidden />
            {i.bairro}, {i.cidade}
          </p>
        </div>
        <FichaTecnica
          quartos={i.quartos}
          banheiros={i.banheiros}
          vagas={i.vagas}
          areaUtilM2={i.areaUtilM2}
        />
        <SelosCondicoes condicoes={i.condicoes} situacao={i.situacao} limite={2} />
        {comparavel && <DiferencasCard imovel={i} />}
        <div className="mt-auto space-y-2 pt-1 text-sm text-muted-foreground">
          <p>
            Cód. {i.codigo}
            {i.previsaoEntrega && i.situacao !== 'pronto' && i.situacao !== 'usado'
              ? ` · ${ROTULO_SITUACAO[i.situacao]}: entrega ${formatarMesAno(i.previsaoEntrega)}`
              : ''}
          </p>
          {comparavel && (
            <BotaoComparar id={i.id} codigo={i.codigo} className="w-full justify-center" />
          )}
        </div>
      </div>
    </article>
  );
}
