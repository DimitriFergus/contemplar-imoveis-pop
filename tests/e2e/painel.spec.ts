/**
 * Painel administrativo (/admin): login, MFA do admin, cadastro, upload de fotos, publicação,
 * leads e bloqueio de acesso entre corretores. Precisa do Supabase configurado no .env.local;
 * sem ele os testes são pulados. Rodam só no projeto "desktop", em sequência.
 */
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { expect, test, type Page } from '@playwright/test';
import {
  CHAVE_PUBLICA,
  URL_SUPABASE,
  codigoTotp,
  criarConta,
  limparContas,
  servico,
  supabaseDisponivel,
  type ContaTeste,
} from './apoio/painel';

test.describe.configure({ mode: 'serial' });

const FOTO = path.join(process.cwd(), 'public', 'imoveis', 'CP-0001', '01.jpg');

let corretorA: ContaTeste;
let corretorB: ContaTeste;
let admin: ContaTeste;
const imovelA = { id: '', slug: '', codigo: '' };

test.beforeEach(({}, info) => {
  test.skip(!supabaseDisponivel, 'Supabase não configurado no .env.local');
  test.skip(info.project.name !== 'desktop', 'Painel testado só no desktop');
});

test.beforeAll(async ({}, info) => {
  if (!supabaseDisponivel || info.project.name !== 'desktop') return;
  [corretorA, corretorB, admin] = await Promise.all([
    criarConta('corretor', 'a'),
    criarConta('corretor', 'b'),
    criarConta('admin', 'adm'),
  ]);
});

test.afterAll(async ({}, info) => {
  if (!supabaseDisponivel || info.project.name !== 'desktop') return;
  await limparContas([corretorA, corretorB, admin].filter(Boolean));
});

async function entrar(page: Page, conta: ContaTeste) {
  await page.goto('/admin/entrar');
  await page.getByLabel('E-mail').fill(conta.email);
  await page.getByLabel('Senha').fill(conta.senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

test('sem login, o painel manda para a tela de entrada', async ({ page }) => {
  await page.goto('/admin/imoveis');
  await expect(page).toHaveURL(/\/admin\/entrar/);
  await entrar(page, { ...corretorA, senha: 'senha-errada-123' });
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos');
});

test('corretor cadastra imóvel, envia foto e publica', async ({ page }) => {
  await entrar(page, corretorA);
  await expect(page.getByRole('heading', { name: /Olá, Teste/ })).toBeVisible();

  await page.goto('/admin/imoveis/novo');
  // Validação no navegador: sem título, não salva.
  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
  await expect(page.locator('#titulo-erro')).toBeVisible();

  const titulo = `Casa teste E2E ${Date.now().toString().slice(-6)}`;
  await page.getByLabel('Título do anúncio').fill(titulo);
  await page
    .getByLabel('Descrição')
    .fill('Casa criada pelo teste automático do painel, com sala, cozinha e quintal amplo.');
  await page.getByLabel('Preço (R$)').fill('185000');
  await page.getByLabel('Bairro').fill('Bairro Teste E2E');
  await page.getByLabel('Latitude').fill('-3.795, -38.587');
  await page.getByLabel('Área útil (m²)').fill('60');
  await page.getByRole('button', { name: 'Salvar rascunho' }).click();

  await expect(page).toHaveURL(/\/admin\/imoveis\/[0-9a-f-]{36}\?novo=1/, { timeout: 20_000 });
  imovelA.id = page.url().match(/imoveis\/([0-9a-f-]{36})/)?.[1] ?? '';
  await expect(page.getByText(/Rascunho criado com o código CP-\d{4}/)).toBeVisible();
  imovelA.codigo = (await page.getByText(/Rascunho criado/).innerText()).match(/CP-\d{4}/)![0];

  // Publicar sem foto: bloqueado.
  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByText('adicione pelo menos uma foto antes de publicar')).toBeVisible();

  // Upload (a foto é convertida para WebP no navegador).
  await page.getByTestId('entrada-fotos').setInputFiles(FOTO);
  const alt = page.getByLabel(/Descrição da foto 1/);
  await expect(alt).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('img[src*="/storage/v1/object/public/imoveis/"]')).toHaveCount(1);
  await expect(page.locator('img[src$=".webp"]')).toHaveCount(1);

  // Descrição (alt) obrigatória.
  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect(page.locator('#foto-alt-0-erro')).toBeVisible();
  await alt.fill('Fachada da casa de teste com portão');
  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByText('Salvo! O site já foi atualizado')).toBeVisible({ timeout: 20_000 });

  // Pré-visualização e site público atualizado na hora.
  await page.goto(`/admin/imoveis/${imovelA.id}/previa`);
  await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
  const { data } = await servico().from('imoveis').select('slug').eq('id', imovelA.id).single();
  imovelA.slug = data!.slug as string;
  await page.goto(`/imoveis/${imovelA.slug}`);
  await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
});

test('mudança de preço fica no histórico com destaque', async ({ page }) => {
  await entrar(page, corretorA);
  await page.goto(`/admin/imoveis/${imovelA.id}`);
  await page.getByLabel('Preço (R$)').fill('179900');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByText('Salvo! O site já foi atualizado')).toBeVisible({ timeout: 20_000 });
  await page.reload();
  const item = page.getByTestId('historico').locator('li[data-campo="preco"]').first();
  await expect(item).toContainText('R$ 185.000');
  await expect(item).toContainText('R$ 179.900');
  await expect(item).toContainText('-2,8%');
});

test('duplicar imóvel cria uma cópia em rascunho', async ({ page }) => {
  await entrar(page, corretorA);
  await page.goto(`/admin/imoveis/${imovelA.id}`);
  await page.getByRole('button', { name: 'Duplicar imóvel' }).click();
  await expect(page.getByText(/Cópia criada como rascunho/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByLabel('Título do anúncio')).toHaveValue(/Casa teste E2E/);
  await expect(page.locator('img[src*="/storage/v1/object/public/imoveis/"]')).toHaveCount(1);
});

test('lead do site chega ao corretor do imóvel', async ({ page, request }) => {
  const resp = await request.post('/api/leads', {
    data: {
      origem: 'formulario_imovel',
      nome: 'Cliente Teste E2E',
      whatsapp: '(85) 99999-0000',
      codigoImovel: imovelA.codigo,
      consentimentoLGPD: true,
    },
  });
  expect(resp.status()).toBe(201);

  await entrar(page, corretorA);
  await page.goto('/admin/leads');
  const cartao = page.getByTestId('cartao-lead').filter({ hasText: 'Cliente Teste E2E' });
  await expect(cartao).toBeVisible();
  await cartao.getByRole('combobox').selectOption('em_atendimento');
  await page.reload();
  await expect(
    page.getByRole('region', { name: /Em atendimento/ }).getByText('Cliente Teste E2E'),
  ).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: /Exportar planilha/ }).click();
  expect((await download).suggestedFilename()).toMatch(/^leads-contemplar-.*\.xlsx$/);
});

test('um corretor não vê nem altera imóveis e leads de outro', async ({ page }) => {
  await entrar(page, corretorB);
  await expect(page.getByRole('heading', { name: /Olá, Teste/ })).toBeVisible();

  await page.goto('/admin/imoveis');
  await expect(page.getByText(imovelA.codigo)).toHaveCount(0);
  const resp = await page.goto(`/admin/imoveis/${imovelA.id}`);
  expect(resp?.status()).toBe(404);

  await page.goto('/admin/leads');
  await expect(page.getByText('Cliente Teste E2E')).toHaveCount(0);

  await page.goto('/admin/equipe');
  await expect(page).toHaveURL(/aviso=somente-admin/);

  // Mesmo chamando o banco direto com a sessão do corretor B, as regras RLS bloqueiam.
  const cliente = createClient(URL_SUPABASE, CHAVE_PUBLICA, {
    auth: { persistSession: false },
  });
  await cliente.auth.signInWithPassword({ email: corretorB.email, password: corretorB.senha });
  const alteracao = await cliente
    .from('imoveis')
    .update({ destaque: true })
    .eq('id', imovelA.id)
    .select('id');
  expect(alteracao.data ?? []).toHaveLength(0);
  const leitura = await cliente.from('leads').select('id').eq('codigo_imovel', imovelA.codigo);
  expect(leitura.data ?? []).toHaveLength(0);
  const upload = await cliente.storage
    .from('imoveis')
    .upload(`${imovelA.id}/invasao.webp`, new Blob(['x'], { type: 'image/webp' }));
  expect(upload.error).not.toBeNull();
});

test('admin precisa do app autenticador (MFA) e vê tudo', async ({ page }) => {
  await entrar(page, admin);
  await expect(page).toHaveURL(/\/admin\/mfa/);
  await page.getByRole('button', { name: 'Gerar QR Code' }).click();
  const segredo = (await page.locator('code').innerText()).trim();
  // Enquanto o MFA não é confirmado, o painel continua bloqueado.
  await page.goto('/admin/imoveis');
  await expect(page).toHaveURL(/\/admin\/mfa/);
  await page.getByRole('button', { name: 'Gerar QR Code' }).click();
  const novoSegredo = (await page.locator('code').innerText()).trim();
  await page.getByLabel('Código de 6 números').fill(codigoTotp(novoSegredo || segredo));
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByRole('heading', { name: /Olá, Teste/ })).toBeVisible({ timeout: 20_000 });

  await page.goto(`/admin/imoveis?busca=${imovelA.codigo}`);
  await expect(page.getByText(imovelA.codigo).first()).toBeVisible();
  await page.goto('/admin/equipe');
  await expect(page.getByRole('heading', { name: 'Equipe' })).toBeVisible();
  await page.goto('/admin/historico?filtro=precos');
  await expect(page.getByTestId('historico')).toContainText('R$ 179.900');
});
