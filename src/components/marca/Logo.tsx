import Image from 'next/image';
import Link from 'next/link';
import { SITE } from '@/config/site';
import simbolo from '../../../public/marca/simbolo.png';

export function Logo({ compacto = false }: { compacto?: boolean }) {
  return (
    <Link href="/" className="flex min-h-11 items-center gap-2.5 rounded-lg" data-sem-sublinhado>
      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
        <Image src={simbolo} alt="" width={34} height={35} priority />
      </span>
      {!compacto && (
        <span className="flex flex-col leading-none">
          <span className="font-heading text-[1.05rem] font-extrabold tracking-tight text-primary">
            Contemplar
          </span>
          <span className="font-heading text-[0.8rem] font-bold tracking-wide text-muted-foreground">
            Imóveis <span className="rounded bg-destaque px-1 text-destaque-foreground">Pop</span>
          </span>
          <span className="sr-only"> — página inicial</span>
        </span>
      )}
      {compacto && <span className="sr-only">{SITE.nome} — página inicial</span>}
    </Link>
  );
}
