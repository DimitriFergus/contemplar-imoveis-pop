export interface PassoJornada {
  titulo: string;
  resumo: string;
  detalhes: string[];
  icone: 'calculadora' | 'casa' | 'banco' | 'contrato' | 'chave';
}

/** Jornada "Da simulação às chaves" (5 passos). */
export const JORNADA: PassoJornada[] = [
  {
    titulo: 'Simule',
    resumo: 'Descubra quanto você pode pagar por mês e o valor de imóvel que cabe no seu bolso.',
    detalhes: [
      'Use o "Cabe no Meu Bolso" com a renda da família, a entrada e o saldo de FGTS.',
      'Veja a faixa provável do Minha Casa, Minha Vida.',
      'O resultado é uma estimativa; a aprovação é sempre do banco.',
    ],
    icone: 'calculadora',
  },
  {
    titulo: 'Escolha',
    resumo: 'Filtre os imóveis que cabem no orçamento e agende visitas sem compromisso.',
    detalhes: [
      'Salve seus favoritos e compare até 3 imóveis lado a lado.',
      'Visite o imóvel e o bairro em horários diferentes.',
      'Tire dúvidas com o corretor pelo WhatsApp.',
    ],
    icone: 'casa',
  },
  {
    titulo: 'Aprove o crédito',
    resumo: 'Com a nossa ajuda, você envia os documentos para análise do banco.',
    detalhes: [
      'O banco analisa renda, CPF e documentos da família.',
      'Um engenheiro avalia o imóvel.',
      'Você recebe as condições reais: taxa, prazo, parcela e subsídio, se houver.',
    ],
    icone: 'banco',
  },
  {
    titulo: 'Assine',
    resumo: 'Assinatura do contrato de financiamento e pagamento dos impostos e taxas.',
    detalhes: [
      'Leia o contrato com calma e tire todas as dúvidas antes de assinar.',
      'Pague o ITBI e as taxas de registro (valores variam por cidade).',
      'O contrato é registrado no Cartório de Registro de Imóveis.',
    ],
    icone: 'contrato',
  },
  {
    titulo: 'Receba as chaves',
    resumo: 'Com o registro concluído, o imóvel é seu. É hora da mudança!',
    detalhes: [
      'Imóvel pronto ou usado: entrega após o registro e a liberação do banco.',
      'Imóvel na planta: entrega na data prevista em contrato pela construtora.',
      'Guarde todos os documentos e comprovantes.',
    ],
    icone: 'chave',
  },
];

export interface GrupoDocumentos {
  titulo: string;
  itens: string[];
}

/** Checklist de documentos (lista de referência; o banco pode pedir outros). */
export const DOCUMENTOS: GrupoDocumentos[] = [
  {
    titulo: 'Documentos pessoais (de todos que vão compor a renda)',
    itens: [
      'RG e CPF, ou CNH',
      'Certidão de nascimento ou de casamento (com averbação, se houver divórcio)',
      'Comprovante de residência atualizado (conta de luz, água ou telefone)',
      'Carteira de Trabalho (CTPS), física ou digital',
    ],
  },
  {
    titulo: 'Comprovação de renda',
    itens: [
      'Assalariado: 3 últimos contracheques',
      'Autônomo ou informal: extratos bancários dos últimos meses e/ou declaração de renda',
      'Aposentado ou pensionista: extrato de benefício do INSS',
      'Declaração do Imposto de Renda completa, com recibo, se declarar',
    ],
  },
  {
    titulo: 'Para usar o FGTS',
    itens: [
      'Extrato do FGTS atualizado (aplicativo FGTS)',
      'Número do PIS/PASEP',
      'Declaração de que não tem outro imóvel na mesma cidade (modelo da Caixa)',
    ],
  },
  {
    titulo: 'Do imóvel (normalmente providenciados pelo vendedor ou pela imobiliária)',
    itens: [
      'Matrícula atualizada do imóvel',
      'Certidões negativas do imóvel e do vendedor',
      'IPTU do ano',
      'Habite-se (imóveis novos) e documentos da construtora (imóveis na planta)',
    ],
  },
];
