import { BadgeCheck } from 'lucide-react';
import { Selo } from '@/components/comum/Selo';
import { ROTULO_CONDICAO, ROTULO_SITUACAO, type ChaveCondicao } from '@/lib/rotulos';
import type { CondicoesPagamento, SituacaoImovel } from '@/types';

const ORDEM: ChaveCondicao[] = [
  'aceitaMCMV',
  'aceitaFGTS',
  'entradaFacilitada',
  'aceitaConsorcio',
  'aceitaPermuta',
];

export function SelosCondicoes({
  condicoes,
  situacao,
  limite,
}: {
  condicoes: CondicoesPagamento;
  situacao?: SituacaoImovel;
  limite?: number;
}) {
  const ativos = ORDEM.filter((c) => condicoes[c]);
  const visiveis = limite ? ativos.slice(0, limite) : ativos;
  const restantes = ativos.length - visiveis.length;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Condições de pagamento">
      {situacao && (situacao === 'pronto' || situacao === 'na_planta') && (
        <li>
          <Selo tom="info">{ROTULO_SITUACAO[situacao]}</Selo>
        </li>
      )}
      {visiveis.map((c) => (
        <li key={c}>
          <Selo tom="neutro" icone={<BadgeCheck className="size-3.5 text-sucesso" aria-hidden />}>
            {ROTULO_CONDICAO[c]}
          </Selo>
        </li>
      ))}
      {restantes > 0 && (
        <li>
          <Selo tom="neutro">+{restantes}</Selo>
        </li>
      )}
    </ul>
  );
}
