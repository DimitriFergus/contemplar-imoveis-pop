# Pendências antes da publicação

Enquanto houver campos `A_DEFINIR`, o site mostra um alerta no canto da tela **em modo desenvolvimento** (`npm run dev`), listando cada um.

## 1. Campos A_DEFINIR (obrigatórios)

Já preenchidos em `src/config/site.ts`: CNPJ 61.569.798/0001-81, CRECI-CE 27799, WhatsApp (85) 99210-4920 e endereço (Rua P, 150 – Parque Montenegro II, Prefeito José Walter, Fortaleza – CE, CEP 60751-380).

| Item                                                        | Onde alterar                                                        | Observação                                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Nome empresarial (razão social)                             | `src/config/site.ts` → `EMPRESA.nomeEmpresarial`                    | Exibido no rodapé, anúncios e política de privacidade                                    |
| E-mail de contato                                           | `CONTATO.email`                                                     | O e-mail também é o canal LGPD na política de privacidade                                |
| CRECI e WhatsApp dos corretores                             | `dados/corretores.csv`                                              | Hoje há só o corretor fictício `corretor-exemplo`                                        |
| Cidade base, UF e bairros                                   | `CIDADE_BASE`, `UF_BASE`, `BAIRROS_EXEMPLO`, `CIDADE_BASE_DEFINIDA` | Hoje: "Cidade Exemplo"/"EX" e bairros fictícios                                          |
| Centro do mapa                                              | `CENTRO_MAPA`                                                       | Coordenadas provisórias (os imóveis de exemplo foram posicionados ao redor delas)        |
| Teto MCMV Faixas 1 e 2 do município                         | `src/config/financiamento.ts` → `TETO_FAIXA_1_2_MUNICIPIO`          | Varia de R$ 210 mil a R$ 275 mil; usado o menor valor até a consulta oficial             |
| ITBI do município (e alíquota reduzida SFH/MCMV, se houver) | `src/config/custos-aquisicao.ts` → `CUSTOS_POR_MUNICIPIO`           | Hoje 2% genérico; confirmar lei municipal                                                |
| Custo de registro/cartório                                  | `registroCartorioEstimado`                                          | Hoje 1,5% estimado; confirmar tabela do cartório do estado                               |
| Taxas de referência SBPE                                    | `FAIXAS` (id `sbpe`)                                                | Confirmar com bancos parceiros                                                           |
| Revalidar faixas, tetos e taxas do MCMV                     | `FAIXAS`, `REFERENCIA_FINANCIAMENTO`                                | Valores de referência de set/2026; conferir no site da Caixa e do Ministério das Cidades |
| Seguros (MIP/DFI) e taxa de administração                   | `SEGUROS_E_TAXA_ADM_ESTIMADOS`                                      | Estimativa; confirmar com o banco parceiro                                               |
| URL pública                                                 | variável `NEXT_PUBLIC_SITE_URL` na Vercel                           | Necessária para canonical, sitemap, Open Graph e JSON-LD                                 |

## 2. Conteúdo e identidade

| Item                                    | Situação                                                                                                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Identidade visual                       | Paleta derivada do logo (azul-marinho #041A4B e laranja #F28234). Validar com a marca; o logo disponível tem só 302×252 px — enviar versão vetorial (SVG) ou PNG em alta |
| Fotos reais dos imóveis                 | Hoje são ilustrações próprias (SVG). Substituir e registrar créditos em `public/imoveis/CREDITOS.md`                                                                     |
| Depoimentos                             | Os 3 atuais são ilustrativos e só aparecem no modo demonstração. Coletar depoimentos reais com autorização por escrito                                                   |
| Política de Privacidade e Termos de Uso | Minutas; revisar com assessoria jurídica (definir encarregado/DPO e prazos de retenção)                                                                                  |
| Redes sociais                           | `REDES_SOCIAIS` em `src/config/site.ts` está vazio                                                                                                                       |
| Horário de atendimento                  | Confirmar `EMPRESA.horarioAtendimento`                                                                                                                                   |

## 3. Técnicas

| Item                  | Recomendação                                                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Webhook de leads      | Configurar `LEADS_WEBHOOK_URL` (n8n, Make, Google Sheets ou CRM). Sem ele, os leads só ficam no log do servidor                                                         |
| Limite de requisições | Em memória por instância. Na Vercel (várias instâncias), migrar para Upstash Redis/Vercel KV                                                                            |
| Tiles do mapa         | OpenStreetMap público tem política de uso justo. Com tráfego alto, contratar provedor de tiles (MapTiler, Stadia etc.)                                                  |
| Analytics             | Camada pronta (`src/lib/analytics.ts`), desativada. Ao ativar provedor não essencial, incluir banner de consentimento                                                   |
| Lighthouse            | Medir novamente após o deploy (PageSpeed Insights) — ver relatório no README                                                                                            |
| Domínio e HTTPS       | Configurar domínio na Vercel; o cabeçalho HSTS já está ativo                                                                                                            |
| Leads no GitHub Pages | A versão publicada no Pages é estática: formulários enviam pelo WhatsApp e não ficam registrados. Para gravar leads (webhook/CRM), publicar a versão completa na Vercel |
