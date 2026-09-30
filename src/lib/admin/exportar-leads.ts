'use client';

import type { LinhaLead } from '@/lib/supabase/tipos';
import { ROTULO_ETAPA, ROTULO_FAIXA_RENDA, ROTULO_ORIGEM, ROTULO_PERIODO } from './rotulos';

/**
 * Gera a planilha XLSX dos leads no próprio navegador e baixa o arquivo.
 * A biblioteca (exceljs) só é carregada quando alguém clica em exportar.
 */
export async function exportarLeadsXlsx(leads: LinhaLead[], nomesCorretores: Map<string, string>) {
  const { default: ExcelJS } = await import('exceljs');
  const livro = new ExcelJS.Workbook();
  livro.creator = 'Contemplar Imóveis';
  const aba = livro.addWorksheet('Leads', { views: [{ state: 'frozen', ySplit: 1 }] });
  aba.columns = [
    { header: 'Recebido em', key: 'criado', width: 18, style: { numFmt: 'dd/mm/yyyy hh:mm' } },
    { header: 'Etapa', key: 'etapa', width: 16 },
    { header: 'Nome', key: 'nome', width: 28 },
    { header: 'WhatsApp', key: 'whatsapp', width: 16 },
    { header: 'E-mail', key: 'email', width: 28 },
    { header: 'Origem', key: 'origem', width: 18 },
    { header: 'Imóvel', key: 'imovel', width: 10 },
    { header: 'Faixa de renda', key: 'renda', width: 24 },
    { header: 'Visita (data)', key: 'visita', width: 13 },
    { header: 'Visita (período)', key: 'periodo', width: 14 },
    { header: 'Corretor', key: 'corretor', width: 24 },
    { header: 'Mensagem', key: 'mensagem', width: 40 },
    { header: 'Observações', key: 'observacoes', width: 40 },
    { header: 'Motivo da perda', key: 'motivo', width: 24 },
    { header: 'Campanha (UTM)', key: 'utm', width: 28 },
  ];
  for (const l of leads) {
    aba.addRow({
      criado: new Date(l.criado_em),
      etapa: ROTULO_ETAPA[l.etapa],
      nome: l.nome,
      whatsapp: l.whatsapp,
      email: l.email ?? '',
      origem: ROTULO_ORIGEM[l.origem] ?? l.origem,
      imovel: l.codigo_imovel ?? '',
      renda: l.renda_faixa ? (ROTULO_FAIXA_RENDA[l.renda_faixa] ?? l.renda_faixa) : '',
      visita: l.data_visita ? l.data_visita.split('-').reverse().join('/') : '',
      periodo: l.periodo_visita ? (ROTULO_PERIODO[l.periodo_visita] ?? '') : '',
      corretor: l.corretor_id ? (nomesCorretores.get(l.corretor_id) ?? l.corretor_id) : '',
      mensagem: l.mensagem ?? '',
      observacoes: l.observacoes ?? '',
      motivo: l.motivo_perda ?? '',
      utm: l.utm
        ? Object.entries(l.utm)
            .map(([k, v]) => `${k}=${v}`)
            .join(' ')
        : '',
    });
  }
  const cabecalho = aba.getRow(1);
  cabecalho.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  cabecalho.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF041A4B' } };
  aba.autoFilter = { from: 'A1', to: 'O1' };

  const buffer = await livro.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `leads-contemplar-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
}
