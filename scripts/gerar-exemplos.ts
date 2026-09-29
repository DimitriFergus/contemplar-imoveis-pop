/**
 * Gera os 24 imóveis FICTÍCIOS de demonstração em `dados/imoveis.csv`, com ilustrações em
 * `public/imoveis/<CODIGO>/`, além de `dados/corretores.csv` e `dados/MODELO_IMOVEIS.csv`.
 *
 * Uso: npm run gerar-exemplos   (depois: npm run importar)
 *
 * ATENÇÃO: sobrescreve dados/imoveis.csv. Use só para recriar a base de demonstração.
 * O resultado é determinístico (mesma semente = mesmos imóveis).
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BAIRROS_EXEMPLO, CIDADE_BASE, UF_BASE } from '../src/config/site';
import { FAIXAS } from '../src/config/financiamento';
import { COLUNAS_CSV, imovelParaLinha } from '../src/lib/importacao/imovel-csv';
import { ROTULO_TIPO } from '../src/lib/rotulos';
import { escreverCSV } from '../src/lib/utils/csv';
import { slugImovel } from '../src/lib/utils/slug';
import type { Imovel, Proximidade, SituacaoImovel, TipoImovel } from '../src/types';
import {
  PALETAS,
  areaExterna,
  banheiro,
  cozinha,
  fachadaCasa,
  fachadaPredio,
  fachadaSobrado,
  quarto,
  sala,
} from './ilustracoes';

const RAIZ = path.resolve(import.meta.dirname, '..');

// PRNG determinístico (mulberry32)
let semente = 20260929;
function aleatorio(): number {
  semente |= 0;
  semente = (semente + 0x6d2b79f5) | 0;
  let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const entre = (min: number, max: number) => min + aleatorio() * (max - min);
const inteiro = (min: number, max: number) => Math.floor(entre(min, max + 1));
const escolher = <T>(lista: readonly T[]): T => lista[Math.floor(aleatorio() * lista.length)] as T;
function sortear<T>(lista: readonly T[], qtd: number): T[] {
  const copia = [...lista];
  const saida: T[] = [];
  while (saida.length < qtd && copia.length)
    saida.push(copia.splice(Math.floor(aleatorio() * copia.length), 1)[0] as T);
  return saida;
}

interface Especificacao {
  tipo: TipoImovel;
  situacao: SituacaoImovel;
  quartos: number;
  area: number;
  terreno?: number;
  bairro: number;
  vagas: number;
  destaque?: boolean;
  status?: Imovel['status'];
}

/**
 * 24 imóveis: 10 casas, 8 apartamentos, 3 casas em condomínio, 2 duplex, 1 sobrado.
 * Áreas no padrão popular: apartamentos 40–60 m²; casas 50–90 m² em terrenos de 100–250 m².
 */
const ESPECIFICACOES: Especificacao[] = [
  {
    tipo: 'casa',
    situacao: 'usado',
    quartos: 2,
    area: 58,
    terreno: 125,
    bairro: 0,
    vagas: 1,
    destaque: true,
  },
  {
    tipo: 'apartamento',
    situacao: 'na_planta',
    quartos: 2,
    area: 44,
    bairro: 1,
    vagas: 1,
    destaque: true,
  },
  { tipo: 'casa', situacao: 'pronto', quartos: 2, area: 62, terreno: 150, bairro: 3, vagas: 1 },
  {
    tipo: 'apartamento',
    situacao: 'pronto',
    quartos: 2,
    area: 48,
    bairro: 0,
    vagas: 1,
    destaque: true,
  },
  {
    tipo: 'casa_condominio',
    situacao: 'pronto',
    quartos: 2,
    area: 64,
    terreno: 140,
    bairro: 5,
    vagas: 1,
    destaque: true,
  },
  { tipo: 'casa', situacao: 'usado', quartos: 3, area: 78, terreno: 200, bairro: 4, vagas: 2 },
  { tipo: 'apartamento', situacao: 'usado', quartos: 2, area: 46, bairro: 4, vagas: 1 },
  {
    tipo: 'casa',
    situacao: 'na_planta',
    quartos: 2,
    area: 55,
    terreno: 125,
    bairro: 3,
    vagas: 1,
    destaque: true,
  },
  { tipo: 'duplex', situacao: 'pronto', quartos: 2, area: 72, bairro: 1, vagas: 1 },
  { tipo: 'apartamento', situacao: 'em_construcao', quartos: 2, area: 50, bairro: 2, vagas: 1 },
  { tipo: 'casa', situacao: 'usado', quartos: 1, area: 50, terreno: 100, bairro: 4, vagas: 0 },
  {
    tipo: 'sobrado',
    situacao: 'pronto',
    quartos: 3,
    area: 90,
    terreno: 180,
    bairro: 2,
    vagas: 2,
    destaque: true,
  },
  { tipo: 'apartamento', situacao: 'na_planta', quartos: 3, area: 58, bairro: 5, vagas: 1 },
  {
    tipo: 'casa',
    situacao: 'pronto',
    quartos: 3,
    area: 70,
    terreno: 160,
    bairro: 0,
    vagas: 1,
    status: 'reservado',
  },
  {
    tipo: 'casa_condominio',
    situacao: 'na_planta',
    quartos: 2,
    area: 56,
    terreno: 120,
    bairro: 3,
    vagas: 1,
  },
  { tipo: 'apartamento', situacao: 'pronto', quartos: 1, area: 41, bairro: 2, vagas: 0 },
  {
    tipo: 'casa',
    situacao: 'usado',
    quartos: 2,
    area: 66,
    terreno: 175,
    bairro: 1,
    vagas: 1,
    destaque: true,
  },
  { tipo: 'duplex', situacao: 'usado', quartos: 3, area: 86, bairro: 5, vagas: 2 },
  { tipo: 'apartamento', situacao: 'usado', quartos: 2, area: 52, bairro: 3, vagas: 1 },
  { tipo: 'casa', situacao: 'na_planta', quartos: 3, area: 72, terreno: 150, bairro: 5, vagas: 2 },
  {
    tipo: 'casa_condominio',
    situacao: 'pronto',
    quartos: 3,
    area: 82,
    terreno: 180,
    bairro: 2,
    vagas: 2,
  },
  {
    tipo: 'casa',
    situacao: 'usado',
    quartos: 2,
    area: 54,
    terreno: 110,
    bairro: 1,
    vagas: 1,
    status: 'vendido',
  },
  {
    tipo: 'apartamento',
    situacao: 'na_planta',
    quartos: 2,
    area: 47,
    bairro: 4,
    vagas: 1,
    destaque: true,
  },
  { tipo: 'casa', situacao: 'pronto', quartos: 3, area: 88, terreno: 240, bairro: 2, vagas: 2 },
];

/** Valorização relativa de cada bairro fictício (mesma ordem de BAIRROS_EXEMPLO). */
const INDICE_BAIRRO = [1.0, 1.06, 1.14, 0.95, 0.9, 1.04];
const PRECO_M2_BASE: Record<TipoImovel, number> = {
  casa: 2_450,
  apartamento: 4_050,
  casa_condominio: 3_050,
  duplex: 3_500,
  sobrado: 3_500,
  kitnet: 4_200,
};
const PRECO_M2_TERRENO: Partial<Record<TipoImovel, number>> = {
  casa: 330,
  casa_condominio: 240,
  sobrado: 280,
};
const FATOR_SITUACAO: Record<SituacaoImovel, number> = {
  na_planta: 1.03,
  em_construcao: 1.02,
  pronto: 1,
  usado: 0.88,
};

function precoCoerente(e: Especificacao): number {
  const base = e.area * PRECO_M2_BASE[e.tipo] + (e.terreno ?? 0) * (PRECO_M2_TERRENO[e.tipo] ?? 0);
  const bruto =
    base * (INDICE_BAIRRO[e.bairro] ?? 1) * FATOR_SITUACAO[e.situacao] * entre(0.97, 1.03);
  const arredondado = Math.round(bruto / 1_000) * 1_000;
  return Math.min(420_000, Math.max(150_000, arredondado));
}

const CARACTERISTICAS: Record<'casa' | 'apartamento', string[]> = {
  casa: [
    'quintal',
    'área de serviço coberta',
    'piso cerâmico',
    'portão eletrônico',
    'lavanderia',
    'churrasqueira',
    'muro alto',
    'garagem coberta',
    'cozinha americana',
    'janelas com grade',
    'aquecedor solar',
  ],
  apartamento: [
    'varanda',
    'piso laminado nos quartos',
    'piso cerâmico',
    'cozinha americana',
    'área de serviço',
    'elevador',
    'portaria 24 horas',
    'interfone',
    'janelas amplas',
    'medidor de água individual',
  ],
};
const LAZER_CONDOMINIO = [
  'playground',
  'salão de festas',
  'churrasqueira',
  'quadra',
  'piscina',
  'espaço pet',
  'bicicletário',
  'academia ao ar livre',
];

const ESCOLAS = [
  'Escola Municipal Exemplo',
  'Creche Municipal Pequeno Demo',
  'Escola Estadual Modelo',
  'EMEF Horizonte Fictício',
];
const SAUDE = ['UBS Demo', 'Posto de Saúde Exemplo', 'Clínica da Família Modelo'];
const MERCADOS = [
  'Mercado do Bairro (exemplo)',
  'Supermercado Demo',
  'Feira livre de sábado (exemplo)',
  'Padaria e Mercearia Modelo',
];
const TRANSPORTE = ['Ponto de ônibus (linha exemplo)', 'Terminal de ônibus Demo', 'Estação Modelo'];
const LAZER_PROX = ['Praça Exemplo', 'Parque Linear Demo', 'Centro Esportivo Modelo'];

function proximidades(bairro: string): Proximidade[] {
  const itens: Proximidade[] = [
    { tipo: 'escola', nome: escolher(ESCOLAS), distanciaMetros: inteiro(15, 90) * 10 },
    {
      tipo: 'saude',
      nome: `${escolher(SAUDE)} ${bairro.split(' ')[0]}`,
      distanciaMetros: inteiro(30, 150) * 10,
    },
    { tipo: 'mercado', nome: escolher(MERCADOS), distanciaMetros: inteiro(10, 80) * 10 },
    { tipo: 'transporte', nome: escolher(TRANSPORTE), distanciaMetros: inteiro(5, 50) * 10 },
  ];
  if (aleatorio() > 0.4)
    itens.push({
      tipo: 'lazer',
      nome: escolher(LAZER_PROX),
      distanciaMetros: inteiro(20, 120) * 10,
    });
  return itens.sort((a, b) => a.distanciaMetros - b.distanciaMetros);
}

const nomeTipoTitulo: Record<TipoImovel, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  casa_condominio: 'Casa em condomínio',
  duplex: 'Duplex',
  sobrado: 'Sobrado',
  kitnet: 'Kitnet',
};

function titulo(e: Especificacao, bairro: string, caracteristicas: string[]): string {
  const q = e.quartos === 1 ? '1 quarto' : `${e.quartos} quartos`;
  const extra =
    e.situacao === 'na_planta'
      ? 'na planta'
      : caracteristicas.includes('quintal')
        ? 'com quintal'
        : caracteristicas.includes('varanda')
          ? 'com varanda'
          : '';
  return `${nomeTipoTitulo[e.tipo]} ${q}${extra ? ` ${extra}` : ''} no ${bairro}`.replace(
    / no (Jardim|Parque|Residencial|Conjunto|Vila)/,
    (m, p1: string) => (p1 === 'Vila' ? ` na ${p1}` : m),
  );
}

function descricao(
  e: Especificacao,
  bairro: string,
  caracteristicas: string[],
  lazer: string[],
  condicoes: Imovel['condicoes'],
  prox: Proximidade[],
): string {
  const tipoTexto = ROTULO_TIPO[e.tipo].toLowerCase();
  const feminino = e.tipo === 'casa' || e.tipo === 'casa_condominio' || e.tipo === 'kitnet';
  const q = e.quartos === 1 ? '1 quarto' : `${e.quartos} quartos`;
  const comodos =
    e.tipo === 'apartamento'
      ? 'sala integrada à cozinha, banheiro e área de serviço'
      : 'sala, cozinha, banheiro social e área de serviço';
  const partes = [
    `${tipoTexto.charAt(0).toUpperCase() + tipoTexto.slice(1)} de ${q} com ${e.area} m² de área útil, ${feminino ? 'localizada' : 'localizado'} no bairro ${bairro}. Tem ${comodos}.`,
  ];
  if (e.terreno) partes.push(`O terreno tem ${e.terreno} m².`);
  if (e.situacao === 'usado')
    partes.push(
      'Imóvel usado, em bom estado de conservação; recomendamos visitar para conferir os detalhes.',
    );
  if (e.situacao === 'pronto') partes.push('Imóvel pronto para morar.');
  if (e.situacao === 'na_planta' || e.situacao === 'em_construcao')
    partes.push(
      'Imóvel em lançamento: as condições de entrada e o cronograma de obra são informados pela construtora no contrato.',
    );
  partes.push(`Destaques: ${caracteristicas.slice(0, 3).join(', ')}.`);
  if (lazer.length) partes.push(`O condomínio oferece ${lazer.join(', ')}.`);
  const perto = prox
    .slice(0, 2)
    .map(
      (p) =>
        `${p.nome.toLowerCase().startsWith('ponto') ? 'ponto de ônibus' : p.nome} a cerca de ${p.distanciaMetros} m`,
    );
  partes.push(`Perto de ${perto.join(' e ')}.`);
  const formas = [
    condicoes.aceitaMCMV && 'Minha Casa, Minha Vida',
    condicoes.aceitaFGTS && 'uso do FGTS',
    condicoes.aceitaConsorcio && 'carta de consórcio contemplada',
  ].filter(Boolean);
  if (formas.length) partes.push(`Aceita ${formas.join(', ')}, sujeito à análise de crédito.`);
  return partes.join(' ');
}

async function gerarFotos(
  codigo: string,
  e: Especificacao,
  tituloImovel: string,
  lazer: string[],
  indice: number,
) {
  const pasta = path.join(RAIZ, 'public', 'imoveis', codigo);
  await rm(pasta, { recursive: true, force: true });
  await mkdir(pasta, { recursive: true });
  const p = PALETAS[indice % PALETAS.length] ?? PALETAS[0]!;
  const t = `${tituloImovel} (${codigo})`;
  const fotos: { svg: string; alt: string }[] = [];
  if (e.tipo === 'apartamento')
    fotos.push({
      svg: fachadaPredio(p, inteiro(4, 6), `Fachada do prédio – ${codigo}`),
      alt: `Ilustração da fachada do prédio – ${t}`,
    });
  else if (e.tipo === 'sobrado' || e.tipo === 'duplex')
    fotos.push({
      svg: fachadaSobrado(p, `Fachada – ${codigo}`),
      alt: `Ilustração da fachada de dois andares – ${t}`,
    });
  else
    fotos.push({
      svg: fachadaCasa(p, e.quartos, `Fachada – ${codigo}`),
      alt: `Ilustração da fachada térrea – ${t}`,
    });
  fotos.push({
    svg: sala(p, `Sala – ${codigo}`),
    alt: `Ilustração da sala com sofá e janela ampla – ${codigo}`,
  });
  fotos.push({
    svg: cozinha(p, `Cozinha – ${codigo}`),
    alt: `Ilustração da cozinha com armários e bancada – ${codigo}`,
  });
  fotos.push({
    svg: quarto(p, `Quarto – ${codigo}`),
    alt: `Ilustração de quarto com cama de casal e janela – ${codigo}`,
  });
  fotos.push({
    svg: banheiro(p, `Banheiro – ${codigo}`),
    alt: `Ilustração do banheiro com box de vidro – ${codigo}`,
  });
  if (e.tipo !== 'apartamento' || lazer.length)
    fotos.push({
      svg: areaExterna(p, `Área externa – ${codigo}`, lazer.length > 0),
      alt: lazer.length
        ? `Ilustração da área de lazer do condomínio com piscina e playground – ${codigo}`
        : `Ilustração do quintal com área de serviço – ${codigo}`,
    });
  await Promise.all(
    fotos.map((f, i) =>
      writeFile(path.join(pasta, `${String(i + 1).padStart(2, '0')}.svg`), f.svg),
    ),
  );
  return fotos.map((f, i) => ({
    arquivo: `/imoveis/${codigo}/${String(i + 1).padStart(2, '0')}.svg`,
    alt: f.alt,
  }));
}

async function main() {
  const tetoFaixa3 = FAIXAS.find((f) => f.id === 'faixa3')?.tetoImovel ?? 0;
  const imoveis: Imovel[] = [];
  for (const [idx, e] of ESPECIFICACOES.entries()) {
    const codigo = `CP-${String(idx + 1).padStart(4, '0')}`;
    const b = BAIRROS_EXEMPLO[e.bairro % BAIRROS_EXEMPLO.length]!;
    const ehPredio = e.tipo === 'apartamento';
    const caracteristicas = sortear(
      ehPredio ? CARACTERISTICAS.apartamento : CARACTERISTICAS.casa,
      inteiro(4, 6),
    );
    if (!ehPredio && e.terreno && !caracteristicas.includes('quintal') && e.terreno >= 140)
      caracteristicas.unshift('quintal');
    if (ehPredio && !caracteristicas.includes('varanda') && aleatorio() > 0.5)
      caracteristicas.unshift('varanda');
    const lazer =
      ehPredio || e.tipo === 'casa_condominio' ? sortear(LAZER_CONDOMINIO, inteiro(2, 5)) : [];
    const preco = precoCoerente(e);
    const condicoes: Imovel['condicoes'] = {
      aceitaMCMV:
        preco <= tetoFaixa3 && e.situacao !== 'usado'
          ? true
          : preco <= tetoFaixa3 && aleatorio() > 0.3,
      aceitaFGTS: aleatorio() > 0.1,
      aceitaSBPE: true,
      aceitaConsorcio: aleatorio() > 0.6,
      aceitaPermuta: e.situacao === 'usado' && aleatorio() > 0.5,
      entradaFacilitada:
        e.situacao === 'na_planta' || e.situacao === 'em_construcao' || aleatorio() > 0.8,
    };
    const prox = proximidades(b.nome);
    const tit = titulo(e, b.nome, caracteristicas);
    const publicado = new Date(Date.UTC(2026, 7, 1 + idx * 2, 12));
    const imovel: Imovel = {
      id: codigo.toLowerCase(),
      codigo,
      slug: slugImovel(tit, codigo),
      titulo: tit,
      descricao: descricao(e, b.nome, caracteristicas, lazer, condicoes, prox),
      tipo: e.tipo,
      situacao: e.situacao,
      previsaoEntrega:
        e.situacao === 'na_planta'
          ? `20${inteiro(27, 28)}-${String(escolher([3, 6, 9, 12])).padStart(2, '0')}`
          : e.situacao === 'em_construcao'
            ? '2027-03'
            : undefined,
      preco,
      condominioMensal: ehPredio
        ? inteiro(18, 35) * 10
        : e.tipo === 'casa_condominio'
          ? inteiro(15, 28) * 10
          : undefined,
      iptuAnual: inteiro(25, 90) * 10,
      cidade: CIDADE_BASE,
      uf: UF_BASE,
      bairro: b.nome,
      localizacaoAproximada: {
        lat: Number((b.lat + entre(-0.004, 0.004)).toFixed(4)),
        lng: Number((b.lng + entre(-0.004, 0.004)).toFixed(4)),
        raioMetros: 400,
      },
      quartos: e.quartos,
      suites: e.quartos === 3 && aleatorio() > 0.4 ? 1 : 0,
      banheiros: e.quartos === 3 && e.area >= 75 ? 2 : 1,
      vagas: e.vagas,
      areaUtilM2: e.area,
      areaTerrenoM2: e.terreno,
      caracteristicas,
      lazer,
      condicoes,
      fotos: [],
      proximidades: prox,
      destaque: Boolean(e.destaque),
      status: e.status ?? 'disponivel',
      corretorResponsavelId: 'corretor-exemplo',
      exemplo: true,
      publicadoEm: publicado.toISOString(),
      atualizadoEm: new Date(Date.UTC(2026, 8, 20, 12)).toISOString(),
    };
    imovel.fotos = await gerarFotos(codigo, e, tit, lazer, idx);
    imoveis.push(imovel);
  }

  const linhas = imoveis.map((i) => COLUNAS_CSV.map((c) => imovelParaLinha(i)[c]));
  await mkdir(path.join(RAIZ, 'dados'), { recursive: true });
  await writeFile(
    path.join(RAIZ, 'dados', 'imoveis.csv'),
    '﻿' + escreverCSV([...COLUNAS_CSV], linhas),
  );
  await writeFile(
    path.join(RAIZ, 'dados', 'MODELO_IMOVEIS.csv'),
    '﻿' + escreverCSV([...COLUNAS_CSV], linhas.slice(0, 1)),
  );
  await writeFile(
    path.join(RAIZ, 'dados', 'corretores.csv'),
    '﻿' +
      escreverCSV(
        ['id', 'nome', 'creci', 'whatsapp', 'foto'],
        [['corretor-exemplo', 'Equipe de corretores (exemplo)', 'A_DEFINIR', 'A_DEFINIR', '']],
      ),
  );
  await writeFile(
    path.join(RAIZ, 'public', 'imoveis', 'CREDITOS.md'),
    `# Créditos das imagens\n\nTodas as imagens em \`public/imoveis/CP-0001\` a \`CP-0024\` são **ilustrações vetoriais próprias**, geradas pelo script \`scripts/gerar-exemplos.ts\` (arquivo \`scripts/ilustracoes.ts\`) para o site da Contemplar Imóveis Pop. Não contêm fotografias nem elementos de terceiros e trazem a marcação "Imagem ilustrativa".\n\nLicença: uso livre pela Contemplar Imóveis / Grupo Ordnas.\n\nAo adicionar fotos reais, registre aqui a autoria e a licença de cada conjunto de fotos, por exemplo:\n\n| Código | Autor/fonte | Licença/autorização | Data |\n|---|---|---|---|\n| CP-0000 | Fotógrafo X (contratado) | Cessão de direitos, contrato nº ... | 2026-10-01 |\n`,
  );

  const precos = imoveis.map((i) => i.preco).sort((a, b) => a - b);
  const contagem = imoveis.reduce<Record<string, number>>(
    (acc, i) => ({ ...acc, [i.tipo]: (acc[i.tipo] ?? 0) + 1 }),
    {},
  );
  console.log(`✔ ${imoveis.length} imóveis de exemplo gerados em dados/imoveis.csv`);
  console.log('  Tipos:', contagem);
  console.log(`  Preços: mín ${precos[0]} | mediana ${precos[12]} | máx ${precos.at(-1)}`);
  console.log(
    `  Entre 160 mil e 280 mil: ${precos.filter((p) => p >= 160_000 && p <= 280_000).length}`,
  );
  console.log('Agora rode: npm run importar');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
