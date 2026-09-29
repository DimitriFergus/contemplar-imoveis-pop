import type { Metadata } from 'next';
import { CONTATO, EMPRESA, SITE, estaDefinido } from '@/config/site';
import { PaginaTexto } from '@/components/conteudo/PaginaTexto';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Como a Contemplar Imóveis Pop trata seus dados pessoais, conforme a LGPD.',
  alternates: { canonical: '/politica-de-privacidade' },
};

const controlador = estaDefinido(EMPRESA.nomeEmpresarial)
  ? EMPRESA.nomeEmpresarial
  : `${SITE.nome} (razão social a definir)`;
const email = estaDefinido(CONTATO.email) ? CONTATO.email : '[e-mail do encarregado a definir]';

/** Minuta: revisar com assessoria jurídica antes da publicação (ver docs/PENDENCIAS.md). */
export default function PaginaPrivacidade() {
  return (
    <PaginaTexto
      titulo="Política de Privacidade"
      caminho="/politica-de-privacidade"
      atualizadoEm="setembro de 2026"
    >
      <p>
        Esta política explica como {controlador} (&quot;nós&quot;) trata os dados pessoais de quem
        usa o site {SITE.nome}, em conformidade com a Lei Geral de Proteção de Dados (Lei nº
        13.709/2018 — LGPD).
      </p>
      <h2>1. Quais dados coletamos</h2>
      <ul>
        <li>
          <strong>Formulários</strong> (contato, interesse em imóvel, agendamento de visita, anúncio
          e ajuda com simulação): nome, WhatsApp, e-mail (opcional), faixa de renda (opcional),
          código do imóvel, mensagem e data/período de visita.
        </li>
        <li>
          <strong>Origem da visita</strong>: parâmetros de campanha (UTM) presentes no link pelo
          qual você chegou, anexados ao seu contato.
        </li>
        <li>
          <strong>Dados técnicos</strong>: endereço IP, usado apenas para segurança e para limitar
          envios abusivos.
        </li>
      </ul>
      <h2>2. O que fica só no seu aparelho</h2>
      <p>
        Favoritos, lista de comparação, preferências de leitura e os dados que você digita no
        &quot;Cabe no Meu Bolso&quot; (renda, entrada, FGTS, dívidas) ficam{' '}
        <strong>somente no armazenamento do seu navegador</strong> e não são enviados para nós. Você
        pode apagá-los a qualquer momento pelo link &quot;Apagar meus dados deste navegador&quot;,
        no rodapé.
      </p>
      <h2>3. Para que usamos</h2>
      <ul>
        <li>
          Responder ao seu contato e agendar visitas (execução de procedimentos preliminares a
          contrato, a seu pedido).
        </li>
        <li>Orientar sobre financiamento e documentação.</li>
        <li>
          Entender quais campanhas trazem visitantes (legítimo interesse), sem identificar você
          individualmente.
        </li>
      </ul>
      <h2>4. Consentimento</h2>
      <p>
        Os formulários só são enviados com a sua concordância expressa. Você pode revogá-la quando
        quiser pelo e-mail abaixo.
      </p>
      <h2>5. Compartilhamento</h2>
      <p>
        Seus dados podem ser compartilhados com corretores parceiros responsáveis pelo atendimento,
        com ferramentas de gestão de contatos (CRM) contratadas por nós e, quando você pedir, com
        instituições financeiras para análise de crédito. Não vendemos dados pessoais.
      </p>
      <h2>6. Cookies e analytics</h2>
      <p>
        O site não usa cookies de publicidade. Se ferramentas de análise de audiência não essenciais
        forem ativadas, pediremos seu consentimento antes.
      </p>
      <h2>7. Por quanto tempo guardamos</h2>
      <p>
        Pelo tempo necessário ao atendimento e às obrigações legais. Contatos sem andamento são
        excluídos periodicamente.
      </p>
      <h2>8. Seus direitos</h2>
      <p>
        Você pode pedir confirmação, acesso, correção, anonimização, portabilidade ou exclusão dos
        seus dados, e informações sobre compartilhamento, pelo e-mail <strong>{email}</strong>.
      </p>
      <h2>9. Segurança</h2>
      <p>
        Adotamos medidas técnicas para proteger os dados, como conexão criptografada, validação de
        formulários e limite de envios.
      </p>
    </PaginaTexto>
  );
}
