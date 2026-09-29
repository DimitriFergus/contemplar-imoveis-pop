import {
  COMPROMETIMENTO_MAXIMO_RENDA,
  COTA_MAXIMA_FINANCIAMENTO,
  FAIXAS,
  PRAZO_MAXIMO_MESES,
  REGRAS_FGTS,
} from '@/config/financiamento';
import { formatarPercentual, formatarPreco } from '@/lib/utils/formatar';

export interface PerguntaFrequente {
  pergunta: string;
  resposta: string;
}

const faixaMcmvMaxima = FAIXAS.filter((f) => f.programa === 'MCMV').at(-1);

/** Perguntas reais do público do primeiro imóvel. Números vêm de src/config/financiamento.ts. */
export const FAQ_HOME: PerguntaFrequente[] = [
  {
    pergunta: 'Preciso ter dinheiro para a entrada?',
    resposta: `Na maioria dos financiamentos, o banco paga até ${formatarPercentual(COTA_MAXIMA_FINANCIAMENTO)} do valor do imóvel. O restante pode ser pago com dinheiro, com o saldo do FGTS ou com os dois juntos. Em imóveis na planta, algumas construtoras parcelam a entrada. Além disso, reserve um valor para o ITBI e o cartório.`,
  },
  {
    pergunta: 'Posso usar meu FGTS para comprar o imóvel?',
    resposta: `Em geral, sim, se você tiver pelo menos ${REGRAS_FGTS.anosMinimosTrabalhoCarteira} anos de trabalho com carteira assinada (somando todos os períodos), não tiver outro imóvel na cidade onde mora ou trabalha e o imóvel for residencial. A Caixa confirma as regras no momento da análise.`,
  },
  {
    pergunta: 'Quanto da minha renda pode ir para a parcela?',
    resposta: `Os bancos costumam limitar a parcela a cerca de ${formatarPercentual(COMPROMETIMENTO_MAXIMO_RENDA)} da renda bruta da família. Se você já tem outras dívidas, como empréstimos ou financiamento de veículo, o valor disponível diminui.`,
  },
  {
    pergunta: 'Sou autônomo ou trabalho sem carteira. Consigo financiar?',
    resposta:
      'Em muitos casos, sim. A renda informal pode ser comprovada com extratos bancários, declaração de Imposto de Renda ou outros documentos aceitos pelo banco. Fale com a gente para entender o seu caso.',
  },
  {
    pergunta: 'Tenho o nome negativado. Posso comprar?',
    resposta:
      'Restrições no CPF costumam impedir a aprovação do financiamento. O ideal é regularizar a situação antes. Nós podemos orientar sobre os próximos passos, mas não prometemos aprovação: a decisão é sempre do banco.',
  },
  {
    pergunta: 'Posso somar a renda com outra pessoa?',
    resposta:
      'Sim. É possível compor renda com cônjuge, companheiro(a), parentes ou até amigos, conforme as regras do banco. Todos entram no contrato e têm a renda analisada.',
  },
  {
    pergunta: 'Qual é o prazo máximo do financiamento?',
    resposta: `Os financiamentos habitacionais podem chegar a ${PRAZO_MAXIMO_MESES / 12} anos (${PRAZO_MAXIMO_MESES} meses), respeitando a idade dos compradores. Prazos maiores deixam a parcela menor, mas aumentam o total de juros.`,
  },
  {
    pergunta: 'Qual a diferença entre SAC e Price?',
    resposta:
      'No SAC, a parcela começa maior e diminui com o tempo; no total, você paga menos juros. Na Price, as parcelas são iguais, a primeira é menor, mas o total de juros é maior. No nosso simulador você compara os dois.',
  },
  {
    pergunta: 'Quem pode participar do Minha Casa, Minha Vida?',
    resposta: `Famílias com renda bruta mensal de até ${formatarPreco(faixaMcmvMaxima?.rendaMaxima ?? 0)} (área urbana), que não tenham imóvel próprio nem financiamento habitacional ativo e que não tenham recebido benefício habitacional do governo antes. As regras podem mudar; confira na página do MCMV.`,
  },
  {
    pergunta: 'A parcela mostrada no site é a parcela final?',
    resposta:
      'Não. É uma estimativa com premissas informadas ao lado de cada valor. A parcela real depende da análise do banco, da taxa aprovada, dos seguros, da idade dos compradores e das regras vigentes.',
  },
];
