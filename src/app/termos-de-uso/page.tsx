import type { Metadata } from 'next';
import { AVISO_SIMULACAO } from '@/config/financiamento';
import { SITE } from '@/config/site';
import { PaginaTexto } from '@/components/conteudo/PaginaTexto';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  alternates: { canonical: '/termos-de-uso' },
};

/** Minuta: revisar com assessoria jurídica antes da publicação (ver docs/PENDENCIAS.md). */
export default function PaginaTermos() {
  return (
    <PaginaTexto titulo="Termos de Uso" caminho="/termos-de-uso" atualizadoEm="setembro de 2026">
      <p>Ao usar o site {SITE.nome}, você concorda com estes termos.</p>
      <h2>1. Informações dos imóveis</h2>
      <p>
        Preços, condições, fotos e disponibilidade podem mudar sem aviso prévio. Imagens podem ser
        ilustrativas. A localização exibida no mapa é aproximada; o endereço completo é informado
        pelo corretor.
      </p>
      <h2>2. Simulações</h2>
      <p>{AVISO_SIMULACAO}</p>
      <p>
        Não prometemos aprovação de crédito, taxas, prazos ou subsídios. As regras do Minha Casa,
        Minha Vida e do FGTS são definidas pelo Governo Federal e pela Caixa e podem mudar.
      </p>
      <h2>3. Custos de aquisição</h2>
      <p>
        ITBI, registro e demais custos exibidos são estimativas e devem ser confirmados na
        prefeitura e no cartório.
      </p>
      <h2>4. Uso adequado</h2>
      <p>
        É proibido usar o site para enviar informações falsas, automatizar envios ou copiar o
        conteúdo para fins comerciais.
      </p>
      <h2>5. Propriedade intelectual</h2>
      <p>
        Textos, marcas, ilustrações e o código do site pertencem à Contemplar Imóveis / {SITE.grupo}{' '}
        ou são usados com autorização.
      </p>
      <h2>6. Contato</h2>
      <p>Dúvidas sobre estes termos podem ser enviadas pela página de contato.</p>
    </PaginaTexto>
  );
}
