import { describe, expect, it } from 'vitest';
import { compararImoveis, placar } from '@/lib/comparacao';

const base = {
  preco: 200_000,
  parcelaEstimada: 1_200,
  areaUtilM2: 50,
  quartos: 2,
  banheiros: 1,
  vagas: 1,
  condominioMensal: 250,
};

describe('comparação de imóveis', () => {
  it('marca como ganho o que é melhor para o comprador', () => {
    const d = compararImoveis(
      {
        ...base,
        preco: 188_000,
        parcelaEstimada: 1_130,
        areaUtilM2: 58,
        quartos: 3,
        condominioMensal: undefined,
      },
      base,
    );
    const por = Object.fromEntries(d.map((x) => [x.chave, x]));
    expect(por.preco?.resultado).toBe('ganha');
    expect(por.preco?.texto).toBe('R$ 12 mil mais barato');
    expect(por.parcela?.resultado).toBe('ganha');
    expect(por.parcela?.texto).toBe('Parcela R$ 70 menor');
    expect(por.area?.texto).toBe('8 m² maior');
    expect(por.quartos?.texto).toBe('+1 quarto');
    expect(por.condominio?.resultado).toBe('ganha');
    expect(por.condominio?.texto).toBe('Sem condomínio');
    expect(por.banheiros?.resultado).toBe('igual');
    expect(placar(d)).toEqual({ ganha: 5, perde: 0 });
  });

  it('marca como perda o que é pior', () => {
    const d = compararImoveis({ ...base, preco: 230_000, vagas: 0, banheiros: 1 }, base);
    const por = Object.fromEntries(d.map((x) => [x.chave, x]));
    expect(por.preco?.resultado).toBe('perde');
    expect(por.preco?.texto).toBe('R$ 30 mil mais caro');
    expect(por.vagas?.resultado).toBe('perde');
    expect(por.vagas?.texto).toBe('Sem vaga');
    expect(placar(d).perde).toBe(2);
  });

  it('um imóvel comparado com ele mesmo empata em tudo', () => {
    expect(placar(compararImoveis(base, base))).toEqual({ ganha: 0, perde: 0 });
  });
});
