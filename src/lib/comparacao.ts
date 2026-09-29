import { formatarBRL, formatarPrecoCurto, plural } from '@/lib/utils/formatar';
import type { ImovelResumo } from '@/types';

export type Resultado = 'ganha' | 'perde' | 'igual';

export interface Diferenca {
  chave: 'preco' | 'parcela' | 'area' | 'quartos' | 'banheiros' | 'vagas' | 'condominio';
  rotulo: string;
  /** Valor do imóvel comparado, já formatado. */
  valor: string;
  /** Valor do imóvel base, já formatado. */
  valorBase: string;
  resultado: Resultado;
  /** Frase curta, do ponto de vista do imóvel comparado (ex.: "R$ 12 mil mais barato"). */
  texto: string;
}

type Campos = Pick<
  ImovelResumo,
  | 'preco'
  | 'parcelaEstimada'
  | 'areaUtilM2'
  | 'quartos'
  | 'banheiros'
  | 'vagas'
  | 'condominioMensal'
>;

const reais = (v: number) => formatarBRL(v).replace(/,00$/, '');

function comparar(valor: number, base: number, menorEhMelhor: boolean): Resultado {
  if (Math.abs(valor - base) < 0.5) return 'igual';
  return valor < base === menorEhMelhor ? 'ganha' : 'perde';
}

/**
 * Compara um imóvel com o imóvel base da comparação.
 * "ganha" = melhor para quem compra (mais barato, parcela menor, mais espaço, mais quartos...).
 */
export function compararImoveis(imovel: Campos, base: Campos): Diferenca[] {
  const cond = imovel.condominioMensal ?? 0;
  const condBase = base.condominioMensal ?? 0;
  const dif = (a: number, b: number) => Math.abs(a - b);

  const itens: Diferenca[] = [
    {
      chave: 'preco',
      rotulo: 'Preço',
      valor: formatarPrecoCurto(imovel.preco),
      valorBase: formatarPrecoCurto(base.preco),
      resultado: comparar(imovel.preco, base.preco, true),
      texto: `${formatarPrecoCurto(dif(imovel.preco, base.preco))} ${imovel.preco < base.preco ? 'mais barato' : 'mais caro'}`,
    },
    {
      chave: 'parcela',
      rotulo: 'Parcela estimada',
      valor: `${reais(Math.round(imovel.parcelaEstimada))}/mês`,
      valorBase: `${reais(Math.round(base.parcelaEstimada))}/mês`,
      resultado: comparar(
        Math.round(imovel.parcelaEstimada),
        Math.round(base.parcelaEstimada),
        true,
      ),
      texto: `Parcela ${reais(Math.round(dif(imovel.parcelaEstimada, base.parcelaEstimada)))} ${imovel.parcelaEstimada < base.parcelaEstimada ? 'menor' : 'maior'}`,
    },
    {
      chave: 'area',
      rotulo: 'Área útil',
      valor: `${imovel.areaUtilM2} m²`,
      valorBase: `${base.areaUtilM2} m²`,
      resultado: comparar(imovel.areaUtilM2, base.areaUtilM2, false),
      texto: `${dif(imovel.areaUtilM2, base.areaUtilM2)} m² ${imovel.areaUtilM2 > base.areaUtilM2 ? 'maior' : 'menor'}`,
    },
    {
      chave: 'quartos',
      rotulo: 'Quartos',
      valor: String(imovel.quartos),
      valorBase: String(base.quartos),
      resultado: comparar(imovel.quartos, base.quartos, false),
      texto: `${imovel.quartos > base.quartos ? '+' : '−'}${plural(dif(imovel.quartos, base.quartos), 'quarto', 'quartos')}`,
    },
    {
      chave: 'banheiros',
      rotulo: 'Banheiros',
      valor: String(imovel.banheiros),
      valorBase: String(base.banheiros),
      resultado: comparar(imovel.banheiros, base.banheiros, false),
      texto: `${imovel.banheiros > base.banheiros ? '+' : '−'}${plural(dif(imovel.banheiros, base.banheiros), 'banheiro', 'banheiros')}`,
    },
    {
      chave: 'vagas',
      rotulo: 'Vagas',
      valor: imovel.vagas ? String(imovel.vagas) : 'Nenhuma',
      valorBase: base.vagas ? String(base.vagas) : 'Nenhuma',
      resultado: comparar(imovel.vagas, base.vagas, false),
      texto:
        imovel.vagas === 0
          ? 'Sem vaga'
          : `${imovel.vagas > base.vagas ? '+' : '−'}${plural(dif(imovel.vagas, base.vagas), 'vaga', 'vagas')}`,
    },
    {
      chave: 'condominio',
      rotulo: 'Condomínio',
      valor: cond ? `${reais(cond)}/mês` : 'Não tem',
      valorBase: condBase ? `${reais(condBase)}/mês` : 'Não tem',
      resultado: comparar(cond, condBase, true),
      texto:
        cond === 0
          ? 'Sem condomínio'
          : `Condomínio ${reais(dif(cond, condBase))} ${cond < condBase ? 'menor' : 'maior'}`,
    },
  ];
  return itens;
}

export function placar(diferencas: Diferenca[]) {
  return {
    ganha: diferencas.filter((d) => d.resultado === 'ganha').length,
    perde: diferencas.filter((d) => d.resultado === 'perde').length,
  };
}
