import { ImageResponse } from 'next/og';
import { SITE } from '@/config/site';
import { formatarPrecoCurto } from '@/lib/utils/formatar';

export const alt = `${SITE.nome} — ${SITE.slogan}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Imagem() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        padding: 80,
        background: '#041a4b',
        color: '#fff',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', fontSize: 34, color: '#f28234', fontWeight: 700 }}>
        {SITE.nome}
      </div>
      <div
        style={{ display: 'flex', fontSize: 72, fontWeight: 800, marginTop: 20, lineHeight: 1.1 }}
      >
        {SITE.slogan}
      </div>
      <div style={{ display: 'flex', fontSize: 34, marginTop: 30, opacity: 0.85 }}>
        {`Casas e apartamentos a partir de ${formatarPrecoCurto(SITE.precoAPartirDe)} · MCMV · FGTS`}
      </div>
    </div>,
    size,
  );
}
