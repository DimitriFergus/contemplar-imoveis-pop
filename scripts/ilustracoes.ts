/**
 * Ilustrações vetoriais (SVG) usadas como fotos de exemplo. São desenhos próprios, leves
 * (poucos KB) e livres de direitos de terceiros. Serão substituídas por fotos reais.
 */

export interface PaletaIlustracao {
  parede: string;
  paredeEscura: string;
  telhado: string;
  porta: string;
  destaque: string;
  piso: string;
}

export const PALETAS: PaletaIlustracao[] = [
  {
    parede: '#F4E3C8',
    paredeEscura: '#E3C9A2',
    telhado: '#B5553C',
    porta: '#6B4B34',
    destaque: '#F28234',
    piso: '#D9C2A0',
  },
  {
    parede: '#DDE8E3',
    paredeEscura: '#BFD3CA',
    telhado: '#5B6770',
    porta: '#3E4A52',
    destaque: '#2E7D6B',
    piso: '#CDBFA9',
  },
  {
    parede: '#F7EFE4',
    paredeEscura: '#E6D6BF',
    telhado: '#8A4B2E',
    porta: '#1F3A5F',
    destaque: '#E0A526',
    piso: '#E1D2BC',
  },
  {
    parede: '#E8E4F0',
    paredeEscura: '#CFC8DE',
    telhado: '#4A4E69',
    porta: '#22223B',
    destaque: '#F28234',
    piso: '#D6CCC2',
  },
  {
    parede: '#FCE9D8',
    paredeEscura: '#F1CFAF',
    telhado: '#A44A3F',
    porta: '#5A3E2B',
    destaque: '#3A86FF',
    piso: '#E9D8C4',
  },
  {
    parede: '#E4EEF6',
    paredeEscura: '#C6D8E8',
    telhado: '#34495E',
    porta: '#041A4B',
    destaque: '#F28234',
    piso: '#D8CFC4',
  },
];

const W = 1200;
const H = 800;

function moldura(conteudo: string, titulo: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"><title>${titulo}</title>${conteudo}<g font-family="Arial,Helvetica,sans-serif" font-size="26" fill="#fff"><rect x="24" y="${H - 70}" rx="10" width="250" height="46" fill="#041A4B" opacity=".72"/><text x="44" y="${H - 38}">Imagem ilustrativa</text></g></svg>`;
}

const ceu = (cor1: string, cor2: string) =>
  `<defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor1}"/><stop offset="1" stop-color="${cor2}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#c)"/><circle cx="1010" cy="140" r="60" fill="#FFE8A3" opacity=".9"/><g fill="#fff" opacity=".85"><ellipse cx="260" cy="130" rx="90" ry="28"/><ellipse cx="330" cy="110" rx="70" ry="30"/><ellipse cx="760" cy="90" rx="80" ry="22"/></g>`;

const gramado = `<rect y="600" width="${W}" height="200" fill="#8DBF6A"/><rect y="640" width="${W}" height="160" fill="#7AAE58"/>`;

const arvore = (x: number, escala = 1) =>
  `<g transform="translate(${x} ${600 - 190 * escala}) scale(${escala})"><rect x="-10" y="120" width="20" height="70" fill="#7A5230"/><circle cx="0" cy="90" r="60" fill="#4E9A51"/><circle cx="-35" cy="110" r="40" fill="#5DAE5F"/><circle cx="35" cy="110" r="40" fill="#468C49"/></g>`;

const janela = (x: number, y: number, w: number, h: number, p: PaletaIlustracao) =>
  `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#BFE3F5" stroke="#fff" stroke-width="8"/><line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="#fff" stroke-width="6"/><rect x="${x - 8}" y="${y + h}" width="${w + 16}" height="10" fill="${p.paredeEscura}"/></g>`;

export function fachadaCasa(p: PaletaIlustracao, quartos: number, titulo: string): string {
  const largura = 460 + quartos * 60;
  const x0 = (W - largura) / 2;
  const c = `${ceu('#9BD3F2', '#DDF1FB')}${gramado}${arvore(140, 1.1)}${arvore(1080, 0.9)}
<polygon points="${x0 - 30},330 ${x0 + largura / 2},180 ${x0 + largura + 30},330" fill="${p.telhado}"/>
<rect x="${x0}" y="330" width="${largura}" height="280" fill="${p.parede}"/>
<rect x="${x0}" y="580" width="${largura}" height="30" fill="${p.paredeEscura}"/>
<rect x="${x0 + largura / 2 - 50}" y="440" width="100" height="170" rx="6" fill="${p.porta}"/><circle cx="${x0 + largura / 2 + 30}" cy="530" r="6" fill="${p.destaque}"/>
${janela(x0 + 50, 400, 130, 110, p)}${janela(x0 + largura - 180, 400, 130, 110, p)}
<rect x="${x0 - 80}" y="560" width="${largura + 160}" height="50" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="4 18"/>
<rect x="${x0 + largura / 2 - 60}" y="610" width="120" height="190" fill="#CFC6B8"/>`;
  return moldura(c, titulo);
}

export function fachadaSobrado(p: PaletaIlustracao, titulo: string): string {
  const x0 = 360;
  const c = `${ceu('#9BD3F2', '#DDF1FB')}${gramado}${arvore(170, 1.2)}${arvore(1060, 1)}
<polygon points="${x0 - 30},200 600,90 ${x0 + 510},200" fill="${p.telhado}"/>
<rect x="${x0}" y="200" width="480" height="410" fill="${p.parede}"/>
<rect x="${x0}" y="395" width="480" height="16" fill="${p.paredeEscura}"/>
${janela(x0 + 50, 240, 140, 110, p)}${janela(x0 + 290, 240, 140, 110, p)}
<rect x="${x0 + 40}" y="345" width="160" height="10" fill="${p.destaque}"/>
<rect x="${x0 + 60}" y="450" width="100" height="160" rx="6" fill="${p.porta}"/>${janela(x0 + 260, 450, 170, 100, p)}
<rect x="${x0 + 60}" y="610" width="100" height="190" fill="#CFC6B8"/>`;
  return moldura(c, titulo);
}

export function fachadaPredio(p: PaletaIlustracao, andares: number, titulo: string): string {
  const alturaAndar = 80;
  const topo = 600 - andares * alturaAndar;
  let janelas = '';
  for (let a = 0; a < andares; a++) {
    for (let j = 0; j < 4; j++) {
      janelas += `<rect x="${410 + j * 100}" y="${topo + 18 + a * alturaAndar}" width="60" height="46" fill="#BFE3F5" stroke="#fff" stroke-width="5"/>`;
    }
  }
  const c = `${ceu('#A5D8F3', '#E3F4FC')}${gramado}${arvore(200, 1.1)}${arvore(1000, 1.2)}
<rect x="380" y="${topo - 20}" width="440" height="${andares * alturaAndar + 20}" fill="${p.parede}"/>
<rect x="370" y="${topo - 34}" width="460" height="20" fill="${p.telhado}"/>
<rect x="380" y="${topo - 20}" width="24" height="${andares * alturaAndar + 20}" fill="${p.paredeEscura}"/>
<rect x="796" y="${topo - 20}" width="24" height="${andares * alturaAndar + 20}" fill="${p.paredeEscura}"/>
${janelas}
<rect x="560" y="520" width="80" height="80" fill="${p.porta}"/><rect x="540" y="508" width="120" height="14" fill="${p.destaque}"/>`;
  return moldura(c, titulo);
}

function ambiente(p: PaletaIlustracao, moveis: string, titulo: string): string {
  const c = `<rect width="${W}" height="${H}" fill="${p.parede}"/><rect y="560" width="${W}" height="240" fill="${p.piso}"/>
<g stroke="${p.paredeEscura}" stroke-width="2" opacity=".6">${Array.from({ length: 12 }, (_, i) => `<line x1="${i * 110}" y1="560" x2="${i * 110 - 80}" y2="800"/>`).join('')}</g>
<rect y="552" width="${W}" height="12" fill="${p.paredeEscura}"/>${moveis}`;
  return moldura(c, titulo);
}

export function sala(p: PaletaIlustracao, titulo: string): string {
  return ambiente(
    p,
    `${janela(760, 170, 280, 220, p)}
<rect x="170" y="430" width="420" height="120" rx="24" fill="${p.porta}"/><rect x="150" y="400" width="60" height="150" rx="20" fill="${p.porta}"/><rect x="550" y="400" width="60" height="150" rx="20" fill="${p.porta}"/>
<rect x="210" y="410" width="160" height="60" rx="14" fill="${p.destaque}" opacity=".85"/><rect x="390" y="410" width="160" height="60" rx="14" fill="${p.paredeEscura}"/>
<rect x="250" y="600" width="260" height="20" rx="8" fill="#7A5230"/><rect x="270" y="620" width="16" height="60" fill="#7A5230"/><rect x="474" y="620" width="16" height="60" fill="#7A5230"/>
<rect x="240" y="200" width="200" height="140" fill="#fff" stroke="${p.paredeEscura}" stroke-width="10"/><polygon points="260,320 330,240 380,300 420,260 420,320" fill="${p.destaque}" opacity=".6"/>
<rect x="880" y="470" width="100" height="90" rx="10" fill="#4E9A51"/>`,
    titulo,
  );
}

export function cozinha(p: PaletaIlustracao, titulo: string): string {
  return ambiente(
    p,
    `<rect x="120" y="360" width="960" height="200" fill="#fff"/><rect x="120" y="350" width="960" height="22" fill="#9A9A9A"/>
${Array.from({ length: 6 }, (_, i) => `<rect x="${140 + i * 157}" y="390" width="140" height="150" rx="6" fill="${p.paredeEscura}"/><rect x="${200 + i * 157}" y="400" width="20" height="8" rx="4" fill="#666"/>`).join('')}
${Array.from({ length: 4 }, (_, i) => `<rect x="${160 + i * 180}" y="130" width="160" height="130" rx="6" fill="${p.porta}" opacity=".9"/>`).join('')}
<rect x="900" y="110" width="160" height="220" fill="#BFE3F5" stroke="#fff" stroke-width="8"/>
<rect x="430" y="330" width="120" height="20" rx="6" fill="#C0C0C0"/><circle cx="700" cy="320" r="26" fill="${p.destaque}"/>`,
    titulo,
  );
}

export function quarto(p: PaletaIlustracao, titulo: string): string {
  return ambiente(
    p,
    `${janela(820, 170, 220, 200, p)}
<rect x="260" y="300" width="440" height="140" rx="16" fill="${p.porta}"/>
<rect x="240" y="430" width="480" height="130" rx="18" fill="#fff"/><rect x="240" y="470" width="480" height="90" rx="18" fill="${p.destaque}" opacity=".75"/>
<rect x="290" y="400" width="150" height="50" rx="20" fill="#F3F3F3"/><rect x="520" y="400" width="150" height="50" rx="20" fill="#F3F3F3"/>
<rect x="110" y="440" width="100" height="120" rx="8" fill="${p.paredeEscura}"/><circle cx="160" cy="410" r="30" fill="#FFE8A3"/>`,
    titulo,
  );
}

export function banheiro(p: PaletaIlustracao, titulo: string): string {
  return ambiente(
    { ...p, parede: '#EEF3F6', paredeEscura: '#D5DEE4', piso: '#C9D3DA' },
    `<g stroke="#D5DEE4" stroke-width="3">${Array.from({ length: 10 }, (_, i) => `<line x1="0" y1="${60 + i * 50}" x2="${W}" y2="${60 + i * 50}"/>`).join('')}</g>
<rect x="160" y="250" width="160" height="210" rx="10" fill="#fff" stroke="#BFC9D0" stroke-width="6"/><rect x="200" y="200" width="80" height="40" rx="8" fill="#BFE3F5"/>
<rect x="140" y="460" width="220" height="100" rx="12" fill="#fff"/><ellipse cx="250" cy="470" rx="80" ry="16" fill="#E6EEF2"/>
<rect x="520" y="420" width="120" height="140" rx="40" fill="#fff"/><rect x="530" y="360" width="100" height="70" rx="12" fill="#fff"/>
<rect x="780" y="120" width="300" height="440" fill="#DCEFF7" stroke="#BFC9D0" stroke-width="6"/><circle cx="930" cy="170" r="30" fill="#C0C0C0"/>
<rect x="400" y="200" width="40" height="160" rx="10" fill="${p.destaque}" opacity=".7"/>`,
    titulo,
  );
}

export function areaExterna(p: PaletaIlustracao, titulo: string, lazer: boolean): string {
  const extra = lazer
    ? `<rect x="620" y="560" width="440" height="160" rx="30" fill="#5BC0EB"/><rect x="640" y="580" width="400" height="120" rx="24" fill="#8FD6F2"/>
<g><rect x="200" y="470" width="14" height="130" fill="${p.porta}"/><rect x="330" y="470" width="14" height="130" fill="${p.porta}"/><rect x="190" y="460" width="164" height="14" fill="${p.destaque}"/><rect x="250" y="474" width="4" height="80" fill="#555"/><rect x="236" y="552" width="34" height="10" fill="${p.telhado}"/></g>`
    : `<rect x="600" y="360" width="420" height="240" fill="${p.parede}"/><rect x="600" y="340" width="420" height="24" fill="${p.telhado}"/><rect x="640" y="420" width="140" height="140" fill="${p.paredeEscura}"/><rect x="840" y="400" width="140" height="80" fill="#BFE3F5" stroke="#fff" stroke-width="6"/>
<g stroke="#666" stroke-width="3"><line x1="160" y1="360" x2="520" y2="360"/></g><g fill="${p.destaque}"><rect x="200" y="360" width="40" height="70"/><rect x="290" y="360" width="50" height="60" fill="#fff"/><rect x="390" y="360" width="40" height="80"/></g>`;
  const c = `${ceu('#9BD3F2', '#DDF1FB')}${gramado}${arvore(120, 1.1)}${extra}`;
  return moldura(c, titulo);
}
