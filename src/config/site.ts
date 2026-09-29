/**
 * Configurações gerais do site: identidade, contatos, dados legais e cidade base.
 *
 * Campos com o valor `A_DEFINIR` precisam ser preenchidos antes da publicação.
 * Enquanto não forem preenchidos, o site exibe um alerta visual no modo desenvolvimento
 * e todos eles aparecem listados em `docs/PENDENCIAS.md`.
 */

export const A_DEFINIR = 'A_DEFINIR' as const;

export function estaDefinido(valor: string | null | undefined): valor is string {
  return Boolean(valor) && valor !== A_DEFINIR;
}

export const SITE = {
  nome: 'Contemplar Imóveis Pop',
  nomeCurto: 'Contemplar Pop',
  slogan: 'Seu primeiro imóvel cabe no seu bolso',
  descricao:
    'Casas e apartamentos a partir de R$ 150 mil, com Minha Casa, Minha Vida, FGTS e entrada facilitada. Descubra quanto você pode pagar e fale com a gente pelo WhatsApp.',
  /** URL pública do site, sem barra no final. Pode ser sobrescrita por NEXT_PUBLIC_SITE_URL. */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'),
  idioma: 'pt-BR',
  grupo: 'Grupo Ordnas',
  /** Posicionamento de preço da marca ("imóveis a partir de ..."). */
  precoAPartirDe: 150_000,
} as const;

/** Dados legais exigidos pelo CRECI e pelo Código de Defesa do Consumidor. */
export const EMPRESA = {
  nomeEmpresarial: A_DEFINIR as string,
  cnpj: '61.569.798/0001-81',
  /** Número de inscrição no CRECI da empresa. */
  creciPJ: 'CRECI-CE 27799',
  endereco:
    'Rua P, 150 – Parque Montenegro II, Prefeito José Walter, Fortaleza – CE, CEP 60751-380',
  /** Texto usado para localizar o endereço no Google Maps (página "Anuncie seu imóvel"). */
  enderecoMapa: 'Rua P, 150, Parque Montenegro II, Prefeito José Walter, Fortaleza - CE, 60751-380',
  horarioAtendimento: 'Segunda a sexta, das 8h às 18h; sábado, das 8h às 12h',
};

export const CONTATO = {
  /** WhatsApp principal no formato internacional, só dígitos: 55 + DDD + número. */
  whatsapp: '5585992104920',
  telefoneExibicao: '(85) 99210-4920',
  email: A_DEFINIR as string,
};

export const REDES_SOCIAIS: { nome: string; url: string }[] = [
  // { nome: 'Instagram', url: 'https://instagram.com/...' },
];

/** Mensagens padrão do WhatsApp. `{codigo}`, `{titulo}` e `{origem}` são substituídos. */
export const MENSAGENS_WHATSAPP = {
  geral:
    'Olá! Vim pelo site da Contemplar Imóveis Pop e gostaria de ajuda para encontrar um imóvel.',
  imovel: 'Olá! Tenho interesse no imóvel {codigo} ({titulo}). Vi no site.',
  simulador:
    'Olá! Fiz uma simulação no site da Contemplar Imóveis Pop e quero ajuda para ver os imóveis que cabem no meu bolso.',
  anuncie: 'Olá! Quero anunciar meu imóvel com a Contemplar Imóveis Pop.',
  /** Acrescentado ao final quando há origem de campanha (UTM). */
  sufixoOrigem: ' (origem: {origem})',
} as const;

/** Cidade base da operação. Enquanto não definida, usamos nomes claramente fictícios. */
export const CIDADE_BASE = 'Cidade Exemplo';
export const UF_BASE = 'EX';
export const CIDADE_BASE_DEFINIDA = false;

/** Centro do mapa da cidade base (A_DEFINIR: coordenadas reais da cidade). */
export const CENTRO_MAPA = { lat: -23.5505, lng: -46.6333, zoom: 13 } as const;

export interface BairroExemplo {
  nome: string;
  lat: number;
  lng: number;
}

/** Bairros usados nos imóveis de exemplo (fictícios). Substituir pelos bairros reais. */
export const BAIRROS_EXEMPLO: BairroExemplo[] = [
  { nome: 'Jardim Exemplo', lat: -23.5405, lng: -46.6453 },
  { nome: 'Parque das Flores Demo', lat: -23.5615, lng: -46.6203 },
  { nome: 'Vila Modelo', lat: -23.5352, lng: -46.6181 },
  { nome: 'Residencial Horizonte Demo', lat: -23.5688, lng: -46.6451 },
  { nome: 'Conjunto Esperança Demo', lat: -23.5512, lng: -46.6027 },
  { nome: 'Jardim Ipê Fictício', lat: -23.5259, lng: -46.6352 },
];

/** Modo demonstração: faixa no topo e selo "Imóvel ilustrativo" nos imóveis de exemplo. */
export const MODO_DEMO = process.env.NEXT_PUBLIC_MODO_DEMO === 'true';

/** Agendamento de visitas. */
export const AGENDAMENTO = {
  diasAFrente: 14,
  /** 0 = domingo, 6 = sábado. */
  diasSemanaIndisponiveis: [0],
  periodos: [
    { valor: 'manha', rotulo: 'Manhã', horario: '8h às 12h' },
    { valor: 'tarde', rotulo: 'Tarde', horario: '13h às 18h' },
    { valor: 'noite', rotulo: 'Noite', horario: '18h às 20h' },
  ],
} as const;

/** Listagem de imóveis. */
export const LISTAGEM = {
  porPagina: 12,
  maxComparar: 3,
  maxSemelhantes: 4,
  /** Diferença de preço (para mais ou para menos) usada para achar imóveis semelhantes. */
  variacaoPrecoSemelhantes: 0.25,
};

/** Atalhos de busca exibidos na home. */
export const ATALHO_PRECO_MAXIMO = 200_000;

/** Opções dos seletores de preço e parcela na busca. */
export const OPCOES_PRECO_MAXIMO = [
  160_000, 180_000, 200_000, 220_000, 250_000, 280_000, 320_000, 400_000,
];
export const OPCOES_PRECO_MINIMO = [150_000, 180_000, 200_000, 250_000, 300_000];
export const OPCOES_PARCELA_MAXIMA = [800, 1_000, 1_200, 1_500, 1_800, 2_200, 2_600];
export const OPCOES_AREA_MINIMA = [40, 50, 60, 70, 80];
export const OPCOES_MINIMO_COMODOS = [1, 2, 3];

/** Limite de envios de formulário por IP. */
export const LIMITE_LEADS = {
  maxRequisicoes: Number(process.env.LIMITE_LEADS_MAX ?? 5),
  janelaMs: 10 * 60 * 1000,
};

/** Camada de analytics fica desativada até haver configuração (e consentimento, se aplicável). */
export const ANALYTICS_ATIVO = process.env.NEXT_PUBLIC_ANALYTICS_ATIVO === 'true';

/**
 * Versão estática (GitHub Pages): sem servidor. Filtros rodam no navegador e os formulários
 * são enviados pelo WhatsApp. Definido no workflow de publicação.
 */
export const MODO_ESTATICO = process.env.NEXT_PUBLIC_MODO_ESTATICO === 'true';

/** Prefixo do endereço quando o site fica numa subpasta (ex.: /contemplar-imoveis-pop). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
