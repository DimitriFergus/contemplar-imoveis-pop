import type { Metadata } from 'next';
import Link from 'next/link';
import {
  COMPROMETIMENTO_MAXIMO_RENDA,
  FAIXAS,
  PRAZO_MAXIMO_MESES,
  REFERENCIA_FINANCIAMENTO,
  REGRAS_FGTS,
  TETO_FAIXA_1_2_MUNICIPIO,
} from '@/config/financiamento';
import { AvisoSimulacao } from '@/components/comum/AvisoSimulacao';
import { Termo } from '@/components/comum/Termo';
import { Trilha } from '@/components/comum/Trilha';
import { ChecklistDocumentos } from '@/components/conteudo/ChecklistDocumentos';
import { Faq } from '@/components/conteudo/Faq';
import { Button } from '@/components/ui/button';
import type { PerguntaFrequente } from '@/content/faq';
import { formatarPercentual, formatarPreco } from '@/lib/utils/formatar';

export const metadata: Metadata = {
  title: 'Minha Casa, Minha Vida: faixas, quem pode participar e FGTS',
  description:
    'Guia simples do Minha Casa, Minha Vida: faixas de renda, teto do imóvel, taxas de referência, uso do FGTS e documentos.',
  alternates: { canonical: '/minha-casa-minha-vida' },
};

const PERGUNTAS: PerguntaFrequente[] = [
  {
    pergunta: 'O subsídio é garantido?',
    resposta:
      'Não. O subsídio (desconto) existe em algumas faixas, mas o valor depende da renda, da cidade e de análise oficial da Caixa e do programa.',
  },
  {
    pergunta: 'Posso comprar imóvel usado pelo MCMV?',
    resposta:
      'Em muitos casos, sim, desde que o imóvel seja aprovado na avaliação do banco e respeite o teto de valor da faixa. Confirme as regras vigentes com a Caixa.',
  },
  {
    pergunta: 'Quem já tem imóvel pode participar?',
    resposta:
      'Em geral, não. O programa é para quem não tem imóvel próprio nem financiamento habitacional ativo em qualquer lugar do país.',
  },
  {
    pergunta: 'Quanto tempo leva a aprovação?',
    resposta:
      'Depende do banco e da documentação. Com os documentos organizados, a análise costuma andar mais rápido; nós ajudamos em cada etapa.',
  },
];

export default function PaginaMcmv() {
  const faixasMcmv = FAIXAS.filter((f) => f.programa === 'MCMV');
  return (
    <div className="container-site py-6 lg:py-8">
      <Trilha itens={[{ nome: 'Minha Casa, Minha Vida', href: '/minha-casa-minha-vida' }]} />
      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
        Minha Casa, Minha Vida, explicado de um jeito simples
      </h1>
      <p className="mt-2 max-w-3xl text-lg text-muted-foreground">
        O <Termo chave="mcmv">Minha Casa, Minha Vida</Termo> é o programa do Governo Federal que
        facilita a compra do primeiro imóvel, com juros menores e, em algumas faixas,{' '}
        <Termo chave="subsidio">subsídio</Termo>.
      </p>

      <section aria-labelledby="titulo-faixas" className="mt-10">
        <h2 id="titulo-faixas" className="text-2xl font-extrabold">
          As faixas de renda
        </h2>
        <p className="mt-1 text-muted-foreground">
          Valores para área urbana. A renda considerada é a bruta mensal de toda a família.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[40rem] text-left">
            <caption className="sr-only">Faixas do Minha Casa, Minha Vida</caption>
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="p-3">
                  Faixa
                </th>
                <th scope="col" className="p-3">
                  Renda familiar por mês
                </th>
                <th scope="col" className="p-3">
                  Valor máximo do imóvel
                </th>
                <th scope="col" className="p-3">
                  Taxa de referência (ao ano)
                </th>
              </tr>
            </thead>
            <tbody>
              {faixasMcmv.map((f) => (
                <tr key={f.id} className="border-t">
                  <th scope="row" className="p-3 font-bold">
                    {f.nome}
                  </th>
                  <td className="p-3">
                    {f.rendaMinima > 0 ? `De ${formatarPreco(f.rendaMinima)} a ` : 'Até '}
                    {formatarPreco(f.rendaMaxima ?? 0)}
                  </td>
                  <td className="p-3">
                    {f.id === 'faixa1' || f.id === 'faixa2'
                      ? `${formatarPreco(f.tetoImovel ?? 0)}${TETO_FAIXA_1_2_MUNICIPIO.definido ? '' : ' (varia por cidade)'}`
                      : `Até ${formatarPreco(f.tetoImovel ?? 0)}`}
                  </td>
                  <td className="p-3">
                    {f.taxaAnualMinima === f.taxaAnualMaxima
                      ? `cerca de ${formatarPercentual(f.taxaAnualMaxima)}`
                      : `de ${formatarPercentual(f.taxaAnualMinima)} a ${formatarPercentual(f.taxaAnualMaxima)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Referência: {REFERENCIA_FINANCIAMENTO.dataReferencia}.{' '}
          {REFERENCIA_FINANCIAMENTO.observacao}
        </p>
      </section>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="titulo-quem" className="rounded-2xl border bg-card p-5">
          <h2 id="titulo-quem" className="text-xl font-bold">
            Quem pode participar
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Famílias dentro dos limites de renda das faixas.</li>
            <li>Quem não tem imóvel próprio nem financiamento habitacional ativo.</li>
            <li>Quem não recebeu benefício habitacional do governo antes.</li>
            <li>Maiores de 18 anos (ou emancipados), com CPF regular.</li>
          </ul>
        </section>
        <section aria-labelledby="titulo-fgts" className="rounded-2xl border bg-card p-5">
          <h2 id="titulo-fgts" className="text-xl font-bold">
            Usando o <Termo chave="fgts">FGTS</Termo>
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              É preciso ter pelo menos {REGRAS_FGTS.anosMinimosTrabalhoCarteira} anos de trabalho
              com carteira assinada. {REGRAS_FGTS.observacao}
            </li>
            <li>O saldo pode ser usado na entrada, para amortizar ou quitar parcelas.</li>
            <li>Não pode ter outro imóvel na cidade onde mora ou trabalha.</li>
          </ul>
        </section>
        <section aria-labelledby="titulo-parcela" className="rounded-2xl border bg-card p-5">
          <h2 id="titulo-parcela" className="text-xl font-bold">
            Como fica a parcela
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              A parcela costuma ficar em até {formatarPercentual(COMPROMETIMENTO_MAXIMO_RENDA)} da
              renda bruta (<Termo chave="comprometimento">comprometimento de renda</Termo>).
            </li>
            <li>Prazo de até {PRAZO_MAXIMO_MESES / 12} anos, conforme a idade dos compradores.</li>
            <li>
              Você escolhe entre <Termo chave="sac">SAC</Termo> e <Termo chave="price">Price</Termo>
              .
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" variant="destaque">
          <Link href="/simulador">Descobrir minha faixa e meu poder de compra</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/imoveis?condicoes=aceitaMCMV">Ver imóveis que aceitam MCMV</Link>
        </Button>
      </div>
      <AvisoSimulacao className="mt-6" />

      <section aria-labelledby="titulo-docs-mcmv" className="mt-14">
        <h2 id="titulo-docs-mcmv" className="mb-4 text-2xl font-extrabold">
          Documentos
        </h2>
        <ChecklistDocumentos />
      </section>

      <section aria-labelledby="titulo-faq-mcmv" className="mt-14">
        <h2 id="titulo-faq-mcmv" className="mb-4 text-2xl font-extrabold">
          Perguntas frequentes sobre o MCMV
        </h2>
        <Faq perguntas={PERGUNTAS} />
      </section>
    </div>
  );
}
