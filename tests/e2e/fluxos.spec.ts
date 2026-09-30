import { expect, test, type Page } from '@playwright/test';
import { servico, supabaseDisponivel } from './apoio/painel';

// Com o Supabase configurado, os formulários gravam leads de verdade: apaga os de teste no fim.
test.afterAll(async () => {
  if (supabaseDisponivel)
    await servico().from('leads').delete().in('nome', ['Pessoa de Teste', 'Visitante Teste']);
});

const ehCelular = (page: Page) => (page.viewportSize()?.width ?? 1280) < 1024;

test.describe('Buscar e filtrar', () => {
  test('busca por parcela na home leva à listagem com o filtro na URL', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const busca = page.getByRole('search', { name: 'Buscar imóveis' });
    await busca.getByText('Buscar por parcela').click();
    await busca.getByLabel('Parcela até').selectOption('1500');
    await busca.getByRole('button', { name: 'Buscar' }).click();
    await expect(page).toHaveURL(/\/imoveis\?parcelaMax=1500/);
    await expect(
      page.getByRole('link', { name: /Remover filtro: Parcela até R\$ 1\.500/ }),
    ).toBeVisible();
    await expect(page.getByTestId('card-imovel').first()).toBeVisible();
  });

  test('filtros ficam na URL, são restaurados ao recarregar e podem ser removidos', async ({
    page,
  }) => {
    await page.goto('/imoveis', { waitUntil: 'networkidle' });
    const total = Number(
      (await page.getByRole('status').filter({ hasText: 'encontrados' }).innerText()).match(
        /\d+/,
      )?.[0],
    );

    if (ehCelular(page)) {
      await page.getByRole('button', { name: 'Abrir filtros' }).click();
      const painel = page.getByRole('dialog');
      await painel.getByLabel('Casas', { exact: true }).check();
      await painel.getByRole('button', { name: /^Ver \d+ imóve/ }).click();
    } else {
      const form = page.getByRole('form', { name: 'Filtros da busca' });
      await form.getByLabel('Casas', { exact: true }).check();
      await form.getByRole('button', { name: /^Ver \d+ imóve/ }).click();
    }
    await expect(page).toHaveURL(/tipo=casa/);
    await page.reload();
    await expect(page).toHaveURL(/tipo=casa/);
    const filtrado = Number(
      (await page.getByRole('status').filter({ hasText: 'encontrado' }).innerText()).match(
        /\d+/,
      )?.[0],
    );
    expect(filtrado).toBeGreaterThan(0);
    expect(filtrado).toBeLessThan(total);
    for (const card of await page.getByTestId('card-imovel').all()) {
      await expect(card.getByText('Casa', { exact: true })).toBeVisible();
    }
    await page.getByRole('link', { name: 'Remover filtro: Casas' }).click();
    await expect(page).toHaveURL(/\/imoveis$/);
  });

  test('ordenação por menor preço', async ({ page }) => {
    await page.goto('/imoveis', { waitUntil: 'networkidle' });
    await page.getByLabel('Ordenar').selectOption('menor_preco');
    await expect(page).toHaveURL(/ordem=menor_preco/);
    const precos = await page
      .getByTestId('card-imovel')
      .getByText(/^Valor total:/)
      .allInnerTexts();
    const valores = precos.map((p) => Number(p.replace(/\D/g, '')));
    expect(valores).toEqual([...valores].sort((a, b) => a - b));
  });
});

test.describe('Anúncio', () => {
  test('abre o anúncio e o WhatsApp leva código, título e origem', async ({ page }) => {
    await page.goto('/imoveis?utm_source=instagram&utm_medium=anuncio&utm_campaign=teste', {
      waitUntil: 'networkidle',
    });
    await page.getByTestId('card-imovel').first().getByRole('heading').getByRole('link').click();
    await expect(page).toHaveURL(/\/imoveis\/.+-cp-\d{4}$/);
    const titulo = await page.getByRole('heading', { level: 1 }).innerText();
    const codigo =
      page
        .url()
        .match(/cp-\d{4}$/)?.[0]
        .toUpperCase() ?? '';

    // Parcela sempre acompanhada do preço total e do aviso de simulação
    await expect(page.getByText(/^Valor total:/).first()).toBeVisible();
    await expect(
      page.getByText(/Simulação ilustrativa com base em parâmetros de referência/).first(),
    ).toBeVisible();

    const hrefs = await page
      .locator('a[data-evento="whatsapp"]:visible')
      .evaluateAll((els) => els.map((e) => decodeURIComponent(e.getAttribute('href') ?? '')));
    const href = hrefs.find((h) => h.includes(codigo)) ?? '';
    expect(href).toContain('https://wa.me/');
    expect(href).toContain(`imóvel ${codigo} (${titulo})`);
    expect(href).toContain('origem: instagram / anuncio / teste');
  });

  test('simulador embutido já vem preenchido e mostra o custo total', async ({ page }) => {
    await page.goto('/imoveis/casas', { waitUntil: 'networkidle' });
    await page.getByTestId('card-imovel').first().getByRole('heading').getByRole('link').click();
    await expect(page.getByTestId('parcela-simulada')).toContainText('R$');
    await expect(
      page.getByRole('heading', { name: 'Quanto custa comprar este imóvel' }),
    ).toBeVisible();
    await expect(page.getByText('Total para desembolsar no início (estimativa)')).toBeVisible();
  });

  test('JSON-LD de anúncio imobiliário com preço em BRL', async ({ page }) => {
    await page.goto('/imoveis/casas', { waitUntil: 'networkidle' });
    await page.getByTestId('card-imovel').first().getByRole('heading').getByRole('link').click();
    await expect(page).toHaveURL(/-cp-\d{4}$/);
    const blocos = await page.locator('script[type="application/ld+json"]').allTextContents();
    const anuncio = blocos
      .map((b) => JSON.parse(b))
      .find((d) => d['@type'] === 'RealEstateListing');
    expect(anuncio.offers.priceCurrency).toBe('BRL');
    expect(anuncio.offers.price).toBeGreaterThan(0);
  });
});

test.describe('Simular', () => {
  test('Cabe no Meu Bolso calcula, salva e marca os imóveis', async ({ page }) => {
    await page.goto('/simulador', { waitUntil: 'networkidle' });
    await page.getByLabel('Renda familiar bruta por mês').fill('4000');
    await page.getByLabel('Quanto você tem para a entrada').fill('20000');
    await page.getByRole('textbox', { name: /Saldo de FGTS/ }).fill('10000');
    await page.getByRole('button', { name: 'Calcular quanto posso pagar' }).click();
    const resultado = page.getByTestId('resultado-cabe-no-bolso');
    await expect(resultado).toContainText('Faixa 2');
    await expect(resultado).toContainText('Poder de compra estimado');
    await expect(resultado).toContainText('subsídio');
    await resultado.getByRole('link', { name: 'Ver imóveis que cabem no meu bolso' }).click();
    await expect(page).toHaveURL(/bolso=\d+/);
    await expect(page.getByText('Cabe no seu bolso', { exact: true }).first()).toBeVisible();
  });

  test('simulação de financiamento mostra tabela e gráfico', async ({ page }) => {
    await page.goto('/simulador?aba=financiamento&valor=250000', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('primeira-parcela')).toContainText('R$');
    await expect(page.getByRole('img', { name: /Gráfico de barras/ })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Resumo anual do financiamento' })).toBeVisible();
    await page.getByText('Price', { exact: true }).click();
    await expect(page.getByText('Parcela (todas iguais)')).toBeVisible();
  });
});

test.describe('Leads', () => {
  test('envia o formulário de contato e mostra a confirmação com WhatsApp', async ({ page }) => {
    await page.goto('/contato', { waitUntil: 'networkidle' });
    await page.getByLabel('Seu nome').fill('Pessoa de Teste');
    await page.getByLabel('WhatsApp com DDD').fill('(11) 91234-5678');
    await page
      .getByLabel('Como podemos ajudar?')
      .fill('Quero saber mais sobre imóveis de 2 quartos.');
    await page.getByRole('checkbox', { name: /Concordo/ }).check();
    await page.getByRole('button', { name: 'Enviar mensagem' }).click();
    const confirmacao = page.getByTestId('confirmacao-lead');
    await expect(confirmacao).toContainText('Recebemos seu contato!');
    await expect(confirmacao.getByRole('link', { name: 'Falar agora no WhatsApp' })).toBeVisible();
  });

  test('API recusa lead sem consentimento e aceita honeypot silenciosamente', async ({
    request,
  }) => {
    const semConsentimento = await request.post('/api/leads', {
      data: {
        origem: 'formulario_contato',
        nome: 'Teste',
        whatsapp: '11912345678',
        consentimentoLGPD: false,
      },
    });
    expect(semConsentimento.status()).toBe(422);
    const robo = await request.post('/api/leads', {
      data: {
        origem: 'formulario_contato',
        nome: 'Robô',
        whatsapp: '11912345678',
        consentimentoLGPD: true,
        site: 'spam',
      },
    });
    expect(robo.status()).toBe(200);
  });

  test('agenda visita escolhendo dia e período', async ({ page }) => {
    await page.goto('/imoveis/apartamentos', { waitUntil: 'networkidle' });
    await page.getByTestId('card-imovel').first().getByRole('heading').getByRole('link').click();
    await page
      .getByRole('button', { name: /^Agendar( visita)?$/ })
      .filter({ visible: true })
      .first()
      .click();
    const dialogo = page.getByRole('dialog', { name: 'Agendar visita' });
    await dialogo
      .locator('label')
      .filter({ has: page.locator('input[name="data-visita"]') })
      .first()
      .click();
    await dialogo.getByText('Manhã', { exact: true }).click();
    await dialogo.getByLabel('Seu nome').fill('Visitante Teste');
    await dialogo.getByLabel('WhatsApp com DDD').fill('11987654321');
    await dialogo.getByRole('checkbox', { name: /Concordo/ }).check();
    await dialogo.getByRole('button', { name: 'Pedir agendamento' }).click();
    await expect(dialogo.getByTestId('confirmacao-lead')).toBeVisible();
  });
});

test.describe('Favoritos e comparação', () => {
  test('favorita e vê o imóvel nos favoritos', async ({ page }) => {
    await page.goto('/imoveis', { waitUntil: 'networkidle' });
    const cards = page.getByTestId('card-imovel');
    await cards
      .nth(0)
      .getByRole('button', { name: /Salvar .* nos favoritos/ })
      .click();
    await expect(page.getByRole('link', { name: /Favoritos \(1 imóvel salvo\)/ })).toBeVisible();
    await page.goto('/favoritos', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('card-imovel')).toHaveCount(1);
    await expect(page.getByRole('button', { name: /^Comparar/ })).toHaveCount(0);
  });

  test('compara imóveis na listagem com ganhos em verde e perdas em vermelho', async ({ page }) => {
    await page.goto('/imoveis', { waitUntil: 'networkidle' });
    const cards = page.getByTestId('card-imovel');
    await cards
      .nth(0)
      .getByRole('button', { name: /^Comparar imóvel/ })
      .click();
    const painel = page.getByRole('complementary', { name: 'Comparação de imóveis' });
    await expect(painel).toContainText(/Base: CP-\d{4}/);
    await expect(cards.nth(0)).toContainText('Imóvel base');
    await expect(cards.nth(1)).toContainText(/Comparado ao CP-\d{4}: ganha em \d+ · perde em \d+/);

    await cards
      .nth(1)
      .getByRole('button', { name: /^Comparar com este/ })
      .click();
    await expect(painel).toContainText(/Ganha \d+/);
    await expect(painel).toContainText(/Perde \d+/);
    await expect(painel.getByRole('link', { name: /Ver anúncio/ })).toBeVisible();
    // Cartão compacto: não pode ocupar mais que metade da largura no computador
    const caixa = await painel.boundingBox();
    const largura = page.viewportSize()?.width ?? 0;
    expect(caixa?.width ?? 0).toBeLessThanOrEqual(Math.max(330, largura * 0.5));

    await painel.getByRole('button', { name: 'Encerrar comparação' }).click();
    await expect(painel).toHaveCount(0);
  });

  test('a comparação não aparece fora da área de imóveis', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /^Comparar/ })).toHaveCount(0);
    await page.goto('/imoveis/casas', { waitUntil: 'networkidle' });
    await page.getByTestId('card-imovel').first().getByRole('heading').getByRole('link').click();
    await expect(page).toHaveURL(/-cp-\d{4}$/);
    await expect(page.getByRole('button', { name: /^Comparar/ })).toHaveCount(0);
  });
});

test.describe('Minha Casa, Minha Vida e checklist', () => {
  test('faixa do MCMV na home abre os imóveis compatíveis com a renda', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Faixa 1/ }).click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo).toContainText(/permite imóveis de até R\$/);
    await expect(dialogo.getByRole('link', { name: /CP-\d{4}/ }).first()).toBeVisible();
    await expect(dialogo.getByRole('link', { name: 'Fazer minha simulação' })).toBeVisible();
    await dialogo.getByRole('link', { name: 'Fazer minha simulação' }).click();
    await expect(page).toHaveURL(/\/simulador$/);
  });

  test('como comprar oferece o checklist em PDF', async ({ page, request }) => {
    await page.goto('/como-comprar', { waitUntil: 'networkidle' });
    const link = page.getByRole('link', { name: /Baixar checklist em PDF/ });
    await expect(link).toBeVisible();
    const href = (await link.getAttribute('href')) ?? '';
    const resp = await request.get(href);
    expect(resp.status()).toBe(200);
    expect(resp.headers()['content-type']).toContain('pdf');
    expect((await resp.body()).subarray(0, 4).toString()).toBe('%PDF');
  });
});
