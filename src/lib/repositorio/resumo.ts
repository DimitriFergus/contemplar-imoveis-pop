import { parcelaEstimadaAnuncio } from '@/lib/financiamento';
import type { Imovel, ImovelResumo } from '@/types';

export function paraResumo(i: Imovel): ImovelResumo {
  return {
    id: i.id,
    codigo: i.codigo,
    slug: i.slug,
    titulo: i.titulo,
    tipo: i.tipo,
    situacao: i.situacao,
    previsaoEntrega: i.previsaoEntrega,
    preco: i.preco,
    parcelaEstimada: parcelaEstimadaAnuncio(i.preco).parcela,
    condominioMensal: i.condominioMensal,
    bairro: i.bairro,
    cidade: i.cidade,
    uf: i.uf,
    quartos: i.quartos,
    banheiros: i.banheiros,
    vagas: i.vagas,
    areaUtilM2: i.areaUtilM2,
    condicoes: i.condicoes,
    foto: i.fotos[0] ?? null,
    totalFotos: i.fotos.length,
    localizacaoAproximada: i.localizacaoAproximada,
    status: i.status,
    exemplo: i.exemplo,
    destaque: i.destaque,
    publicadoEm: i.publicadoEm,
  };
}
