'use client';

import { Carrossel } from '@/components/comum/Carrossel';
import { MODO_ESTATICO } from '@/config/site';
import { selecionarDestaques } from '@/lib/busca/query';
import { useTodosResumos } from '@/lib/cliente/resumos';
import type { ImovelResumo } from '@/types';
import { CardImovel } from './CardImovel';

/**
 * Carrossel "Imóveis em destaque" da página inicial. Na versão estática (GitHub Pages) os
 * destaques gerados na publicação são trocados pelos lidos do banco na hora, com a mesma
 * regra do repositório (todos os imóveis da equipe, depois exemplos até completar).
 */
export function DestaquesAoVivo({
  iniciais,
  limite = 8,
}: {
  iniciais: ImovelResumo[];
  limite?: number;
}) {
  const { imoveis: aoVivo } = useTodosResumos(MODO_ESTATICO);
  const destaques = aoVivo ? selecionarDestaques(aoVivo, limite) : iniciais;
  return (
    <Carrossel rotulo="Imóveis em destaque (use as setas ou arraste para o lado)">
      {destaques.map((i, idx) => (
        <li key={i.id} className="w-[85%] max-w-sm shrink-0 sm:w-80">
          <CardImovel imovel={i} prioridade={idx === 0} />
        </li>
      ))}
    </Carrossel>
  );
}
