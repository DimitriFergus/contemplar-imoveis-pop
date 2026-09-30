# Contemplar Imóveis Pop

Site imobiliário da **Contemplar Imóveis Pop** (Grupo Ordnas): imóveis populares a partir de R$ 150 mil, com busca por **preço ou por parcela**, **Cabe no Meu Bolso**, simulador SAC/Price, custo total de aquisição, WhatsApp inteligente, favoritos e comparação na listagem (ganhos em verde, perdas em vermelho) sem login.

> **Fase 1.5:** painel administrativo em `/admin` (Supabase: banco, login com MFA e fotos) para cadastrar imóveis e atender leads. Manual em linguagem simples: [`docs/MANUAL_ADMIN.md`](docs/MANUAL_ADMIN.md).
>
> Fase 1 lançada com **24 imóveis fictícios** (`exemplo: true`) e modo demonstração. Veja [`docs/PENDENCIAS.md`](docs/PENDENCIAS.md) antes de publicar.

## Stack

| Camada     | Tecnologia                                                                  |
| ---------- | --------------------------------------------------------------------------- |
| Framework  | Next.js 16.3 (App Router, Turbopack) + React 19.2 + TypeScript 5.9 estrito  |
| Estilo     | Tailwind CSS 4.3 + shadcn/ui (Radix) + lucide-react                         |
| Validação  | Zod 4 (dados, formulários e API)                                            |
| Mapa       | Leaflet + OpenStreetMap (sem chave de API)                                  |
| Testes     | Vitest 5 (unidades) + Playwright 1.63 (E2E, celular e desktop)              |
| Banco/Auth | Supabase (Postgres com RLS, Auth com MFA/TOTP, Storage) via `@supabase/ssr` |
| Hospedagem | Vercel                                                                      |

## Comandos

```bash
npm install                 # instalar dependências
npx playwright install chromium   # (uma vez) navegador para os testes E2E

npm run dev                 # desenvolvimento em http://localhost:3000 (roda a importação antes)
npm run importar            # valida dados/imoveis.csv e gera src/data/*.json
npm run gerar-exemplos      # recria os 24 imóveis fictícios (sobrescreve a planilha!)
npm run fotos-exemplo       # baixa/otimiza as fotos CC0 dos imóveis de exemplo (dados/fotos-exemplo.json)

npm run build && npm start  # produção local
npm run lint                # ESLint
npm run typecheck           # TypeScript
npm run format              # Prettier
npm test                    # testes unitários (cálculos, CSV, filtros, leads)
npm run test:e2e            # testes E2E (requer build; sobe o servidor na porta 3100)
                            # os testes do painel rodam só com o Supabase configurado no .env.local

npm run supabase:migrar     # aplica supabase/migrations + seed no banco (SUPABASE_DB_URL)
npm run supabase:importar   # planilha + fotos (WebP) → Supabase (não sobrescreve; --atualizar sobrescreve)
npm run supabase:admin -- email "Nome"   # cria o primeiro administrador
npm run supabase:status     # conta os registros de cada tabela
bash scripts/lighthouse.sh http://localhost:3000 3 / /imoveis   # Lighthouse mobile (mediana)
```

Copie `.env.example` para `.env.local` e ajuste. Em produção, defina as mesmas variáveis na Vercel.

## Publicação no GitHub Pages (ativa)

Cada push na `main` dispara o workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml): lint, tipos e testes, depois build da **versão estática** (`NEXT_PUBLIC_MODO_ESTATICO=true`) lendo os imóveis do Supabase, e publicação em `https://<usuário>.github.io/<repositório>/`. A cada 10 minutos o workflow confere a impressão digital dos dados (`scripts/versao-dados.mjs`) e regera o site se algo mudou no painel.

Como funciona sem servidor:

- **painel `/admin`**: roda no navegador e fala direto com o Supabase (login, MFA, RLS, Storage); a gestão da equipe usa a Edge Function `supabase/functions/equipe`;
- **leads**: os formulários chamam a função `registrar_lead` do banco (validação, honeypot e limite por WhatsApp/minuto) e o lead cai no CRM na hora; se o banco falhar, o contato segue pelo WhatsApp;
- **dados ao vivo**: busca, favoritos, comparação e página do imóvel leem o banco ao abrir; imóvel novo ainda sem página gerada é mostrado pela página 404 (que busca no banco);
- cabeçalhos de segurança (CSP, HSTS) e otimização de imagens do Next não se aplicam.

Variáveis do repositório (Settings → Secrets and variables → Actions → _Variables_): `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (públicas).

Testar a versão estática localmente (em uma cópia): `rm -rf src/app/api`, `NEXT_PUBLIC_MODO_ESTATICO=true npm run build`, `node scripts/corrigir-exportacao.mjs out` e `E2E_ESTATICO=1 npx playwright test` (serve `out` com `scripts/servir-estatico.mjs`).

## Deploy na Vercel (versão completa, com servidor)

1. Crie um repositório Git com este projeto e envie ao GitHub.
2. Na Vercel: _Add New → Project_ → importe o repositório (framework detectado: Next.js).
3. Em _Environment Variables_, defina `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_MODO_DEMO`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` e, se quiser cópia dos leads, `LEADS_WEBHOOK_URL`.
4. _Deploy_. Cada push gera uma pré-visualização por branch; a `main` vai para produção.
5. O `prebuild` roda `npm run importar`: se a planilha tiver erro, o deploy é bloqueado e o site anterior continua no ar.

## Arquitetura

```
dados/                      planilha (fonte da verdade na Fase 1), corretores e modelo
public/imoveis/<CODIGO>/    fotos por imóvel (01.jpg, 02.jpg...) + CREDITOS.md
scripts/                    importar-imoveis.ts, gerar-exemplos.ts, ilustracoes.ts, capturas e lighthouse
src/app/                    rotas (App Router), sitemap, robots, manifest, imagens Open Graph
src/components/             ui (shadcn), layout, busca, imoveis, simulador, leads, comparacao, favoritos, conteudo, mapa
src/config/                 site.ts, financiamento.ts, custos-aquisicao.ts, pendencias.ts  ← todas as regras de negócio
src/content/                FAQ, glossário, jornada, documentos, depoimentos
src/data/                   JSON gerado pela importação (não editar à mão)
src/lib/financiamento/      cálculos puros e testados (taxas, Price, SAC, faixas, poder de compra, custos)
src/lib/repositorio/        interface + implementações local (src/data) e Supabase; escolhida em index.ts
src/lib/admin/              painel: sessão (DAL), Server Actions, consultas, revalidação
src/lib/supabase/           clientes (sessão, público com cache, serviço) e tipos das tabelas
src/app/admin/              painel /admin (entrar, MFA, imóveis, leads, equipe, histórico, conta)
src/proxy.ts                renova a sessão do Supabase e protege /admin
supabase/migrations/        SQL versionado: tabelas, RLS, auditoria, Storage; supabase/seed.sql
src/lib/busca/              filtros ⇄ URL, ordenação, paginação, chips
src/lib/schemas/            Zod (imóvel, lead)
tests/unit, tests/e2e
```

Princípios: páginas só falam com `repositorio`; nenhum número de regra de negócio fora de `src/config/`; anúncios gerados estaticamente (SSG, revalidação de 1 h); filtros sempre na URL; Zod só no servidor (o navegador recebe `src/lib/busca/query.ts` e `src/lib/constantes.ts`, sem Zod).

### Rotas

| Rota                                                                              | Conteúdo                                                                                                                                 |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                                               | Hero com busca preço/parcela, atalhos, destaques, jornada, MCMV, depoimentos, FAQ                                                        |
| `/imoveis`                                                                        | Listagem com filtros (painel inferior no celular), chips, ordenação, lista/mapa, paginação                                               |
| `/imoveis/casas`, `/apartamentos`, `/casas-em-condominio`, `/duplex`, `/sobrados` | Categorias                                                                                                                               |
| `/imoveis/bairro/[bairro]`                                                        | Imóveis por bairro                                                                                                                       |
| `/imoveis/[slug]`                                                                 | Anúncio: galeria, selos, simulador embutido, custo total, mapa aproximado, perto de você, agendamento, semelhantes, JSON-LD, OG dinâmico |
| `/simulador`                                                                      | "Quanto posso pagar?" (Cabe no Meu Bolso) e "Simular financiamento" (tabela e gráfico)                                                   |
| `/minha-casa-minha-vida`, `/como-comprar`                                         | Guias (checklist imprimível)                                                                                                             |
| `/favoritos`                                                                      | Salvos no navegador, sem login                                                                                                           |
| `/anuncie`, `/contato`, `/sobre`, `/politica-de-privacidade`, `/termos-de-uso`    | Institucional                                                                                                                            |
| `POST /api/leads`                                                                 | Zod + honeypot + limite por IP → tabela `leads` (Supabase) e/ou `LEADS_WEBHOOK_URL` (ou log)                                             |
| `/admin`                                                                          | Painel: imóveis (CRUD, fotos, prévia, duplicar, histórico), leads (funil, XLSX), equipe — ver `docs/MANUAL_ADMIN.md`                     |
| `GET /api/imoveis/contagem`, `/api/imoveis/resumos`                               | Contagem ao vivo dos filtros; resumos para favoritos/comparador                                                                          |

## Leads

Formato enviado ao webhook (JSON): `id, criadoEm, origem, nome, whatsapp (55DDDNÚMERO), email?, rendaFamiliarFaixa? (faixa1…sbpe), codigoImovel?, mensagem?, dataVisitaPreferida?, periodoPreferido?, utm?, consentimentoLGPD: true`. As UTMs da primeira visita ficam na sessão do navegador e vão em todos os leads e mensagens de WhatsApp.

## Preparação para a Fase 2

- ~~Painel administrativo e CRM de leads~~: feito na Fase 1.5 (Supabase).
- **Busca em linguagem natural com IA:** converter a frase em `Filtros` (`src/lib/busca/query.ts`) e redirecionar com `paraQueryString` — toda a listagem já funciona por URL.
- **Pré-qualificação via WhatsApp:** reutilizar `calcularCabeNoBolso` (função pura) no assistente.
- **Portais (XML/feed):** gerar a partir de `repositorio.listar()` em uma rota `app/feed/.../route.ts`.
