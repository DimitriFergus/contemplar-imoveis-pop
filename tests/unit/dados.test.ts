import { describe, expect, it } from 'vitest';
import {
  aplicarFiltros,
  chipsAtivos,
  lerFiltros,
  ordenar,
  paginar,
  paraQueryString,
} from '@/lib/busca/filtros';
import { converterLinha, imovelParaLinha } from '@/lib/importacao/imovel-csv';
import { paraResumo } from '@/lib/repositorio/resumo';
import { imovelSchema } from '@/lib/schemas/imovel';
import { leadEntradaSchema } from '@/lib/schemas/lead';
import { escreverCSV, lerCSV, lerCSVComoObjetos } from '@/lib/utils/csv';
import { formatarBRL, formatarPreco, lerNumeroBR } from '@/lib/utils/formatar';
import { slugify } from '@/lib/utils/slug';
import { extrairUTM } from '@/lib/utils/utm';
import { linkWhatsApp, mensagemImovel } from '@/lib/utils/whatsapp';
import dados from '@/data/imoveis.json';
import type { Imovel } from '@/types';

const imoveis = dados as Imovel[];
const resumos = imoveis.map(paraResumo);

describe('CSV', () => {
  it('lê aspas, separador ; e quebras de linha dentro de campos', () => {
    const csv =
      '﻿a;b;c\r\n1;"texto; com ponto e vírgula";"linha 1\nlinha 2"\r\n2;"aspas ""duplas""";\r\n';
    expect(lerCSV(csv)).toEqual([
      ['a', 'b', 'c'],
      ['1', 'texto; com ponto e vírgula', 'linha 1\nlinha 2'],
      ['2', 'aspas "duplas"', ''],
    ]);
  });

  it('detecta separador vírgula', () => {
    expect(lerCSV('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('ida e volta preserva os valores', () => {
    const cab = ['x', 'y'];
    const linhas = [
      ['a;b', 'c"d'],
      ['e\nf', ''],
    ];
    const [, ...lidas] = lerCSV(escreverCSV(cab, linhas));
    expect(lidas).toEqual(linhas);
  });

  it('numera linhas a partir de 2 (cabeçalho é a 1)', () => {
    expect(lerCSVComoObjetos('a;b\n1;2\n3;4').map((l) => l.linha)).toEqual([2, 3]);
  });
});

describe('formatação e números', () => {
  it('formata em BRL no padrão pt-BR', () => {
    expect(formatarBRL(1401.6526)).toBe('R$ 1.401,65');
    expect(formatarPreco(215000)).toBe('R$ 215.000');
  });

  it('lê números no formato brasileiro', () => {
    expect(lerNumeroBR('215.000')).toBe(215000);
    expect(lerNumeroBR('R$ 1.234,56')).toBe(1234.56);
    expect(lerNumeroBR('-23,5405')).toBe(-23.5405);
    expect(lerNumeroBR('-23.5405')).toBe(-23.5405);
    expect(lerNumeroBR('abc')).toBeNaN();
  });

  it('gera slugs sem acentos', () => {
    expect(slugify('Casa em Condomínio — Jardim Ipê!')).toBe('casa-em-condominio-jardim-ipe');
  });
});

describe('importação da planilha', () => {
  const base = imovelParaLinha(imoveis[0]!);

  it('todos os imóveis gerados são válidos e fictícios', () => {
    expect(imoveis).toHaveLength(24);
    for (const i of imoveis) {
      expect(imovelSchema.safeParse(i).success).toBe(true);
      expect(i.exemplo).toBe(true);
      expect(i.preco).toBeGreaterThanOrEqual(150_000);
      expect(i.preco).toBeLessThanOrEqual(420_000);
      expect(i.localizacaoAproximada.raioMetros).toBeGreaterThanOrEqual(150);
    }
  });

  it('converte de volta a linha exportada', () => {
    const r = converterLinha(
      base,
      2,
      imoveis[0]!.fotos.map((f) => f.arquivo),
      imoveis[0]!.publicadoEm,
    );
    expect(r.erros).toEqual([]);
    expect(r.imovel?.codigo).toBe(imoveis[0]!.codigo);
    expect(r.imovel?.preco).toBe(imoveis[0]!.preco);
    expect(r.imovel?.fotos).toEqual(imoveis[0]!.fotos);
  });

  it('gera mensagem legível para campo vazio', () => {
    const r = converterLinha({ ...base, codigo: 'CP-0007', preco: '' }, 7, []);
    expect(r.imovel).toBeNull();
    expect(r.erros).toContain("Linha 7, CP-0007: campo 'preco' vazio");
  });

  it('aceita nomes amigáveis de tipo e sim/não variados', () => {
    const r = converterLinha(
      { ...base, tipo: 'Casa em condomínio', aceita_fgts: 'X', aceita_mcmv: 'Não' },
      3,
      [],
    );
    expect(r.erros).toEqual([]);
    expect(r.imovel?.tipo).toBe('casa_condominio');
    expect(r.imovel?.condicoes.aceitaFGTS).toBe(true);
    expect(r.imovel?.condicoes.aceitaMCMV).toBe(false);
    expect(r.avisos.some((a) => a.includes('nenhuma foto'))).toBe(true);
  });

  it('exige previsão de entrega para imóvel na planta', () => {
    const r = converterLinha({ ...base, situacao: 'na_planta', previsao_entrega: '' }, 4, []);
    expect(r.erros.some((e) => e.includes("'previsao_entrega'"))).toBe(true);
  });

  it('recusa valores inválidos com mensagem clara', () => {
    const r = converterLinha({ ...base, tipo: 'mansão', quartos: 'dois' }, 5, []);
    expect(r.erros.some((e) => e.includes("'quartos' não é um número"))).toBe(true);
  });
});

describe('busca e filtros', () => {
  it('lê filtros da URL e ignora valores inválidos', () => {
    const f = lerFiltros(
      new URLSearchParams(
        'tipo=casa,foguete&precoMax=abc&quartos=2&condicoes=aceitaFGTS&ordem=xyz&pagina=-1',
      ),
    );
    expect(f.tipo).toEqual(['casa']);
    expect(f.precoMax).toBeUndefined();
    expect(f.quartos).toBe(2);
    expect(f.condicoes).toEqual(['aceitaFGTS']);
    expect(f.ordem).toBeUndefined();
    expect(f.pagina).toBeUndefined();
  });

  it('serializa e relê os mesmos filtros (URL compartilhável)', () => {
    const f = lerFiltros({
      tipo: 'apartamento,casa',
      precoMax: '250000',
      bairro: 'Vila Modelo',
      ordem: 'menor_preco',
    });
    const qs = paraQueryString(f);
    expect(qs).toBe('?tipo=apartamento,casa&bairro=vila-modelo&precoMax=250000&ordem=menor_preco');
    expect(lerFiltros(new URLSearchParams(qs.slice(1)))).toEqual(f);
  });

  it('aplica filtros e esconde vendidos', () => {
    const f = lerFiltros({ tipo: 'casa', precoMax: '200000' });
    const r = aplicarFiltros(resumos, f);
    expect(r.length).toBeGreaterThan(0);
    for (const i of r) {
      expect(i.tipo).toBe('casa');
      expect(i.preco).toBeLessThanOrEqual(200_000);
      expect(i.status).not.toBe('vendido');
    }
  });

  it('filtra por parcela máxima e por cabe no bolso', () => {
    const r = aplicarFiltros(resumos, lerFiltros({ parcelaMax: '1300', bolso: '220000' }));
    for (const i of r) {
      expect(i.parcelaEstimada).toBeLessThanOrEqual(1300);
      expect(i.preco).toBeLessThanOrEqual(220_000);
    }
  });

  it('ordena por menor preço e pagina', () => {
    const ordenados = ordenar(resumos, 'menor_preco');
    expect(ordenados[0]!.preco).toBeLessThanOrEqual(ordenados[1]!.preco);
    const p = paginar(ordenados, 3, 10);
    expect(p.pagina).toBe(3);
    expect(p.totalPaginas).toBe(3);
    expect(p.itens).toHaveLength(4);
    expect(paginar(ordenados, 99, 10).pagina).toBe(3);
  });

  it('gera chips removíveis', () => {
    const f = lerFiltros({ tipo: 'casa', quartos: '2', pagina: '2' });
    const chips = chipsAtivos(f);
    expect(chips.map((c) => c.rotulo)).toEqual(['Casas', '2+ quartos']);
    expect(paraQueryString(chips[0]!.semEste)).toBe('?quartos=2');
  });
});

describe('WhatsApp e UTM', () => {
  it('monta a mensagem com código, título e origem', () => {
    const utm = extrairUTM(
      new URLSearchParams('utm_source=instagram&utm_medium=anuncio&utm_campaign=setembro'),
    );
    const msg = mensagemImovel({ codigo: 'CP-0012', titulo: 'Casa 2 quartos no Bairro X' }, utm);
    expect(msg).toBe(
      'Olá! Tenho interesse no imóvel CP-0012 (Casa 2 quartos no Bairro X). Vi no site. (origem: instagram / anuncio / setembro)',
    );
  });

  it('usa o número configurado ou abre a escolha de contato', () => {
    expect(linkWhatsApp('oi', '5511912345678')).toBe('https://wa.me/5511912345678?text=oi');
    expect(linkWhatsApp('oi', 'A_DEFINIR')).toBe('https://wa.me/?text=oi');
  });

  it('retorna null sem UTM', () => {
    expect(extrairUTM(new URLSearchParams('a=1'))).toBeNull();
  });
});

describe('lead', () => {
  const valido = {
    origem: 'formulario_imovel',
    nome: 'Maria',
    whatsapp: '(11) 91234-5678',
    consentimentoLGPD: true,
  };

  it('normaliza o WhatsApp com DDI 55', () => {
    const r = leadEntradaSchema.parse(valido);
    expect(r.whatsapp).toBe('5511912345678');
    expect(leadEntradaSchema.parse({ ...valido, whatsapp: '+55 11 91234-5678' }).whatsapp).toBe(
      '5511912345678',
    );
  });

  it('exige consentimento LGPD', () => {
    expect(leadEntradaSchema.safeParse({ ...valido, consentimentoLGPD: false }).success).toBe(
      false,
    );
  });

  it('recusa telefone inválido', () => {
    expect(leadEntradaSchema.safeParse({ ...valido, whatsapp: '1234' }).success).toBe(false);
  });

  it('exige data e período no agendamento', () => {
    const r = leadEntradaSchema.safeParse({ ...valido, origem: 'agendamento_visita' });
    expect(r.success).toBe(false);
    const ok = leadEntradaSchema.safeParse({
      ...valido,
      origem: 'agendamento_visita',
      dataVisitaPreferida: '2026-10-05',
      periodoPreferido: 'manha',
    });
    expect(ok.success).toBe(true);
  });
});
