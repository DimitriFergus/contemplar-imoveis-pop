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
let segredoAdmin = '';
const extras: ContaTeste[] = [];
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
  await limparContas([corretorA, corretorB, admin, ...extras].filter(Boolean));
});

async function entrar(page: Page, conta: ContaTeste) {
  await page.goto('/admin/entrar');
  await page.getByLabel('E-mail').fill(conta.email);
  await page.getByLabel('Senha').fill(conta.senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

/** Entra e espera o login concluir (painel ou tela do MFA) antes de seguir. */
async function entrarNoPainel(page: Page, conta: ContaTeste) {
  await entrar(page, conta);
  await page.waitForURL(/\/admin\/?(mfa\/?)?$/, { timeout: 20_000 });
}

test('sem login, o painel manda para a tela de entrada', async ({ page }) => {
  await page.goto('/admin/imoveis');
  await expect(page).toHaveURL(/\/admin\/entrar/);
  await entrar(page, { ...corretorA, senha: 'senha-errada-123' });
  await expect(page.getByText('E-mail ou senha incorretos')).toBeVisible();
});

test('corretor cadastra imóvel, envia foto e publica', async ({ page }) => {
  await entrarNoPainel(page, corretorA);
  await expect(page.getByRole('heading', { name: /Olá, Teste/ })).toBeVisible();

  await page.goto('/admin/imoveis/novo');
  // Validação no navegador: sem título, não salva.
  await page.getByRole('button', { name: 'Salvar' }).click();
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
  // Fotos no próprio cadastro (a foto é convertida para WebP no navegador).
  await page.getByTestId('entrada-fotos').setInputFiles(FOTO);
  await expect(page.getByLabel(/Descrição da foto 1/)).toBeVisible({ timeout: 30_000 });
  await page.getByLabel(/Descrição da foto 1/).fill('Fachada da casa de teste com portão');
  // O status escolhido é salvo junto, sem passar por rascunho.
  await page.getByLabel('Status').selectOption('publicado');
  await page.getByRole('button', { name: 'Salvar' }).click();

  await expect(page).toHaveURL(/\/admin\/imoveis\/editar\/?\?id=[0-9a-f-]{36}&novo=1/, {
    timeout: 30_000,
  });
  imovelA.id = page.url().match(/id=([0-9a-f-]{36})/)?.[1] ?? '';
  await expect(page.getByText(/Imóvel salvo com o código CP-\d{4}/)).toBeVisible();
  imovelA.codigo = (await page.getByText(/Imóvel salvo com o código/).innerText()).match(
    /CP-\d{4}/,
  )![0];
  await expect(page.locator('img[src*="/storage/v1/object/public/imoveis/"]')).toHaveCount(1);
  await expect(page.locator('img[src$=".webp"]')).toHaveCount(1);

  // Pré-visualização e site público atualizado na hora.
  await page.goto(`/admin/imoveis/previa?id=${imovelA.id}`);
  await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
  const { data } = await servico().from('imoveis').select('slug').eq('id', imovelA.id).single();
  imovelA.slug = data!.slug as string;
  await page.goto(`/imoveis/${imovelA.slug}`);
  await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
});

test('mudança de preço fica no histórico com destaque', async ({ page }) => {
  await entrarNoPainel(page, corretorA);
  await page.goto(`/admin/imoveis/editar?id=${imovelA.id}`);
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
  await entrarNoPainel(page, corretorA);
  await page.goto(`/admin/imoveis/editar?id=${imovelA.id}`);
  await page.getByRole('button', { name: 'Duplicar imóvel' }).click();
  await expect(page.getByText(/Cópia criada como rascunho/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByLabel('Título do anúncio')).toHaveValue(/Casa teste E2E/);
  await expect(page.locator('img[src*="/storage/v1/object/public/imoveis/"]')).toHaveCount(1);
});

test('lead do site chega ao corretor do imóvel', async ({ page }) => {
  // O visitante pede contato na página do imóvel (grava pelo servidor ou direto no banco).
  await page.goto(`/imoveis/${imovelA.slug}`, { waitUntil: 'networkidle' });
  const contato = page.locator('section[aria-labelledby="titulo-contato"]');
  await contato.getByLabel('Seu nome').fill('Cliente Teste E2E');
  await contato.getByLabel('WhatsApp com DDD').fill('(85) 99999-0000');
  await contato.getByRole('checkbox', { name: /Concordo/ }).check();
  await contato.getByRole('button', { name: 'Quero receber contato' }).click();
  await expect(contato.getByText('Recebemos seu contato!')).toBeVisible({ timeout: 20_000 });

  await entrarNoPainel(page, corretorA);
  await page.goto('/admin/leads');
  const cartao = page.getByTestId('cartao-lead').filter({ hasText: 'Cliente Teste E2E' });
  await expect(cartao).toBeVisible();
  const gravou = page.waitForResponse(
    (r) => r.url().includes('/rest/v1/leads') && r.request().method() === 'PATCH' && r.ok(),
  );
  await cartao.getByRole('combobox').selectOption('em_atendimento');
  await gravou;
  await page.reload();
  await expect(
    page
      .getByRole('region', { name: /Em atendimento/ })
      .getByRole('link', { name: 'Cliente Teste E2E', exact: true }),
  ).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Exportar planilha/ }).click();
  expect((await download).suggestedFilename()).toMatch(/^leads-contemplar-.*\.xlsx$/);
});

test('um corretor não vê nem altera imóveis e leads de outro', async ({ page }) => {
  await entrarNoPainel(page, corretorB);
  await expect(page.getByRole('heading', { name: /Olá, Teste/ })).toBeVisible();

  await page.goto('/admin/imoveis');
  await expect(page.getByText(imovelA.codigo)).toHaveCount(0);
  await page.goto(`/admin/imoveis/editar?id=${imovelA.id}`);
  await expect(page.getByText('Imóvel não encontrado')).toBeVisible();
  await expect(page.getByLabel('Título do anúncio')).toHaveCount(0);

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
  await entrarNoPainel(page, admin);
  await expect(page).toHaveURL(/\/admin\/mfa/);
  await page.getByRole('button', { name: 'Gerar QR Code' }).click();
  const segredo = (await page.locator('code').innerText()).trim();
  // Enquanto o MFA não é confirmado, o painel continua bloqueado.
  await page.goto('/admin/imoveis');
  await expect(page).toHaveURL(/\/admin\/mfa/);
  await page.getByRole('button', { name: 'Gerar QR Code' }).click();
  const novoSegredo = (await page.locator('code').innerText()).trim();
  segredoAdmin = novoSegredo || segredo;
  await page.getByLabel('Código de 6 números').fill(codigoTotp(segredoAdmin));
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByRole('heading', { name: /Olá, Teste/ })).toBeVisible({ timeout: 20_000 });

  await page.goto(`/admin/imoveis?busca=${imovelA.codigo}`);
  await expect(page.getByText(imovelA.codigo).first()).toBeVisible();
  await page.goto('/admin/historico?filtro=precos');
  await expect(page.getByTestId('historico')).toContainText('R$ 179.900');
});

test('admin cadastra um corretor na Equipe e ele consegue entrar', async ({ page, browser }) => {
  await entrarNoPainel(page, admin);
  await page.getByLabel('Código de 6 números').fill(codigoTotp(segredoAdmin));
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByRole('heading', { name: /Olá, Teste/ })).toBeVisible({ timeout: 20_000 });

  await page.goto('/admin/equipe');
  const email = `e2e-painel-novo-${Date.now()}@teste.contemplar.dev`;
  await page.getByLabel('Nome completo').fill('Corretor Cadastrado Pelo Painel');
  await page.getByLabel('E-mail (login)').fill(email);
  await page.getByLabel('Senha provisória').fill('SenhaProvisoria123');
  await page.getByLabel('CRECI').first().fill('12345-F');
  await page.getByRole('button', { name: 'Criar acesso' }).click();
  await expect(page.getByText(/já pode entrar no painel/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(email)).toBeVisible();

  const { data } = await servico()
    .from('perfis')
    .select('id, corretor_id')
    .eq('email', email)
    .single();
  extras.push({
    id: data!.id as string,
    email,
    senha: 'SenhaProvisoria123',
    nome: '',
    papel: 'corretor',
    corretorId: data!.corretor_id as string,
  });

  const outra = await browser.newPage();
  await entrarNoPainel(outra, extras.at(-1)!);
  await expect(outra.getByRole('heading', { name: /Olá, Corretor/ })).toBeVisible();
  await outra.close();
});
