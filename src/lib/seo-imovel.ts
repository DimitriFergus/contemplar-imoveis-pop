import { EMPRESA, SITE, estaDefinido } from '@/config/site';
import { ROTULO_TIPO } from '@/lib/rotulos';
import type { Imovel } from '@/types';

const TIPO_SCHEMA: Record<Imovel['tipo'], string> = {
  casa: 'SingleFamilyResidence',
  casa_condominio: 'SingleFamilyResidence',
  sobrado: 'SingleFamilyResidence',
  duplex: 'SingleFamilyResidence',
  apartamento: 'Apartment',
  kitnet: 'Apartment',
};

const DISPONIBILIDADE: Record<Imovel['status'], string> = {
  disponivel: 'https://schema.org/InStock',
  reservado: 'https://schema.org/LimitedAvailability',
  vendido: 'https://schema.org/SoldOut',
};

/** JSON-LD: anúncio imobiliário (RealEstateListing) com oferta de venda em BRL. Sem endereço exato. */
export function jsonLdImovel(i: Imovel): Record<string, unknown> {
  const url = `${SITE.url}/imoveis/${i.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': url,
    url,
    name: i.titulo,
    description: i.descricao,
    datePosted: i.publicadoEm,
    dateModified: i.atualizadoEm,
    image: i.fotos.map((f) => `${SITE.url}${f.arquivo}`),
    identifier: i.codigo,
    offers: {
      '@type': 'Offer',
      price: i.preco,
      priceCurrency: 'BRL',
      availability: DISPONIBILIDADE[i.status],
      businessFunction: 'https://purl.org/goodrelations/v1#Sell',
      seller: {
        '@type': 'RealEstateAgent',
        name: estaDefinido(EMPRESA.nomeEmpresarial) ? EMPRESA.nomeEmpresarial : SITE.nome,
        url: SITE.url,
      },
    },
    about: {
      '@type': TIPO_SCHEMA[i.tipo],
      name: `${ROTULO_TIPO[i.tipo]} em ${i.bairro}`,
      numberOfRooms: i.quartos,
      numberOfBedrooms: i.quartos,
      numberOfBathroomsTotal: i.banheiros,
      floorSize: { '@type': 'QuantitativeValue', value: i.areaUtilM2, unitCode: 'MTK' },
      address: {
        '@type': 'PostalAddress',
        addressLocality: i.cidade,
        addressRegion: i.uf,
        addressCountry: 'BR',
        streetAddress: i.bairro,
      },
      amenityFeature: [...i.caracteristicas, ...i.lazer].map((c) => ({
        '@type': 'LocationFeatureSpecification',
        name: c,
        value: true,
      })),
    },
  };
}
