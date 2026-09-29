import { custosDoMunicipio, type CustosMunicipio } from '@/config/custos-aquisicao';
import { COTA_MAXIMA_FINANCIAMENTO } from '@/config/financiamento';
import { calcularValorFinanciado } from './simulacao';

export interface EntradaCustoAquisicao {
  preco: number;
  entrada: number;
  fgts: number;
  cidade: string;
  uf: string;
  cotaMaxima?: number;
}

export interface CustoAquisicao {
  preco: number;
  valorFinanciado: number;
  /** Recursos próprios pagos no imóvel (entrada + FGTS), respeitando a cota máxima. */
  recursosProprios: number;
  itbi: number;
  registroCartorio: number;
  /** Total a desembolsar fora do financiamento: recursos próprios + ITBI + cartório. */
  totalDesembolsoInicial: number;
  regras: CustosMunicipio;
}

export function calcularCustoAquisicao(e: EntradaCustoAquisicao): CustoAquisicao {
  const regras = custosDoMunicipio(e.cidade, e.uf);
  const { financiado } = calcularValorFinanciado(
    e.preco,
    e.entrada,
    e.fgts,
    e.cotaMaxima ?? COTA_MAXIMA_FINANCIAMENTO,
  );
  const aliquotaFinanciada = regras.itbi.aliquotaParteFinanciadaSFH ?? regras.itbi.aliquota;
  const itbi = (e.preco - financiado) * regras.itbi.aliquota + financiado * aliquotaFinanciada;
  const registroCartorio = e.preco * regras.registroCartorioEstimado;
  const recursosProprios = e.preco - financiado;
  return {
    preco: e.preco,
    valorFinanciado: financiado,
    recursosProprios,
    itbi,
    registroCartorio,
    totalDesembolsoInicial: recursosProprios + itbi + registroCartorio,
    regras,
  };
}
