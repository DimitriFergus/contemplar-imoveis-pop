// Capturas de tela de revisão (uso interno): npx tsx scripts/capturas.mts <baseUrl> <pasta> [rotas...]
import { chromium } from '@playwright/test';
const [base = 'http://localhost:3000', pasta = 'capturas', ...rotasArg] = process.argv.slice(2);
const rotas = rotasArg.length ? rotasArg : ['/'];
const larguras = (process.env.LARGURAS ?? '360,768,1280').split(',').map(Number);
const navegador = await chromium.launch();
for (const w of larguras) {
  const ctx = await navegador.newContext({
    viewport: { width: w, height: 800 },
    deviceScaleFactor: 1,
    colorScheme: process.env.TEMA === 'escuro' ? 'dark' : 'light',
  });
  const p = await ctx.newPage();
  const erros: string[] = [];
  p.on('pageerror', (e) => erros.push(e.message));
  p.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
  for (const r of rotas) {
    await p.goto(base + r, { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    const larg = await p.evaluate(() => document.documentElement.scrollWidth);
    const nome = `${pasta}/${w}${r.replace(/[\/?=&]/g, '_') || '_home'}.png`;
    await p.screenshot({ path: nome, fullPage: true });
    console.log(w, r, 'scrollWidth', larg, larg > w ? 'ESTOURO HORIZONTAL' : 'ok');
  }
  if (erros.length) console.log('erros', w, erros.slice(0, 5));
  await ctx.close();
}
await navegador.close();
