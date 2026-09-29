# PROMPT PARA O CLAUDE CODE: SITE DA CONTEMPLAR IMÓVEIS POP

> Versão 1.0 | Setembro/2026 | Grupo Ordnas
> Como usar: salve este arquivo na pasta vazia do projeto, abra o Claude Code nessa pasta e digite:
> `Leia o arquivo PROMPT_CLAUDE_CODE_CONTEMPLAR_IMOVEIS_POP.md e execute a Fase 1 integralmente.`

---

## 1. CONTEXTO

A **Contemplar Imóveis Pop** é a marca da Contemplar Imóveis (empresa do Grupo Ordnas) voltada à venda de **imóveis populares a partir de R$ 150 mil**: casas, apartamentos, casas em condomínio, duplex e sobrados, prontos, usados ou na planta.

O público principal é formado por famílias de renda baixa e média que compram o **primeiro imóvel**, normalmente com **financiamento habitacional (Minha Casa, Minha Vida ou SBPE)**, uso de **FGTS** e entrada reduzida. Esse público:

- pensa primeiro em **"quanto fica a parcela"** e só depois no preço total;
- acessa quase sempre pelo **celular**, muitas vezes com internet instável;
- decide com apoio da família e conversa pelo **WhatsApp**;
- tem receio de ser reprovado no financiamento e pouca familiaridade com termos técnicos (SAC, Price, cota de financiamento, ITBI).

O site será lançado inicialmente com **imóveis e preços de exemplo** (fictícios), que serão substituídos gradualmente por imóveis reais.

## 2. PAPEL

Atue como uma equipe sênior composta por:

- arquiteto de software front-end e full-stack (Next.js/TypeScript);
- designer de produto especializado em UX de portais imobiliários e em inclusão digital;
- especialista em SEO técnico e performance web;
- especialista em crédito imobiliário brasileiro (MCMV, SBPE, FGTS);
- especialista em LGPD e em conformidade de publicidade imobiliária.

## 3. OBJETIVO

Construir um site imobiliário **moderno, rápido, confiável e orientado à conversão em leads**, que:

1. permita buscar imóveis por **preço ou por parcela mensal**;
2. mostre ao visitante, em linguagem simples, **quais imóveis cabem no bolso dele**;
3. gere contatos qualificados via **WhatsApp e formulário**, com rastreamento de origem;
4. seja **facilmente atualizável** pela equipe (sem programador) a partir de uma planilha;
5. esteja pronto para evoluir para painel administrativo, CRM e integração com IA.

## 4. REFERÊNCIAS DE MERCADO (REPLICAR PADRÕES, NUNCA COPIAR)

Estude e reproduza os **padrões de experiência** abaixo. Não copie código, marca, textos, imagens, ícones proprietários ou layout idêntico de nenhum site.

| Referência | O que aproveitar |
|---|---|
| **QuintoAndar** | Cards limpos com foto grande, filtros objetivos, agendamento de visita em poucos toques, linguagem próxima do usuário |
| **Zillow (BuyAbility)** | Ferramenta que estima quanto a pessoa pode pagar e **marca nos anúncios os imóveis que cabem no orçamento**; exibição de custo total além do preço |
| **Redfin** | Agendamento de visita com escolha de data e horário direto no anúncio |
| **ZAP Imóveis / VivaReal** | Filtros completos, alternância lista/mapa, URL compartilhável com os filtros aplicados |
| **MRV, Tenda, Cury, Direcional** | Linguagem de Minha Casa, Minha Vida, simulador em destaque, selos ("Use seu FGTS", "Entrada facilitada"), foco em parcela |
| **Compass** | Interface neutra que deixa a fotografia do imóvel dar a cor; hierarquia visual rigorosa |

## 5. DIFERENCIAIS (INOVAÇÕES OBRIGATÓRIAS)

1. **"Cabe no Meu Bolso"**: o visitante informa renda familiar, valor de entrada, saldo de FGTS e parcela confortável. O site calcula o poder de compra estimado, indica a faixa provável do MCMV e passa a exibir o selo **"Cabe no seu bolso"** nos cards e anúncios compatíveis. Os dados ficam só no navegador (localStorage) e podem ser apagados com um clique.
2. **Busca por parcela**: alternância na busca principal entre "Buscar por preço" e "Buscar por parcela".
3. **Parcela em destaque, preço sempre visível**: cada card mostra "Parcelas a partir de R$ X/mês*" junto ao **valor total**, com asterisco remetendo às premissas da simulação.
4. **Custo total de aquisição**: no anúncio, bloco "Quanto custa comprar este imóvel" com preço, ITBI estimado, registro/cartório estimado, entrada e valor financiado. Todos os percentuais parametrizados por município.
5. **Jornada "Da simulação às chaves"**: linha do tempo em 5 passos (Simule, Escolha, Aprove o crédito, Assine, Receba as chaves), com checklist de documentos imprimível.
6. **WhatsApp inteligente**: botão com mensagem pré-preenchida contendo código do imóvel, título e origem (UTM), por exemplo: "Olá! Tenho interesse no imóvel CP-0012 (Casa 2 quartos no Bairro X). Vi no site."
7. **Favoritos e comparador sem login**: salvar imóveis e comparar até 3 lado a lado (preço, parcela, área, quartos, vagas, condomínio, financiamento aceito).
8. **"Perto de você"**: lista de proximidades do imóvel (escola, posto de saúde, supermercado, ponto de ônibus) com distância aproximada.
9. **Selos de condição de pagamento**: "Aceita MCMV", "Use seu FGTS", "Aceita consórcio (carta contemplada)", "Aceita permuta", "Entrada facilitada", "Pronto para morar", "Na planta".
10. **Modo leitura fácil**: botão que aumenta fonte e contraste, e glossário acessível (ícone "?") ao lado de termos técnicos.
11. **Compartilhamento otimizado para WhatsApp**: cada anúncio gera imagem Open Graph com foto, preço, parcela e código.

## 6. ARQUITETURA E STACK

Use as **versões estáveis mais recentes** no momento da instalação (verifique antes de instalar) de:

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript estrito | SEO por renderização estática, rotas dinâmicas, rotas de API |
| Estilo | Tailwind CSS + shadcn/ui | Produtividade, consistência e acessibilidade dos componentes |
| Validação | Zod | Validação única para dados de imóveis, formulários e API |
| Mapa | Leaflet + OpenStreetMap | Sem custo e sem chave de API na Fase 1 |
| Ícones | lucide-react | Leve e consistente |
| Testes | Vitest (unidades) + Playwright (fluxos principais) | Garantir cálculos e jornadas críticas |
| Hospedagem | Vercel | Deploy simples, CDN e pré-visualização por branch |

### Princípios de arquitetura

- **Camada de repositório de dados** (`src/lib/repositorio/`): as páginas nunca leem o arquivo de dados diretamente. Na Fase 1, o repositório lê arquivos locais; na Fase 2, troca-se a implementação por Supabase ou CMS sem alterar as páginas.
- **Parâmetros de negócio centralizados** em `src/config/` (MCMV, juros, ITBI, contatos, CRECI). Nenhum número de regra de negócio espalhado pelo código.
- **Geração estática** (SSG) das páginas de imóveis com revalidação, para máximo desempenho e SEO.
- **Estado de filtros na URL** (query string), para que qualquer busca possa ser compartilhada.
- Variável de ambiente `NEXT_PUBLIC_MODO_DEMO=true` ativa selo "Imóvel ilustrativo" em todos os imóveis marcados como exemplo.

### Estrutura de pastas sugerida

```
/dados
  imoveis.csv                 # planilha mantida pela equipe (fonte da verdade na Fase 1)
/public/imoveis/<codigo>/     # fotos por imóvel
/scripts
  importar-imoveis.ts         # CSV -> JSON validado com Zod, com relatório de erros
  gerar-exemplos.ts           # gera os imóveis fictícios iniciais
/src
  /app                        # rotas
  /components                 # UI (cards, filtros, galeria, simulador, etc.)
  /config
    site.ts                   # nome, contatos, WhatsApp, CRECI, redes sociais
    financiamento.ts          # parâmetros MCMV/SBPE com data e fonte
    custos-aquisicao.ts       # ITBI e cartório por município
  /lib
    /repositorio              # interface + implementação local
    /financiamento            # cálculos puros e testados
    /schemas                  # Zod
    /utils                    # formatação BRL, slug, UTM
  /types
/tests
```

## 7. MODELO DE DADOS

```ts
type TipoImovel = 'casa' | 'apartamento' | 'casa_condominio' | 'duplex' | 'sobrado' | 'kitnet';
type SituacaoImovel = 'pronto' | 'usado' | 'na_planta' | 'em_construcao';

interface Imovel {
  id: string;
  codigo: string;               // ex.: "CP-0001" (exibido no anúncio e no WhatsApp)
  slug: string;                 // ex.: "casa-2-quartos-bairro-exemplo-cp-0001"
  titulo: string;
  descricao: string;            // texto simples, sem exageros publicitários
  tipo: TipoImovel;
  situacao: SituacaoImovel;
  previsaoEntrega?: string;     // obrigatório se na_planta ou em_construcao
  preco: number;                // valor total em reais
  condominioMensal?: number;
  iptuAnual?: number;
  cidade: string;
  uf: string;
  bairro: string;
  localizacaoAproximada: { lat: number; lng: number; raioMetros: number }; // nunca o endereço exato
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  areaUtilM2: number;
  areaTerrenoM2?: number;
  caracteristicas: string[];    // ex.: "quintal", "varanda", "piso cerâmico"
  lazer: string[];              // ex.: "piscina", "playground"
  condicoes: {
    aceitaMCMV: boolean;
    aceitaFGTS: boolean;
    aceitaSBPE: boolean;
    aceitaConsorcio: boolean;
    aceitaPermuta: boolean;
    entradaFacilitada: boolean;
  };
  fotos: { arquivo: string; alt: string }[];  // alt descritivo obrigatório
  videoUrl?: string;
  tour360Url?: string;
  proximidades: { tipo: 'escola' | 'saude' | 'mercado' | 'transporte' | 'lazer'; nome: string; distanciaMetros: number }[];
  destaque: boolean;
  status: 'disponivel' | 'reservado' | 'vendido';
  corretorResponsavelId: string;
  exemplo: boolean;             // true = imóvel fictício
  publicadoEm: string;          // ISO
  atualizadoEm: string;         // ISO
}

interface Corretor { id: string; nome: string; creci: string; whatsapp: string; foto?: string }

interface Lead {
  id: string; criadoEm: string;
  origem: 'formulario_contato' | 'formulario_imovel' | 'agendamento_visita' | 'anuncie' | 'cabe_no_bolso';
  nome: string; whatsapp: string; email?: string;
  rendaFamiliarFaixa?: string; codigoImovel?: string; mensagem?: string;
  dataVisitaPreferida?: string; periodoPreferido?: 'manha' | 'tarde' | 'noite';
  utm?: { source?: string; medium?: string; campaign?: string; content?: string; term?: string };
  consentimentoLGPD: true;
}
```

## 8. DADOS DE EXEMPLO

Gere **24 imóveis fictícios** pelo script `scripts/gerar-exemplos.ts`, gravando em `dados/imoveis.csv`:

- faixa de preço entre **R$ 150.000 e R$ 420.000**, com concentração entre R$ 160 mil e R$ 280 mil;
- distribuição aproximada: 10 casas, 8 apartamentos, 3 casas em condomínio, 2 duplex, 1 sobrado;
- situações variadas: prontos, usados e na planta (com previsão de entrega);
- 1 a 3 quartos, áreas coerentes com o padrão popular (apartamentos de 40 a 60 m²; casas de 50 a 90 m² em terrenos de 100 a 250 m²);
- preços coerentes com área, situação e bairro (sem valores aleatórios incoerentes);
- **cidade e bairros definidos em `src/config/site.ts`** (`CIDADE_BASE`, `UF_BASE`, `BAIRROS_EXEMPLO`). Enquanto não forem configurados, use nomes claramente fictícios ("Jardim Exemplo", "Parque das Flores Demo");
- descrições realistas, sem promessas ("melhor preço da cidade", "aprovação garantida");
- `exemplo: true` em todos;
- fotos: use placeholders locais leves (SVG ou imagens livres de direitos com licença registrada em `public/imoveis/CREDITOS.md`). Não use fotos de terceiros sem licença.

## 9. PÁGINAS E FUNCIONALIDADES

### 9.1 Home (`/`)
- Cabeçalho fixo: logo, Imóveis, Simulador, Minha Casa Minha Vida, Como comprar, Anuncie seu imóvel, botão WhatsApp.
- Hero com busca: tipo, cidade/bairro, alternância **preço | parcela**, botão "Buscar".
- CTA secundário: "Descubra quanto você pode pagar em 1 minuto" (abre o Cabe no Meu Bolso).
- Atalhos por categoria: Casas, Apartamentos, Pronto para morar, Na planta, Aceita FGTS, Até R$ 200 mil.
- Imóveis em destaque (carrossel com rolagem nativa por toque).
- Bloco "Da simulação às chaves" (5 passos).
- Bloco explicativo do Minha Casa, Minha Vida com link para o guia.
- Depoimentos (na Fase 1, marcados como ilustrativos no modo demo).
- FAQ com 8 a 10 perguntas reais do público popular.
- CTA final "Quer vender seu imóvel?" e rodapé completo.

### 9.2 Listagem (`/imoveis`)
- Filtros: tipo, situação, bairro, preço mín./máx., parcela máx., quartos, banheiros, vagas, área, condições (MCMV, FGTS, consórcio, permuta), "Cabe no meu bolso".
- Ordenação: relevância, menor preço, menor parcela, mais recentes, maior área.
- Alternância **lista | mapa** (no mapa, marcadores com preço; clique abre mini-card).
- Contador de resultados, filtros ativos como "chips" removíveis, estado vazio com sugestão de ampliar a busca.
- No celular, filtros em painel inferior (bottom sheet) com botão "Ver X imóveis".
- Paginação com links reais (bom para SEO) e rolagem preservada ao voltar.

### 9.3 Anúncio (`/imoveis/[slug]`)
- Galeria com toque/arraste, tela cheia e contador de fotos; vídeo e tour 360° quando houver.
- Título, código, bairro, selos, preço total e parcela estimada.
- Ficha técnica em ícones (quartos, banheiros, vagas, área).
- Descrição, características, lazer, condomínio e IPTU.
- **Simulador embutido** já preenchido com o preço do imóvel.
- **"Quanto custa comprar este imóvel"** (custo total estimado).
- Mapa com **área aproximada** (círculo, nunca ponto exato) e lista "Perto de você".
- Cartão fixo (desktop lateral, celular rodapé) com: WhatsApp, Agendar visita, Favoritar, Compartilhar, Comparar.
- Agendamento de visita: data (próximos 14 dias, exceto domingos, configurável), período e contato.
- Imóveis semelhantes (mesmo tipo e faixa de preço).
- Dados estruturados JSON-LD (Schema.org, tipo de anúncio imobiliário com oferta e preço em BRL), Open Graph dinâmico e URL canônica.
- Status "Reservado" ou "Vendido" exibido com faixa, mantendo a página ativa por SEO e sugerindo semelhantes.

### 9.4 Simulador (`/simulador`)
Duas abas:
1. **Quanto posso pagar?** (Cabe no Meu Bolso): renda familiar bruta, entrada, FGTS, outras dívidas mensais, parcela desejada, prazo. Resultado: faixa provável do MCMV, parcela máxima estimada, valor financiável, **poder de compra estimado** e botão "Ver imóveis que cabem no meu bolso".
2. **Simular financiamento**: valor do imóvel, entrada, FGTS, taxa, prazo, sistema (SAC ou Price). Resultado: primeira e última parcela, total de juros, gráfico de evolução e tabela resumida (primeiros 12 meses e ano a ano).

### 9.5 Demais páginas
- `/minha-casa-minha-vida`: guia simples das faixas, quem pode participar, uso do FGTS, documentos, perguntas frequentes. Dados lidos de `src/config/financiamento.ts`.
- `/como-comprar`: jornada completa, checklist de documentos (versão para impressão via CSS `@media print`).
- `/favoritos` e `/comparar`.
- `/anuncie`: captação de imóveis de proprietários (tipo, bairro, valor pretendido, fotos opcionais em fase futura, contato).
- `/sobre`, `/contato`, `/politica-de-privacidade`, `/termos-de-uso`, página 404 útil (com busca e destaques).

## 10. REGRAS DE CÁLCULO (FINANCIAMENTO)

Implemente em `src/lib/financiamento/` como **funções puras**, sem dependência de interface, com testes unitários.

### 10.1 Parâmetros de referência (setembro/2026)

Grave em `src/config/financiamento.ts` com os campos `dataReferencia`, `fonte` e `observacao`. **Valores devem ser revalidados no site da Caixa e do Ministério das Cidades antes da publicação.**

| Faixa MCMV | Renda familiar bruta mensal (urbana) | Teto do imóvel | Taxa de referência (parametrizar) |
|---|---|---|---|
| Faixa 1 | até R$ 3.200,00 | R$ 210 mil a R$ 275 mil, conforme município | a partir de ~4% a.a. (varia por região e cotista FGTS) |
| Faixa 2 | R$ 3.200,01 a R$ 5.000,00 | R$ 210 mil a R$ 275 mil, conforme município | ~4,75% a 7% a.a. |
| Faixa 3 | R$ 5.000,01 a R$ 9.600,00 | até R$ 400 mil | ~7,66% a 8,16% a.a. |
| Faixa 4 (Classe Média) | R$ 9.600,01 a R$ 13.000,00 | até R$ 600 mil | ~10% a.a. nominal |
| Fora do MCMV (SBPE) | acima da Faixa 4 ou imóvel acima do teto | conforme SFH | parametrizar taxa de mercado |

Parâmetros adicionais configuráveis:
- `TETO_FAIXA_1_2_MUNICIPIO`: teto aplicável ao município base (definir após consulta oficial);
- `COTA_MAXIMA_FINANCIAMENTO`: 0,80 para Faixas 1 a 3 (parametrizar Faixa 4 e SBPE separadamente);
- `COMPROMETIMENTO_MAXIMO_RENDA`: 0,30;
- `PRAZO_MAXIMO_MESES`: 420;
- `TIPO_TAXA`: `'nominal' | 'efetiva'` por faixa;
- `SEGUROS_E_TAXA_ADM_ESTIMADOS`: percentual ou valor mensal estimado (MIP, DFI, taxa de administração), exibido separadamente.

### 10.2 Fórmulas

- Taxa mensal a partir de taxa **nominal** anual: `i = taxaAnual / 12`.
- Taxa mensal a partir de taxa **efetiva** anual: `i = (1 + taxaAnual)^(1/12) - 1`.
- **Price**: `parcela = PV × i / (1 − (1 + i)^−n)`.
- **SAC**: `amortização = PV / n`; `parcela_k = amortização + saldoDevedor_(k−1) × i`.
- Valor financiado: `PV = preço − entrada − FGTS`, limitado a `preço × COTA_MAXIMA_FINANCIAMENTO`. Se o limite for atingido, informar a entrada mínima necessária.
- Parcela máxima: `renda × COMPROMETIMENTO_MAXIMO_RENDA − outrasDividas`.
- Valor financiável pela renda (Price): `PV = parcelaMax × (1 − (1 + i)^−n) / i`. Para SAC, usar a primeira parcela como limitante.
- Poder de compra estimado: `min(valorFinanciável / COTA, valorFinanciável + entrada + FGTS)`.
- **Subsídio**: não somar ao poder de compra. Exibir apenas o aviso "Pela sua renda, você pode ter direito a subsídio do governo; o valor depende de análise oficial".
- Enquadramento: renda define a faixa; se o preço do imóvel superar o teto da faixa, exibir "Este imóvel pode ser financiado fora do MCMV (SBPE)".
- Arredondamento apenas na exibição (2 casas decimais, formatação `pt-BR` em BRL).

### 10.3 Custo total de aquisição
- `ITBI_ALIQUOTA` e regras de base por município em `src/config/custos-aquisicao.ts` (há municípios com alíquota reduzida para financiamentos habitacionais; parametrizar, sem presumir).
- `REGISTRO_CARTORIO_ESTIMADO`: percentual estimado configurável.
- Sempre rotular como **estimativa**.

### 10.4 Aviso obrigatório (exibir junto a qualquer parcela ou simulação)
"Simulação ilustrativa com base em parâmetros de referência. Não constitui proposta de crédito. Taxas, prazos, subsídios, seguros e aprovação dependem da análise da instituição financeira e das regras vigentes do programa."

## 11. DESIGN

- **Direção visual**: acolhedora, confiável e otimista; evitar aparência de luxo e evitar visual genérico de template.
- Paleta sugerida (ajustável à identidade da Contemplar): primária verde-petróleo (confiança), destaque amarelo-sol ou coral (ação e otimismo), neutros quentes e muito espaço em branco. Cores definidas como tokens CSS, com modo claro e escuro.
- Tipografia: uma fonte com personalidade para títulos (ex.: Plus Jakarta Sans) e fonte altamente legível para texto (ex.: Inter), com tamanho base mínimo de 16 px.
- Números grandes e claros para preço e parcela; hierarquia: foto, parcela, preço total, bairro, ficha.
- Cards com cantos arredondados, sombra suave, selos coloridos e botão de favorito visível.
- Microinterações discretas; respeitar `prefers-reduced-motion`.
- **Mobile-first obrigatório**: projetar primeiro para 360 px de largura; áreas de toque de no mínimo 44 × 44 px.

## 12. REQUISITOS NÃO FUNCIONAIS

| Requisito | Meta |
|---|---|
| Desempenho | Lighthouse mobile ≥ 90 em Performance; LCP < 2,5 s em 4G; imagens em AVIF/WebP com `next/image` e `sizes` corretos |
| Acessibilidade | WCAG 2.2 nível AA; navegação por teclado; contraste adequado; `alt` em todas as imagens; rótulos em todos os campos |
| SEO | Metadados por página, sitemap.xml, robots.txt, URLs amigáveis, JSON-LD, Open Graph, headings semânticos, páginas de bairro e tipo (ex.: `/imoveis/casas`, `/imoveis/bairro/jardim-exemplo`) |
| Segurança | Validação Zod no servidor, honeypot e limite de requisições nos formulários, cabeçalhos de segurança, nenhuma credencial no código (usar `.env.local` e `.env.example`) |
| Privacidade (LGPD) | Consentimento explícito nos formulários, política de privacidade, banner de cookies apenas se houver analytics não essenciais, coleta mínima de dados |
| Analytics | Eventos preparados (clique WhatsApp, envio de lead, uso do simulador, favoritar) com camada abstrata, desativada até configuração |

## 13. LEADS

- Rota `POST /api/leads` com validação Zod, honeypot e limite de requisições.
- Envio para `LEADS_WEBHOOK_URL` (configurável para n8n, Make, Google Sheets ou CRM). Sem webhook configurado, registrar no log do servidor e retornar sucesso.
- Captura de UTM na primeira visita (armazenada na sessão) e anexada a todos os leads e mensagens de WhatsApp.
- Após envio, tela de confirmação com botão "Falar agora no WhatsApp".
- Número de WhatsApp e mensagens padrão em `src/config/site.ts`.

## 14. CONFORMIDADE OBRIGATÓRIA

1. **CRECI**: exibir nome empresarial, CNPJ e **número de inscrição no CRECI (pessoa jurídica)** no rodapé e em todos os anúncios; corretor responsável com CRECI no anúncio. Campos em `src/config/site.ts` com valores `A_DEFINIR` e alerta visual no modo desenvolvimento enquanto não preenchidos.
2. **Transparência (Código de Defesa do Consumidor)**: parcela nunca aparece sem o preço total e sem o aviso de simulação; proibido "aprovação garantida", "sem consulta ao SPC/Serasa" ou similares.
3. **Modo demonstração**: com `NEXT_PUBLIC_MODO_DEMO=true`, faixa discreta no topo ("Site em demonstração: imóveis e valores ilustrativos") e selo "Imóvel ilustrativo" em cada anúncio com `exemplo: true`.
4. **Localização**: nunca exibir número da casa ou ponto exato no mapa.
5. **Imagens e textos**: apenas conteúdo próprio ou licenciado, com créditos registrados.

## 15. MANUTENÇÃO PELA EQUIPE (SEM PROGRAMADOR)

- A equipe mantém `dados/imoveis.csv` (pode ser exportado de uma planilha Excel ou Google Sheets com as mesmas colunas).
- `npm run importar` valida cada linha com Zod e gera relatório legível: "Linha 7, CP-0007: campo 'preco' vazio".
- Fotos em `public/imoveis/<codigo>/01.jpg, 02.jpg...`; o script associa automaticamente e otimiza tamanho.
- Crie `dados/MODELO_IMOVEIS.csv` com cabeçalhos e uma linha de exemplo, e `docs/MANUAL_ATUALIZACAO.md` com o passo a passo em linguagem simples.

## 16. ETAPAS DE EXECUÇÃO

### Fase 1 (executar agora, sem pedir confirmação entre as etapas)
1. Apresentar plano resumido (arquitetura, rotas, componentes) em até 30 linhas e seguir imediatamente.
2. Criar projeto, configurar TypeScript estrito, ESLint, Prettier, Tailwind, shadcn/ui, Vitest e Playwright.
3. Criar `src/config/*`, tipos, schemas Zod e camada de repositório.
4. Implementar `src/lib/financiamento/*` com testes unitários **antes** das telas.
5. Gerar os 24 imóveis de exemplo e o script de importação.
6. Construir sistema de design (tokens, tipografia, componentes base).
7. Construir páginas na ordem: listagem, anúncio, home, simulador, demais páginas.
8. Implementar leads, WhatsApp, favoritos, comparador e Cabe no Meu Bolso.
9. SEO técnico, JSON-LD, sitemap, Open Graph dinâmico.
10. Acessibilidade, desempenho e revisão de responsividade (360, 768, 1280 px).
11. Testes E2E dos fluxos: buscar e filtrar; abrir anúncio e clicar no WhatsApp; simular; enviar lead; favoritar e comparar.
12. Criar `README.md`, `.env.example`, `docs/MANUAL_ATUALIZACAO.md` e `docs/PENDENCIAS.md`.

### Fase 2 (não executar agora; deixar preparado e documentado)
- Painel administrativo com Supabase (ou CMS headless) e login da equipe.
- Integração de leads com CRM e distribuição entre corretores.
- Busca em linguagem natural com IA ("casa de 2 quartos perto de escola até 1.200 por mês").
- Assistente de pré-qualificação via WhatsApp.
- Publicação automática em portais (XML/feed).

## 17. VALIDAÇÕES ANTES DE CONCLUIR

- [ ] `npm run build`, `npm run lint`, `npm run typecheck` e `npm test` sem erros.
- [ ] Testes unitários de Price e SAC conferidos com casos de controle, por exemplo: PV R$ 200.000, taxa efetiva 8,16% a.a., 420 meses (validar contra calculadora financeira de referência e registrar o valor esperado no teste).
- [ ] Enquadramento de faixa testado nos limites exatos (R$ 3.200,00; R$ 3.200,01; R$ 5.000,00; R$ 9.600,00; R$ 13.000,00).
- [ ] Nenhuma parcela exibida sem preço total e sem aviso.
- [ ] Nenhum número de regra de negócio fora de `src/config/`.
- [ ] Lighthouse mobile registrado no relatório final (Performance, Acessibilidade, SEO, Boas práticas).
- [ ] Filtros refletidos na URL e restaurados ao recarregar a página.
- [ ] Nenhuma credencial ou dado pessoal real versionado.
- [ ] Todos os campos `A_DEFINIR` listados em `docs/PENDENCIAS.md`.

## 18. RESTRIÇÕES

- Não copiar código, textos, imagens ou identidade visual de sites de terceiros.
- Não inventar regras de financiamento, subsídios ou benefícios; tudo que for regra deve vir de `src/config/` com fonte e data.
- Não prometer aprovação de crédito, taxa ou subsídio.
- Não usar bibliotecas pesadas quando houver solução nativa equivalente.
- Não usar serviços pagos ou que exijam chave de API na Fase 1.
- Não armazenar dados pessoais do visitante no navegador além do necessário para favoritos e Cabe no Meu Bolso (com opção de apagar).

## 19. FORMATO DA ENTREGA FINAL

Ao terminar a Fase 1, apresente um relatório com:

1. resumo do que foi construído;
2. árvore de rotas e principais componentes;
3. comandos para rodar localmente, importar imóveis e fazer deploy;
4. resultados de testes e Lighthouse;
5. tabela de pendências (`A_DEFINIR`: CRECI, CNPJ, WhatsApp, cidade base, bairros, teto MCMV municipal, ITBI, identidade visual, fotos reais);
6. riscos e recomendações para a Fase 2.
