import { describe, expect, it } from 'vitest';
import {
  imovelParaDados,
  linhaParaImovel,
  statusDoPainel,
  statusPublico,
} from '@/lib/repositorio/converter';
import { imovelFormularioSchema, imovelSchema } from '@/lib/schemas/imovel';
import { caminhoDaFoto } from '@/lib/supabase/config';
import type { LinhaImovel } from '@/lib/supabase/tipos';
import dadosImoveis from '@/data/imoveis.json';
import type { Imovel } from '@/types';

const exemplo = imovelSchema.parse(dadosImoveis[0]) as Imovel;

describe('status do painel x site', () => {
  it('publicado aparece como disponível; reservado e vendido se mantêm', () => {
    expect(statusPublico('publicado')).toBe('disponivel');
    expect(statusPublico('reservado')).toBe('reservado');
    expect(statusPublico('vendido')).toBe('vendido');
    expect(statusDoPainel('disponivel')).toBe('publicado');
  });
});

describe('conversão banco ⇄ imóvel', () => {
  it('ida e volta preserva o imóvel e o marcador de exemplo', () => {
    const linha: LinhaImovel = {
      id: '00000000-0000-4000-8000-000000000001',
      codigo: exemplo.codigo,
      slug: exemplo.slug,
      status: statusDoPainel(exemplo.status),
      corretor_id: exemplo.corretorResponsavelId,
      destaque: exemplo.destaque,
      exemplo: exemplo.exemplo,
      dados: imovelParaDados(exemplo),
      fotos: exemplo.fotos,
      titulo: exemplo.titulo,
      tipo: exemplo.tipo,
      bairro: exemplo.bairro,
      preco: exemplo.preco,
      publicado_em: exemplo.publicadoEm,
      criado_em: exemplo.publicadoEm,
      atualizado_em: exemplo.atualizadoEm,
    };
    const volta = imovelSchema.parse(linhaParaImovel(linha));
    expect(volta).toEqual(exemplo);
    expect(volta.exemplo).toBe(true);
    expect(volta.id).toBe(exemplo.codigo.toLowerCase());
  });

  it('a coluna "dados" não repete campos que têm coluna própria', () => {
    const dados = imovelParaDados(exemplo);
    for (const campo of ['id', 'codigo', 'slug', 'fotos', 'status', 'exemplo', 'destaque'])
      expect(dados).not.toHaveProperty(campo);
    expect(dados).toHaveProperty('preco', exemplo.preco);
  });
});

describe('formulário do painel (mesmo schema do site)', () => {
  const base = () => ({
    ...imovelParaDados(exemplo),
    fotos: exemplo.fotos,
    destaque: false,
    corretorResponsavelId: 'corretor-exemplo',
    status: 'publicado' as const,
  });

  it('aceita um imóvel completo', () => {
    expect(imovelFormularioSchema.safeParse(base()).success).toBe(true);
  });

  it('rascunho pode ficar sem fotos; publicado não', () => {
    expect(
      imovelFormularioSchema.safeParse({ ...base(), fotos: [], status: 'rascunho' }).success,
    ).toBe(true);
    const r = imovelFormularioSchema.safeParse({ ...base(), fotos: [] });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(['fotos']);
  });

  it('exige descrição (alt) em todas as fotos', () => {
    const r = imovelFormularioSchema.safeParse({
      ...base(),
      fotos: [{ arquivo: 'https://x.supabase.co/a.webp', alt: '' }],
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(['fotos', 0, 'alt']);
  });

  it('mantém as regras do site (suítes ≤ quartos, previsão na planta)', () => {
    const r = imovelFormularioSchema.safeParse({
      ...base(),
      suites: 5,
      quartos: 2,
      situacao: 'na_planta',
      previsaoEntrega: undefined,
    });
    const campos = r.error?.issues.map((i) => i.path[0]);
    expect(campos).toContain('suites');
    expect(campos).toContain('previsaoEntrega');
  });
});

describe('fotos no Storage', () => {
  it('extrai o caminho do arquivo a partir da URL pública', () => {
    expect(
      caminhoDaFoto('https://abc.supabase.co/storage/v1/object/public/imoveis/uuid/01.webp'),
    ).toBe('uuid/01.webp');
    expect(caminhoDaFoto('/imoveis/CP-0001/01.jpg')).toBeNull();
  });
});
