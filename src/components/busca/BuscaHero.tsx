'use client';

import { ChevronDown, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import { BASE_PATH, OPCOES_PARCELA_MAXIMA, OPCOES_PRECO_MAXIMO } from '@/config/site';
import { Button } from '@/components/ui/button';
import { paraQueryString } from '@/lib/busca/query';
import { ROTULO_TIPO_PLURAL } from '@/lib/rotulos';
import type { BairroComTotal } from '@/lib/repositorio/tipos';
import { formatarBRL, formatarPrecoCurto } from '@/lib/utils/formatar';
import type { TipoImovel } from '@/types';
import { Alternancia } from '@/components/simulador/Campos';
import { cn } from '@/lib/utils';

const TIPOS: TipoImovel[] = ['casa', 'apartamento', 'casa_condominio', 'sobrado', 'duplex'];

/** Busca principal. Funciona também sem JavaScript (formulário GET para /imoveis). */
export function BuscaHero({ bairros }: { bairros: BairroComTotal[] }) {
  const router = useRouter();
  const id = useId();
  const [modo, setModo] = useState<'preco' | 'parcela'>('preco');
  // No celular, tipo e bairro ficam recolhidos para a busca caber no vídeo do topo.
  const [maisFiltros, setMaisFiltros] = useState(false);
  const recolhido = cn('col-span-2 md:col-span-1', !maisFiltros && 'hidden md:block');

  const buscar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const tipo = String(f.get('tipo') ?? '');
    const valor = Number(f.get(modo === 'preco' ? 'precoMax' : 'parcelaMax') || 0);
    const qs = paraQueryString({
      tipo: tipo ? [tipo as TipoImovel] : [],
      bairro: String(f.get('bairro') ?? '') || undefined,
      precoMax: modo === 'preco' && valor ? valor : undefined,
      parcelaMax: modo === 'parcela' && valor ? valor : undefined,
      situacao: [],
      condicoes: [],
    });
    router.push(`/imoveis${qs}`);
  };

  return (
    <form
      action={`${BASE_PATH}/imoveis`}
      method="get"
      onSubmit={buscar}
      className="rounded-2xl bg-card p-4 text-card-foreground shadow-card-hover ring-1 ring-border sm:p-5"
      role="search"
      aria-label="Buscar imóveis"
    >
      <Alternancia
        rotulo={<span className="sr-only">Buscar por</span>}
        valor={modo}
        aoMudar={setModo}
        opcoes={[
          { valor: 'preco', rotulo: 'Por preço' },
          { valor: 'parcela', rotulo: 'Por parcela' },
        ]}
      />
      <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
        <div id={`${id}-filtros-tipo`} className={recolhido}>
          <label htmlFor={`${id}-tipo`} className="mb-1 block font-semibold">
            Tipo
          </label>
          <select id={`${id}-tipo`} name="tipo" defaultValue="">
            <option value="">Todos os tipos</option>
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {ROTULO_TIPO_PLURAL[t]}
              </option>
            ))}
          </select>
        </div>
        <div id={`${id}-filtros-bairro`} className={recolhido}>
          <label htmlFor={`${id}-bairro`} className="mb-1 block font-semibold">
            Bairro
          </label>
          <select id={`${id}-bairro`} name="bairro" defaultValue="">
            <option value="">Todos os bairros</option>
            {bairros.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-valor`} className="mb-1 block font-semibold">
            {modo === 'preco' ? 'Preço até' : 'Parcela até'}
          </label>
          {modo === 'preco' ? (
            <select id={`${id}-valor`} name="precoMax" defaultValue="" key="preco">
              <option value="">Qualquer preço</option>
              {OPCOES_PRECO_MAXIMO.map((v) => (
                <option key={v} value={v}>
                  {formatarPrecoCurto(v)}
                </option>
              ))}
            </select>
          ) : (
            <select id={`${id}-valor`} name="parcelaMax" defaultValue="" key="parcela">
              <option value="">Qualquer parcela</option>
              {OPCOES_PARCELA_MAXIMA.map((v) => (
                <option key={v} value={v}>
                  {formatarBRL(v).replace(',00', '')}/mês
                </option>
              ))}
            </select>
          )}
        </div>
        <Button type="submit" size="lg" variant="destaque" className="md:w-auto">
          <Search className="size-5" aria-hidden /> Buscar
        </Button>
      </div>
      <button
        type="button"
        className="mt-3 inline-flex min-h-11 items-center gap-1 font-semibold text-primary md:hidden"
        aria-expanded={maisFiltros}
        aria-controls={`${id}-filtros-tipo ${id}-filtros-bairro`}
        onClick={() => setMaisFiltros((v) => !v)}
      >
        {maisFiltros ? 'Menos filtros' : 'Mais filtros: tipo e bairro'}
        <ChevronDown
          className={cn('size-5 transition-transform', maisFiltros && 'rotate-180')}
          aria-hidden
        />
      </button>
    </form>
  );
}
