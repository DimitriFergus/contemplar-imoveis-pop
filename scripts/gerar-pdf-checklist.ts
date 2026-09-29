/**
 * Gera o PDF para imprimir "O que você precisa para comprar seu imóvel", a partir do mesmo
 * conteúdo do site (documentos, passos, custos e dados da empresa). Roda antes de cada build.
 *
 * Uso: npm run pdf-checklist   → public/documentos/checklist-compra-contemplar.pdf
 */
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { custosDoMunicipio } from '../src/config/custos-aquisicao';
import { COTA_MAXIMA_FINANCIAMENTO, REGRAS_FGTS } from '../src/config/financiamento';
import { CIDADE_BASE, CONTATO, EMPRESA, SITE, UF_BASE, estaDefinido } from '../src/config/site';
import { DOCUMENTOS, JORNADA } from '../src/content/jornada';
import { formatarPercentual } from '../src/lib/utils/formatar';

const RAIZ = path.resolve(import.meta.dirname, '..');
const SAIDA = path.join(RAIZ, 'public', 'documentos', 'checklist-compra-contemplar.pdf');

const COR = {
  marinho: '#041A4B',
  laranja: '#F28234',
  texto: '#1B1F2A',
  cinza: '#5B6170',
  linha: '#D9D3C7',
  fundo: '#F6F2EB',
};
const M = 48; // margem
const A4 = { largura: 595.28, altura: 841.89 };
const LARGURA_UTIL = A4.largura - M * 2;
const RODAPE = 64;

async function main() {
  await mkdir(path.dirname(SAIDA), { recursive: true });
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: M, bottom: M + RODAPE - 20, left: M, right: M },
    bufferPages: true,
    info: {
      Title: 'Checklist para comprar seu imóvel – Contemplar Imóveis Pop',
      Author: EMPRESA.nomeEmpresarial,
      Subject: 'Documentos e valores necessários para comprar casa ou apartamento',
    },
  });
  doc.pipe(createWriteStream(SAIDA));

  const custos = custosDoMunicipio(CIDADE_BASE, UF_BASE);
  const limiteY = () => A4.altura - (M + RODAPE);
  const garantirEspaco = (altura: number) => {
    if (doc.y + altura > limiteY()) doc.addPage();
  };

  // ── Cabeçalho ────────────────────────────────────────────────────────────
  doc.rect(0, 0, A4.largura, 112).fill(COR.marinho);
  doc.roundedRect(M, 24, 64, 64, 10).fill('#FFFFFF');
  doc.image(path.join(RAIZ, 'public', 'marca', 'simbolo.png'), M + 7, 31, { width: 50 });
  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(20)
    .text('O que você precisa para comprar seu imóvel', M + 80, 30, { width: LARGURA_UTIL - 80 });
  doc
    .fillColor('#DCE3F2')
    .font('Helvetica')
    .fontSize(10)
    .text(
      `${SITE.nome} · Checklist de documentos e valores · Imprima e marque o que já tem`,
      M + 80,
      84,
      {
        width: LARGURA_UTIL - 80,
      },
    );
  doc.y = 132;

  const titulo = (texto: string, numero: number) => {
    garantirEspaco(60);
    const y = doc.y;
    doc.circle(M + 11, y + 9, 11).fill(COR.laranja);
    doc
      .fillColor(COR.marinho)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(String(numero), M, y + 3.5, { width: 22, align: 'center' });
    doc.fontSize(14).text(texto, M + 30, y + 1);
    doc.moveDown(0.5);
  };

  const caixa = (texto: string) => {
    doc.font('Helvetica').fontSize(10.5);
    const altura = doc.heightOfString(texto, { width: LARGURA_UTIL - 26 });
    garantirEspaco(altura + 8);
    const y = doc.y;
    doc
      .lineWidth(1)
      .strokeColor(COR.marinho)
      .rect(M + 2, y + 1, 11, 11)
      .stroke();
    doc.fillColor(COR.texto).text(texto, M + 22, y, { width: LARGURA_UTIL - 26 });
    doc.y += 5;
  };

  // ── 1. Documentos ────────────────────────────────────────────────────────
  titulo('Documentos', 1);
  for (const grupo of DOCUMENTOS) {
    garantirEspaco(40);
    doc.fillColor(COR.marinho).font('Helvetica-Bold').fontSize(11).text(grupo.titulo, M, doc.y);
    doc.moveDown(0.3);
    for (const item of grupo.itens) caixa(item);
    doc.moveDown(0.4);
  }
  doc
    .fillColor(COR.cinza)
    .font('Helvetica-Oblique')
    .fontSize(9)
    .text(
      `Para usar o FGTS: pelo menos ${REGRAS_FGTS.anosMinimosTrabalhoCarteira} anos de trabalho com carteira assinada (${REGRAS_FGTS.observacao.toLowerCase().replace(/\.$/, '')}). O banco pode pedir outros documentos conforme o seu caso.`,
      M,
      doc.y,
      { width: LARGURA_UTIL },
    );
  doc.moveDown(1);

  // ── 2. Valores para separar ─────────────────────────────────────────────
  titulo('Valores para separar', 2);
  const valores = [
    [
      'Entrada',
      `Em geral, pelo menos ${formatarPercentual(1 - COTA_MAXIMA_FINANCIAMENTO)} do valor do imóvel (dinheiro e/ou FGTS). Na planta, a construtora pode parcelar.`,
    ],
    [
      'ITBI (imposto da prefeitura)',
      `Cerca de ${formatarPercentual(custos.itbi.aliquota)} do valor do imóvel. Confirme a alíquota da sua cidade.`,
    ],
    [
      'Registro e cartório',
      `Cerca de ${formatarPercentual(custos.registroCartorioEstimado)} do valor do imóvel (estimativa).`,
    ],
    [
      'Mudança e pequenos reparos',
      'Reserve um valor para a mudança, instalações e eventuais ajustes no imóvel.',
    ],
  ] as const;
  for (const [nome, desc] of valores) {
    doc.font('Helvetica').fontSize(10);
    const altura = Math.max(50, doc.heightOfString(desc, { width: LARGURA_UTIL - 195 }) + 22);
    garantirEspaco(altura + 6);
    const y = doc.y;
    doc.roundedRect(M, y, LARGURA_UTIL, altura, 6).fill(COR.fundo);
    doc
      .fillColor(COR.marinho)
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .text(nome, M + 10, y + 10, { width: 170 });
    doc
      .fillColor(COR.texto)
      .font('Helvetica')
      .fontSize(10)
      .text(desc, M + 185, y + 10, { width: LARGURA_UTIL - 195 });
    doc
      .fillColor(COR.cinza)
      .fontSize(9)
      .text('R$ ______________', M + 10, y + altura - 18, { width: 170 });
    doc.y = y + altura + 6;
  }
  doc
    .fillColor(COR.cinza)
    .font('Helvetica-Oblique')
    .fontSize(9)
    .text(
      'Valores estimados. Os percentuais reais dependem da prefeitura, do cartório e do banco.',
      M,
      doc.y + 2,
      {
        width: LARGURA_UTIL,
      },
    );
  doc.moveDown(1);

  // ── 3. Passo a passo ─────────────────────────────────────────────────────
  titulo('Da simulação às chaves', 3);
  JORNADA.forEach((p, i) => {
    doc.font('Helvetica').fontSize(10);
    const altura = doc.heightOfString(p.resumo, { width: LARGURA_UTIL - 40 }) + 20;
    garantirEspaco(altura + 4);
    const y = doc.y;
    doc
      .fillColor(COR.laranja)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(`Passo ${i + 1}`, M, y, { width: 50 });
    doc
      .fillColor(COR.marinho)
      .fontSize(11)
      .text(p.titulo, M + 55, y);
    doc
      .fillColor(COR.texto)
      .font('Helvetica')
      .fontSize(10)
      .text(p.resumo, M + 55, doc.y + 1, { width: LARGURA_UTIL - 55 });
    doc.y += 6;
  });
  doc.moveDown(0.6);

  // ── 4. Anotações ─────────────────────────────────────────────────────────
  titulo('Anote aqui', 4);
  for (const campo of [
    'Código do imóvel de interesse (ex.: CP-0012)',
    'Nome do corretor',
    'Data e horário da visita',
    'Renda familiar total (R$)',
    'Observações',
  ]) {
    garantirEspaco(34);
    const y = doc.y;
    doc.fillColor(COR.cinza).font('Helvetica').fontSize(9).text(campo, M, y);
    doc
      .strokeColor(COR.linha)
      .lineWidth(0.8)
      .moveTo(M, y + 26)
      .lineTo(M + LARGURA_UTIL, y + 26)
      .stroke();
    doc.y = y + 34;
  }

  // ── Rodapé em todas as páginas ───────────────────────────────────────────
  const paginas = doc.bufferedPageRange();
  for (let i = 0; i < paginas.count; i++) {
    doc.switchToPage(i);
    // O rodapé fica dentro da margem inferior: zera a margem para o PDFKit não criar página nova.
    doc.page.margins.bottom = 0;
    const y = A4.altura - M - 30;
    doc
      .strokeColor(COR.linha)
      .lineWidth(0.8)
      .moveTo(M, y - 8)
      .lineTo(M + LARGURA_UTIL, y - 8)
      .stroke();
    const contato = [
      estaDefinido(CONTATO.telefoneExibicao) ? `WhatsApp ${CONTATO.telefoneExibicao}` : '',
      estaDefinido(CONTATO.email) ? CONTATO.email : '',
      SITE.url.replace(/^https?:\/\//, ''),
    ]
      .filter(Boolean)
      .join(' · ');
    doc
      .fillColor(COR.marinho)
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text(`${EMPRESA.nomeEmpresarial} · CNPJ ${EMPRESA.cnpj} · ${EMPRESA.creciPJ}`, M, y, {
        width: LARGURA_UTIL - 60,
        lineBreak: false,
      });
    doc
      .fillColor(COR.cinza)
      .font('Helvetica')
      .fontSize(8)
      .text(contato, M, y + 11, { width: LARGURA_UTIL - 60, lineBreak: false });
    doc.text(EMPRESA.endereco, M, y + 21, { width: LARGURA_UTIL - 60, lineBreak: false });
    doc.text(`${i + 1}/${paginas.count}`, M + LARGURA_UTIL - 50, y + 11, {
      width: 50,
      align: 'right',
      lineBreak: false,
    });
  }

  doc.end();
  console.log(`✔ PDF gerado: ${path.relative(RAIZ, SAIDA)} (${paginas.count} página(s))`);
}

main().catch((e) => {
  console.error('✖ Falha ao gerar o PDF:', e);
  process.exit(1);
});
