import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import { SITE } from '@/config/site';
import { parcelaEstimadaAnuncio } from '@/lib/financiamento';
import { repositorio } from '@/lib/repositorio';
import { formatarPreco } from '@/lib/utils/formatar';

export const dynamic = 'force-static';

export const alt = 'Foto, preço e parcela estimada do imóvel';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export async function generateStaticParams() {
  const imoveis = await repositorio.listar();
  return imoveis.map((i) => ({ slug: i.slug }));
}

async function fotoComoDataUri(arquivo: string | undefined): Promise<string | null> {
  if (!arquivo) return null;
  // Foto enviada pelo painel (Storage do Supabase).
  if (/^https?:\/\//.test(arquivo)) {
    try {
      const resp = await fetch(arquivo, { signal: AbortSignal.timeout(8000) });
      if (!resp.ok) return null;
      // O gerador de imagem não lê WebP: converte para JPEG.
      const jpeg = await sharp(Buffer.from(await resp.arrayBuffer()))
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
    } catch {
      return null;
    }
  }
  try {
    const dados = await readFile(path.join(process.cwd(), 'public', arquivo));
    const ext = path.extname(arquivo).slice(1).toLowerCase();
    const mime =
      ext === 'svg'
        ? 'image/svg+xml'
        : ext === 'png'
          ? 'image/png'
          : ext === 'webp'
            ? 'image/webp'
            : 'image/jpeg';
    return `data:${mime};base64,${dados.toString('base64')}`;
  } catch {
    return null;
  }
}

/** Imagem de compartilhamento (WhatsApp/redes): foto, preço, parcela e código. */
export default async function Imagem({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = await repositorio.obterPorSlug(slug);
  if (!i)
    return new ImageResponse(
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#041a4b' }} />,
      size,
    );
  const foto = await fotoComoDataUri(i.fotos[0]?.arquivo);
  const parcela = parcelaEstimadaAnuncio(i.preco).parcela;
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#041a4b',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', width: 660, height: 630, background: '#e6ecf8' }}>
        {foto && (
          // ImageResponse (Satori) só aceita <img>; next/image não se aplica aqui.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            width={660}
            height={630}
            alt=""
            style={{ objectFit: 'cover', width: 660, height: 630 }}
          />
        )}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 44,
          width: 540,
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 26, color: '#f28234', fontWeight: 700 }}>
            {SITE.nome}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 38,
              fontWeight: 800,
              marginTop: 18,
              lineHeight: 1.15,
            }}
          >
            {i.titulo}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 24, opacity: 0.85 }}>Parcelas a partir de*</div>
          <div
            style={{ display: 'flex', fontSize: 64, fontWeight: 800, color: '#f28234' }}
          >{`${formatarPreco(parcela)}/mês`}</div>
          <div
            style={{ display: 'flex', fontSize: 34, fontWeight: 700, marginTop: 6 }}
          >{`Valor total: ${formatarPreco(i.preco)}`}</div>
          <div
            style={{ display: 'flex', fontSize: 22, marginTop: 18, opacity: 0.8 }}
          >{`Cód. ${i.codigo} · ${i.bairro} · *simulação ilustrativa`}</div>
        </div>
      </div>
    </div>,
    size,
  );
}
