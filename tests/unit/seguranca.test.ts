import { describe, expect, it } from 'vitest';
import { linhaParaImovel } from '@/lib/repositorio/linha';
import type { LinhaImovel } from '@/lib/supabase/tipos';
import { fotoPermitida, urlMidiaPermitida } from '@/lib/utils/url-segura';

describe('links vindos do banco', () => {
  it('aceita só vídeo/tour https dos serviços incorporados', () => {
    expect(urlMidiaPermitida('https://www.youtube.com/watch?v=abc123xyz')).toBe(true);
    expect(urlMidiaPermitida('https://youtu.be/abc123xyz')).toBe(true);
    expect(urlMidiaPermitida('https://my.matterport.com/show/?m=abc')).toBe(true);
    expect(urlMidiaPermitida('https://kuula.co/share/abc')).toBe(true);
    expect(urlMidiaPermitida('javascript:alert(1)')).toBe(false);
    expect(urlMidiaPermitida('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(urlMidiaPermitida('http://www.youtube.com/watch?v=abc')).toBe(false);
    expect(urlMidiaPermitida('https://youtube.com.golpe.com/x')).toBe(false);
    expect(urlMidiaPermitida('https://golpe.com/?youtube.com/')).toBe(false);
  });

  it('aceita só fotos do Storage ou da pasta /imoveis', () => {
    expect(
      fotoPermitida('https://abc123.supabase.co/storage/v1/object/public/imoveis/uuid/foto.webp'),
    ).toBe(true);
    expect(fotoPermitida('/imoveis/CP-0001/01.jpg')).toBe(true);
    expect(fotoPermitida('https://rastreador.com/pixel.gif')).toBe(false);
    expect(fotoPermitida('//rastreador.com/imoveis/a.jpg')).toBe(false);
    expect(fotoPermitida('/imoveis/../../x" onerror="alert(1)')).toBe(false);
  });

  it('descarta fotos e vídeo fora da lista ao ler o imóvel', () => {
    const linha = {
      codigo: 'CP-0001',
      slug: 'casa',
      status: 'publicado',
      corretor_id: 'x',
      destaque: false,
      exemplo: false,
      dados: { videoUrl: 'https://golpe.com/login', tour360Url: 'https://kuula.co/share/a' },
      fotos: [
        { arquivo: '/imoveis/CP-0001/01.jpg', alt: 'Fachada' },
        { arquivo: 'https://rastreador.com/x.gif', alt: 'Pixel' },
      ],
      publicado_em: null,
      criado_em: '2026-10-05',
      atualizado_em: '2026-10-05',
    } as unknown as LinhaImovel;
    const imovel = linhaParaImovel(linha);
    expect(imovel.videoUrl).toBeUndefined();
    expect(imovel.tour360Url).toBe('https://kuula.co/share/a');
    expect(imovel.fotos).toHaveLength(1);
  });
});
