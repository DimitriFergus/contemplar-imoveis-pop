'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import { OPCOES_PARCELA_MAXIMA, OPCOES_PRECO_MAXIMO } from '@/config/site';
import { Button } from '@/components/ui/button';
import { paraQueryString } from '@/lib/busca/query';
import { ROTULO_TIPO_PLURAL } from '@/lib/rotulos';
import type { BairroComTotal } from '@/lib/repositorio/tipos';
import { formatarBRL, formatarPrecoCurto } from '@/lib/utils/formatar';
import type { TipoImovel } from '@/types';
import { Alternancia } from '@/components/simulador/Campos';

const TIPOS: TipoImovel[] = ['casa', 'apartamento', 'casa_condominio', 'sobrado', 'duplex'];

/** Busca principal. Funciona também sem JavaScript (formulário GET para /imoveis). */
export function BuscaHero({ bairros }: { bairros: BairroComTotal[] }) {
  const router = useRouter();
  const id = useId();
  const [modo, setModo] = useState<'preco' | 'parcela'>('preco');

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
      action="/imoveis"
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
          { valor: 'preco', rotulo: 'Buscar por preço' },
          { valor: 'parcela', rotulo: 'Buscar por parcela' },
        ]}
      />
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
        <div>
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
        <div>
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
        <Button type="submit" size="lg" variant="destaque" className="w-full md:w-auto">
          <Search className="size-5" aria-hidden /> Buscar
        </Button>
      </div>
    </form>
  );
}
