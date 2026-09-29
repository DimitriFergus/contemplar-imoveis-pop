# Contemplar Imóveis Pop

Site imobiliário da **Contemplar Imóveis Pop** (Grupo Ordnas): imóveis populares a partir de R$ 150 mil, com busca por **preço ou por parcela**, **Cabe no Meu Bolso**, simulador SAC/Price, custo total de aquisição, WhatsApp inteligente, favoritos e comparador sem login.

> Fase 1 lançada com **24 imóveis fictícios** (`exemplo: true`) e modo demonstração. Veja [`docs/PENDENCIAS.md`](docs/PENDENCIAS.md) antes de publicar.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack) + React 19.2 + TypeScript 5.9 estrito |
| Estilo | Tailwind CSS 4.3 + shadcn/ui (Radix) + lucide-react |
| Validação | Zod 4 (dados, formulários e API) |
| Mapa | Leaflet + OpenStreetMap (sem chave de API) |
| Testes | Vitest 5 (unidades) + Playwright 1.63 (E2E, celular e desktop) |
| Hospedagem | Vercel |

## Comandos

```bash
npm install                 # instalar dependências
npx playwright install chromium   # (uma vez) navegador para os testes E2E

npm run dev                 # desenvolvimento em http://localhost:3000 (roda a importação antes)
npm run importar            # valida dados/imoveis.csv e gera src/data/*.json
npm run gerar-exemplos      # recria os 24 imóveis fictícios (sobrescreve a planilha!)

npm run build && npm start  # produção local
npm run lint                # ESLint
npm run typecheck           # TypeScript
npm run format              # Prettier
npm test                    # testes unitários (cálculos, CSV, filtros, leads)
npm run test:e2e            # testes E2E (requer build; sobe o servidor na porta 3100)
bash scripts/lighthouse.sh http://localhost:3000 3 / /imoveis   # Lighthouse mobile (mediana)
```

Copie `.env.example` para `.env.local` e ajuste. Em produção, defina as mesmas variáveis na Vercel.

## Deploy na Vercel

1. Crie um repositório Git com este projeto e envie ao GitHub.
2. Na Vercel: *Add New → Project* → importe o repositório (framework detectado: Next.js).
3. Em *Environment Variables*, defina `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_MODO_DEMO` e `LEADS_WEBHOOK_URL`.
4. *Deploy*. Cada push gera uma pré-visualização por branch; a `main` vai para produção.
5. O `prebuild` roda `npm run importar`: se a planilha tiver erro, o deploy é bloqueado e o site anterior continua no ar.

## Arquitetura

```
dados/                      planilha (fonte da verdade na Fase 1), corretores e modelo
public/imoveis/<CODIGO>/    fotos por imóvel (01.jpg, 02.jpg...) + CREDITOS.md
scripts/                    importar-imoveis.ts, gerar-exemplos.ts, ilustracoes.ts, capturas e lighthouse
src/app/                    rotas (App Router), sitemap, robots, manifest, imagens Open Graph
src/components/             ui (shadcn), layout, busca, imoveis, simulador, leads, comparar, conteudo, mapa
src/config/                 site.ts, financiamento.ts, custos-aquisicao.ts, pendencias.ts  ← todas as regras de negócio
src/content/                FAQ, glossário, jornada, documentos, depoimentos
src/data/                   JSON gerado pela importação (não editar à mão)
src/lib/financiamento/      cálculos puros e testados (taxas, Price, SAC, faixas, poder de compra, custos)
src/lib/repositorio/        interface + implementação local (trocar por Supabase/CMS na Fase 2)
src/lib/busca/              filtros ⇄ URL, ordenação, paginação, chips
src/lib/schemas/            Zod (imóvel, lead)
tests/unit, tests/e2e
```

Princípios: páginas só falam com `repositorio`; nenhum número de regra de negócio fora de `src/config/`; anúncios gerados estaticamente (SSG, revalidação de 1 h); filtros sempre na URL; Zod só no servidor (o navegador recebe `src/lib/busca/query.ts` e `src/lib/constantes.ts`, sem Zod).

### Rotas

| Rota | Conteúdo |
|---|---|
| `/` | Hero com busca preço/parcela, atalhos, destaques, jornada, MCMV, depoimentos, FAQ |
| `/imoveis` | Listagem com filtros (painel inferior no celular), chips, ordenação, lista/mapa, paginação |
| `/imoveis/casas`, `/apartamentos`, `/casas-em-condominio`, `/duplex`, `/sobrados` | Categorias |
| `/imoveis/bairro/[bairro]` | Imóveis por bairro |
| `/imoveis/[slug]` | Anúncio: galeria, selos, simulador embutido, custo total, mapa aproximado, perto de você, agendamento, semelhantes, JSON-LD, OG dinâmico |
| `/simulador` | "Quanto posso pagar?" (Cabe no Meu Bolso) e "Simular financiamento" (tabela e gráfico) |
| `/minha-casa-minha-vida`, `/como-comprar` | Guias (checklist imprimível) |
| `/favoritos`, `/comparar` | Salvos no navegador, sem login |
| `/anuncie`, `/contato`, `/sobre`, `/politica-de-privacidade`, `/termos-de-uso` | Institucional |
| `POST /api/leads` | Zod + honeypot + limite por IP → `LEADS_WEBHOOK_URL` (ou log) |
| `GET /api/imoveis/contagem`, `/api/imoveis/resumos` | Contagem ao vivo dos filtros; resumos para favoritos/comparador |

## Leads

Formato enviado ao webhook (JSON): `id, criadoEm, origem, nome, whatsapp (55DDDNÚMERO), email?, rendaFamiliarFaixa? (faixa1…sbpe), codigoImovel?, mensagem?, dataVisitaPreferida?, periodoPreferido?, utm?, consentimentoLGPD: true`. As UTMs da primeira visita ficam na sessão do navegador e vão em todos os leads e mensagens de WhatsApp.

## Preparação para a Fase 2

- **Painel administrativo (Supabase ou CMS):** implementar `RepositorioImoveis` (`src/lib/repositorio/tipos.ts`) com o novo banco e trocar a linha em `src/lib/repositorio/index.ts`. Os schemas Zod servem de contrato das tabelas.
- **CRM e distribuição de leads:** o webhook já recebe o lead completo com origem e UTM; `corretorResponsavelId` existe em cada imóvel.
- **Busca em linguagem natural com IA:** converter a frase em `Filtros` (`src/lib/busca/query.ts`) e redirecionar com `paraQueryString` — toda a listagem já funciona por URL.
- **Pré-qualificação via WhatsApp:** reutilizar `calcularCabeNoBolso` (função pura) no assistente.
- **Portais (XML/feed):** gerar a partir de `repositorio.listar()` em uma rota `app/feed/.../route.ts`.
