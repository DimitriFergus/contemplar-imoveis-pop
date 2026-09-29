'use client';

import { SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent, type ReactNode } from 'react';
import {
  OPCOES_AREA_MINIMA,
  OPCOES_MINIMO_COMODOS,
  OPCOES_PARCELA_MAXIMA,
  OPCOES_PRECO_MAXIMO,
  OPCOES_PRECO_MINIMO,
} from '@/config/site';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { aplicarFiltros, paraQueryString, type Filtros } from '@/lib/busca/query';
import { useTodosResumos } from '@/lib/cliente/resumos';
import { useArmazenado, useMontado } from '@/lib/cliente/armazenamento';
import { perfilBolso } from '@/lib/cliente/estado';
import {
  ROTULO_CONDICAO_CURTO,
  ROTULO_SITUACAO,
  ROTULO_TIPO_PLURAL,
  type ChaveCondicao,
} from '@/lib/rotulos';
import { SITUACOES_IMOVEL, TIPOS_IMOVEL } from '@/lib/constantes';
import { formatarBRL, formatarPrecoCurto, plural } from '@/lib/utils/formatar';
import type { BairroComTotal } from '@/lib/repositorio/tipos';

const CONDICOES_FILTRO: ChaveCondicao[] = [
  'aceitaMCMV',
  'aceitaFGTS',
  'aceitaConsorcio',
  'aceitaPermuta',
  'entradaFacilitada',
];

interface Props {
  filtros: Filtros;
  bairros: BairroComTotal[];
  /** Caminho base (ex.: /imoveis ou /imoveis/casas). */
  caminho: string;
  /** Filtros fixos da página (ex.: tipo em /imoveis/casas), escondidos do formulário. */
  fixos?: Partial<Filtros>;
  totalAtual: number;
  /** "lateral" (desktop) ou "celular" (botão + painel inferior). */
  modo: 'lateral' | 'celular';
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-2 border-b pb-5">
      <legend className="mb-2 font-bold">{titulo}</legend>
      {children}
    </fieldset>
  );
}

function Marcavel({
  nome,
  rotulo,
  marcado,
  aoMudar,
  tipo = 'checkbox',
}: {
  nome: string;
  rotulo: string;
  marcado: boolean;
  aoMudar: () => void;
  tipo?: 'checkbox' | 'radio';
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 hover:bg-muted">
      <input
        type={tipo}
        name={nome}
        checked={marcado}
        onChange={aoMudar}
        className="size-5 shrink-0"
      />
      <span>{rotulo}</span>
    </label>
  );
}

function Minimo({
  nome,
  rotulo,
  valor,
  aoMudar,
}: {
  nome: string;
  rotulo: string;
  valor?: number;
  aoMudar: (v?: number) => void;
}) {
  return (
    <Grupo titulo={rotulo}>
      <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={rotulo}>
        {[undefined, ...OPCOES_MINIMO_COMODOS].map((n) => (
          <label
            key={n ?? 0}
            className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border text-center font-semibold has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring"
          >
            <input
              type="radio"
              name={nome}
              className="sr-only"
              checked={valor === n}
              onChange={() => aoMudar(n)}
            />
            {n ? `${n}+` : 'Todos'}
          </label>
        ))}
      </div>
    </Grupo>
  );
}

export function PainelFiltros({ filtros, bairros, caminho, fixos = {}, totalAtual, modo }: Props) {
  const router = useRouter();
  const idForm = useId();
  const [rascunho, setRascunho] = useState<Filtros>(filtros);
  const [aberto, setAberto] = useState(false);
  const perfil = useArmazenado(perfilBolso);
  const montado = useMontado();

  const alterar = <K extends keyof Filtros>(chave: K, valor: Filtros[K]) =>
    setRascunho((r) => ({ ...r, [chave]: valor, pagina: undefined }));
  const alternarLista = <K extends 'tipo' | 'situacao' | 'condicoes'>(
    chave: K,
    item: Filtros[K][number],
  ) =>
    setRascunho((r) => {
      const lista = r[chave] as string[];
      return {
        ...r,
        [chave]: lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item],
        pagina: undefined,
      };
    });

  // Contagem ao vivo para o botão "Ver X imóveis" (calculada no navegador).
  const alterado = rascunho !== filtros;
  const { imoveis: todos } = useTodosResumos(alterado);
  const contagem =
    alterado && todos ? aplicarFiltros(todos, { ...rascunho, ...fixos }).length : totalAtual;

  const aplicar = (e?: FormEvent) => {
    e?.preventDefault();
    const semFixos: Partial<Filtros> = { ...rascunho };
    for (const chave of Object.keys(fixos) as (keyof Filtros)[]) delete semFixos[chave];
    router.push(`${caminho}${paraQueryString(semFixos)}`, { scroll: false });
    setAberto(false);
  };

  const campos = (p: string) => (
    <div className="space-y-5">
      {!fixos.tipo && (
        <Grupo titulo="Tipo de imóvel">
          {TIPOS_IMOVEL.filter((t) => t !== 'kitnet').map((t) => (
            <Marcavel
              key={t}
              nome="tipo"
              rotulo={ROTULO_TIPO_PLURAL[t]}
              marcado={rascunho.tipo.includes(t)}
              aoMudar={() => alternarLista('tipo', t)}
            />
          ))}
        </Grupo>
      )}
      <Grupo titulo="Situação">
        {SITUACOES_IMOVEL.map((s) => (
          <Marcavel
            key={s}
            nome="situacao"
            rotulo={ROTULO_SITUACAO[s]}
            marcado={rascunho.situacao.includes(s)}
            aoMudar={() => alternarLista('situacao', s)}
          />
        ))}
      </Grupo>
      {!fixos.bairro && (
        <Grupo titulo="Bairro">
          <label className="sr-only" htmlFor={`${idForm}-${p}-bairro`}>
            Bairro
          </label>
          <select
            id={`${idForm}-${p}-bairro`}
            value={rascunho.bairro ?? ''}
            onChange={(e) => alterar('bairro', e.target.value || undefined)}
          >
            <option value="">Todos os bairros</option>
            {bairros.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.nome} ({b.total})
              </option>
            ))}
          </select>
        </Grupo>
      )}
      <Grupo titulo="Preço total">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm text-muted-foreground" htmlFor={`${idForm}-${p}-pmin`}>
              Mínimo
            </label>
            <select
              id={`${idForm}-${p}-pmin`}
              value={rascunho.precoMin ?? ''}
              onChange={(e) =>
                alterar('precoMin', e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">Sem mínimo</option>
              {OPCOES_PRECO_MINIMO.map((v) => (
                <option key={v} value={v}>
                  {formatarPrecoCurto(v)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground" htmlFor={`${idForm}-${p}-pmax`}>
              Máximo
            </label>
            <select
              id={`${idForm}-${p}-pmax`}
              value={rascunho.precoMax ?? ''}
              onChange={(e) =>
                alterar('precoMax', e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">Sem máximo</option>
              {OPCOES_PRECO_MAXIMO.map((v) => (
                <option key={v} value={v}>
                  {formatarPrecoCurto(v)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Grupo>
      <Grupo titulo="Parcela máxima por mês">
        <label className="sr-only" htmlFor={`${idForm}-${p}-parcela`}>
          Parcela máxima
        </label>
        <select
          id={`${idForm}-${p}-parcela`}
          value={rascunho.parcelaMax ?? ''}
          onChange={(e) =>
            alterar('parcelaMax', e.target.value ? Number(e.target.value) : undefined)
          }
        >
          <option value="">Qualquer parcela</option>
          {OPCOES_PARCELA_MAXIMA.map((v) => (
            <option key={v} value={v}>
              Até {formatarBRL(v).replace(',00', '')}/mês
            </option>
          ))}
        </select>
      </Grupo>
      <Grupo titulo="Cabe no meu bolso">
        {montado && perfil ? (
          <Marcavel
            nome="bolso"
            rotulo={`Só imóveis até ${formatarPrecoCurto(perfil.resultado.poderDeCompra)} (seu poder de compra estimado)`}
            marcado={Boolean(rascunho.bolso)}
            aoMudar={() =>
              alterar(
                'bolso',
                rascunho.bolso ? undefined : Math.round(perfil.resultado.poderDeCompra),
              )
            }
          />
        ) : (
          <p className="text-[0.95rem] text-muted-foreground">
            <Link href="/simulador" className="font-semibold text-primary underline">
              Descubra quanto você pode pagar
            </Link>{' '}
            para ver só os imóveis que cabem no seu bolso.
          </p>
        )}
      </Grupo>
      <Minimo
        nome="quartos"
        rotulo="Quartos"
        valor={rascunho.quartos}
        aoMudar={(v) => alterar('quartos', v)}
      />
      <Minimo
        nome="banheiros"
        rotulo="Banheiros"
        valor={rascunho.banheiros}
        aoMudar={(v) => alterar('banheiros', v)}
      />
      <Minimo
        nome="vagas"
        rotulo="Vagas de garagem"
        valor={rascunho.vagas}
        aoMudar={(v) => alterar('vagas', v)}
      />
      <Grupo titulo="Área útil mínima">
        <label className="sr-only" htmlFor={`${idForm}-${p}-area`}>
          Área útil mínima
        </label>
        <select
          id={`${idForm}-${p}-area`}
          value={rascunho.areaMin ?? ''}
          onChange={(e) => alterar('areaMin', e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Qualquer área</option>
          {OPCOES_AREA_MINIMA.map((v) => (
            <option key={v} value={v}>
              A partir de {v} m²
            </option>
          ))}
        </select>
      </Grupo>
      <Grupo titulo="Condições de pagamento">
        {CONDICOES_FILTRO.map((c) => (
          <Marcavel
            key={c}
            nome="condicoes"
            rotulo={`Aceita ${ROTULO_CONDICAO_CURTO[c]}`.replace('Aceita Entrada', 'Entrada')}
            marcado={rascunho.condicoes.includes(c)}
            aoMudar={() => alternarLista('condicoes', c)}
          />
        ))}
      </Grupo>
    </div>
  );

  const rotuloBotao = `Ver ${plural(contagem, 'imóvel', 'imóveis')}`;
  const limpar = () =>
    setRascunho((r) => ({
      ...r,
      tipo: [],
      situacao: [],
      bairro: undefined,
      precoMin: undefined,
      precoMax: undefined,
      parcelaMax: undefined,
      quartos: undefined,
      banheiros: undefined,
      vagas: undefined,
      areaMin: undefined,
      condicoes: [],
      bolso: undefined,
      pagina: undefined,
    }));

  if (modo === 'lateral') {
    return (
      <form onSubmit={aplicar} aria-label="Filtros da busca">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Filtros</h2>
          <button
            type="button"
            className="min-h-11 px-2 text-sm font-semibold text-primary underline"
            onClick={limpar}
          >
            Limpar
          </button>
        </div>
        {campos('d')}
        <div className="sticky bottom-0 bg-background pt-4 pb-2">
          <Button type="submit" size="lg" className="w-full">
            {rotuloBotao}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden" aria-label="Abrir filtros">
          <SlidersHorizontal className="size-5" aria-hidden /> Filtros
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[92dvh] gap-0 rounded-t-2xl p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-lg font-bold">Filtrar imóveis</SheetTitle>
          <SheetDescription>Escolha o que é importante para você.</SheetDescription>
        </SheetHeader>
        <form
          id={`${idForm}-celular`}
          onSubmit={aplicar}
          className="flex-1 overflow-y-auto px-5 py-4"
        >
          {campos('m')}
        </form>
        <SheetFooter className="flex-row gap-3 border-t bg-background p-4">
          <Button type="button" variant="outline" size="lg" onClick={limpar}>
            Limpar
          </Button>
          <Button type="submit" form={`${idForm}-celular`} size="lg" className="flex-1">
            {rotuloBotao}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
