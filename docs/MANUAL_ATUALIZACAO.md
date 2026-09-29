# Manual de atualização dos imóveis

Este manual é para a equipe da Contemplar Imóveis Pop. Não é preciso saber programar.

## Resumo em 5 passos

1. Abra a planilha `dados/imoveis.csv` (no Excel ou no Google Planilhas).
2. Edite, inclua ou remova imóveis — **uma linha por imóvel**.
3. Coloque as fotos na pasta `public/imoveis/CODIGO/` (ex.: `public/imoveis/CP-0025/01.jpg`).
4. Rode `npm run importar` e leia o relatório.
5. Se aparecer "✔ Tudo certo!", publique (veja o final deste manual).

## 1. Abrindo a planilha

- **Excel:** abra `dados/imoveis.csv` direto. Ao salvar, escolha **CSV UTF-8 (delimitado por vírgulas)**. O arquivo usa ponto e vírgula (`;`) como separador, o padrão do Excel em português.
- **Google Planilhas:** Arquivo → Importar → Upload → escolha o arquivo → "Detectar automaticamente". Para salvar: Arquivo → Fazer download → Valores separados por vírgula (.csv) e substitua `dados/imoveis.csv`.
- Para começar do zero, use `dados/MODELO_IMOVEIS.csv`, que tem os cabeçalhos e uma linha de exemplo.

**Não mude os nomes das colunas (primeira linha).**

## 2. O que preencher em cada coluna

| Coluna | Obrigatória | Como preencher | Exemplo |
|---|---|---|---|
| codigo | Sim | `CP-` + 4 números. Nunca repita. | CP-0025 |
| titulo | Sim | Tipo, quartos e bairro. De 10 a 90 letras. | Casa 2 quartos com quintal no Jardim Exemplo |
| descricao | Sim | Texto simples e verdadeiro. **Não use** "aprovação garantida", "melhor preço" ou promessas. | Casa de 2 quartos com 58 m²... |
| tipo | Sim | casa, apartamento, casa_condominio, duplex, sobrado ou kitnet (também aceita "Casa em condomínio") | casa |
| situacao | Sim | pronto, usado, na_planta ou em_construcao | usado |
| previsao_entrega | Se na planta/em construção | Ano-mês | 2027-06 |
| preco | Sim | Valor total, só números | 215000 ou 215.000 |
| condominio_mensal | Não | Valor por mês | 250 |
| iptu_anual | Não | Valor por ano | 600 |
| cidade, uf, bairro | Sim | Nome da cidade, sigla do estado, bairro | Cidade Exemplo; EX; Jardim Exemplo |
| latitude, longitude | Sim | **Ponto aproximado** (uma esquina próxima), nunca o endereço exato. Copie do Google Maps: clique com o botão direito no mapa. O sistema ainda arredonda para ~100 m. | -23,5402; -46,6492 |
| raio_metros | Não | Tamanho do círculo no mapa (mínimo 150). Padrão: 400 | 400 |
| quartos, suites, banheiros, vagas | Sim (suítes e vagas podem ficar vazias) | Números | 2; 0; 1; 1 |
| area_util_m2 | Sim | m² de área útil | 58 |
| area_terreno_m2 | Não | m² do terreno | 125 |
| caracteristicas | Não | Separe com barra vertical `\|` | quintal \| piso cerâmico \| portão eletrônico |
| lazer | Não | Separe com `\|` | playground \| salão de festas |
| aceita_mcmv, aceita_fgts, aceita_sbpe, aceita_consorcio, aceita_permuta, entrada_facilitada | Sim | sim ou não | sim |
| descricao_fotos | Recomendado | Descreva cada foto, na ordem, separadas por `\|`. Ajuda pessoas cegas e o Google. | Fachada com portão branco \| Sala ampla com janela |
| video_url | Não | Link do YouTube | https://youtu.be/... |
| tour360_url | Não | Link do tour 360° (Matterport ou Kuula) | |
| proximidades | Não | `tipo: nome: metros`, separados por `\|`. Tipos: escola, saude, mercado, transporte, lazer | escola: EMEF Exemplo: 450 \| saude: UBS Centro: 800 |
| destaque | Sim | sim = aparece na página inicial | não |
| status | Sim | disponivel, reservado ou vendido. **Não apague vendidos**: deixe como vendido (a página continua no ar e sugere semelhantes). | disponivel |
| corretor_id | Sim | Id do corretor em `dados/corretores.csv` | corretor-exemplo |
| exemplo | Sim | **não** para imóveis reais (sim = imóvel fictício de demonstração) | não |
| publicado_em, atualizado_em | Não | Data (dd/mm/aaaa ou aaaa-mm-dd). Vazio = hoje | 01/10/2026 |

## 3. Fotos

- Crie a pasta com o **código** do imóvel: `public/imoveis/CP-0025/`.
- Nomeie as fotos na ordem em que devem aparecer: `01.jpg`, `02.jpg`, `03.jpg`... A primeira é a capa.
- Aceita .jpg, .jpeg, .png, .webp e .avif.
- Fotos grandes são reduzidas automaticamente (o original fica guardado em `dados/fotos-originais/`).
- Use só fotos **próprias ou com autorização**. Registre a autoria em `public/imoveis/CREDITOS.md`.
- Evite fotos que mostrem o número da casa, placas de rua ou pessoas.

## 4. Corretores

Edite `dados/corretores.csv` (colunas: id, nome, creci, whatsapp, foto). O `id` é o que vai na coluna `corretor_id` dos imóveis.

## 5. Importando

No terminal, dentro da pasta do projeto:

```
npm run importar
```

O relatório mostra:

- **✔ Tudo certo!** — os dados foram gravados e o site já usa a nova versão.
- **⚠ Avisos** — o site funciona, mas vale corrigir (ex.: foto sem descrição).
- **✖ Erros** — nada foi gravado. Cada erro indica a linha e o campo, por exemplo:
  `Linha 7, CP-0007: campo 'preco' vazio`. Corrija a planilha e rode de novo.

## 6. Publicando

Com o projeto no GitHub ligado à Vercel, basta enviar as alterações (commit + push). A Vercel roda a importação automaticamente antes de publicar. Se houver erro na planilha, a publicação é bloqueada e o site antigo continua no ar.

## 7. Imóveis de demonstração

Os 24 imóveis `CP-0001` a `CP-0024` são fictícios. Para removê-los, apague as linhas deles da planilha e as pastas `public/imoveis/CP-0001` a `CP-0024`. Quando não houver mais imóveis de exemplo, desligue o modo demonstração (`NEXT_PUBLIC_MODO_DEMO=false` na Vercel).

Para recriar a base de demonstração do zero (apaga a planilha atual!): `npm run gerar-exemplos`.

## 8. Regras de financiamento, ITBI e contatos

Não ficam na planilha. Estão em:

- `src/config/financiamento.ts` — faixas do MCMV, taxas, cota, prazo, comprometimento de renda.
- `src/config/custos-aquisicao.ts` — ITBI e cartório por município.
- `src/config/site.ts` — WhatsApp, e-mail, CNPJ, CRECI, cidade base, bairros.

Peça a quem cuida do site para alterar esses arquivos, sempre informando a **fonte** e a **data** da regra.
