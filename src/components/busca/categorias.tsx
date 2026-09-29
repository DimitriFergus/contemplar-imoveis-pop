import type { Metadata } from 'next';
import { CIDADE_BASE } from '@/config/site';
import { ROTULO_TIPO_PLURAL, SLUG_CATEGORIA_TIPO } from '@/lib/rotulos';
import { metadadosListagem } from '@/lib/seo';
import type { TipoImovel } from '@/types';
import { PaginaListagem, type ParamsBusca } from './PaginaListagem';

const INTRODUCOES: Partial<Record<TipoImovel, string>> = {
  casa: 'Casas térreas com quintal, prontas, usadas ou na planta, para o seu primeiro imóvel.',
  apartamento:
    'Apartamentos de 1 a 3 quartos em condomínios com portaria e lazer, ideais para quem quer praticidade.',
  casa_condominio: 'Casas em condomínio fechado: mais segurança e áreas de lazer para a família.',
  duplex: 'Imóveis de dois andares com mais espaço e privacidade.',
  sobrado: 'Sobrados com mais cômodos e espaço para a família crescer.',
};

type Props = { searchParams: Promise<ParamsBusca> };

/** Fábrica das páginas /imoveis/casas, /imoveis/apartamentos etc. */
export function criarPaginaCategoria(tipo: TipoImovel) {
  const caminho = `/imoveis/${SLUG_CATEGORIA_TIPO[tipo]}`;
  const titulo = `${ROTULO_TIPO_PLURAL[tipo]} à venda em ${CIDADE_BASE}`;
  const introducao = INTRODUCOES[tipo];

  async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    return metadadosListagem(caminho, searchParams, titulo, introducao ?? titulo);
  }

  async function Pagina({ searchParams }: Props) {
    return (
      <PaginaListagem
        searchParams={searchParams}
        caminho={caminho}
        fixos={{ tipo: [tipo] }}
        titulo={titulo}
        introducao={introducao}
        trilha={[
          { nome: 'Imóveis', href: '/imoveis' },
          { nome: ROTULO_TIPO_PLURAL[tipo], href: caminho },
        ]}
      />
    );
  }

  return { generateMetadata, Pagina };
}
