# Manual do painel administrativo

O painel fica em **/admin** no endereço do site (hoje:
**https://dimitrifergus.github.io/contemplar-imoveis-pop/admin/**). Nele a equipe cadastra
imóveis, envia fotos, publica anúncios e acompanha os contatos (leads) que chegam pelo site.

---

## 1. Quem pode fazer o quê

| Ação                                | Corretor               | Administrador |
| ----------------------------------- | ---------------------- | ------------- |
| Cadastrar e editar imóveis          | Só os seus             | Todos         |
| Publicar, reservar, marcar vendido  | Só os seus             | Todos         |
| Excluir imóvel                      | Só rascunhos seus      | Todos         |
| Ver e atender leads                 | Só os dos seus imóveis | Todos         |
| Distribuir leads entre corretores   | Não                    | Sim           |
| Exportar leads em planilha          | Os seus                | Todos         |
| Cadastrar pessoas da equipe         | Não                    | Sim           |
| Ver o histórico geral de alterações | Só dos seus imóveis    | Tudo          |

Essas regras valem **dentro do banco de dados** (não só nas telas). Mesmo que alguém tente
burlar o site, um corretor não consegue ver nem mudar o que é de outro.

---

## 2. Entrar no painel

1. Acesse **/admin** e digite seu e-mail e senha.
2. **Administradores** precisam de um **app autenticador** no celular (Google Authenticator,
   Microsoft Authenticator ou Authy):
   - No primeiro acesso, toque em **Gerar QR Code**, escaneie com o app e digite o código de 6
     números.
   - Nos próximos acessos, basta digitar o código que aparece no app.
   - Trocou de celular? Peça a outro administrador ou ao responsável técnico para remover o
     autenticador antigo (Supabase → Authentication → Users → seu usuário → MFA).
3. Corretores podem ativar o app autenticador em **Minha conta** (recomendado).
4. Troque a senha provisória em **Minha conta → Trocar senha**.

---

## 3. Cadastrar um imóvel

1. **Imóveis → Cadastrar imóvel.**
2. Preencha os campos com \*. Dicas:
   - **Título**: até 90 letras. Ex.: _Casa 2 quartos com quintal no Parque Montenegro_.
   - **Preço**: só números (ex.: `185000`).
   - **Localização**: no Google Maps, clique com o botão direito no local, clique nos números
     que aparecem (eles são copiados) e cole no campo **Latitude**. O site mostra só um círculo
     aproximado, **nunca o endereço exato**.
   - **Destaques / Lazer**: um item por linha.
3. Clique em **Salvar rascunho**. O imóvel ganha um código (ex.: CP-0025).
4. Envie as **fotos** (próximo item) e clique em **Publicar**.

Se algo estiver faltando, o campo fica vermelho com a explicação. O site confere tudo de novo
ao salvar.

### Fotos

- **Arraste as fotos** para o quadro ou clique em _escolha no computador/celular_.
- As fotos são reduzidas automaticamente (no máximo 1920 px) e convertidas para WebP, que
  carrega rápido no celular.
- **Descrição da foto é obrigatória** (ex.: _Sala com janela ampla_). Ela é lida por pessoas
  cegas e ajuda o Google.
- A **primeira foto é a capa**. Para mudar a ordem, arraste a foto ou use as setas ↑ ↓.
- Para tirar uma foto, clique na lixeira e depois em **Salvar**.

### Status do anúncio

| Status        | O que acontece no site                                    |
| ------------- | --------------------------------------------------------- |
| **Rascunho**  | Não aparece. Use enquanto está preenchendo.               |
| **Publicado** | Aparece como disponível.                                  |
| **Reservado** | Aparece com o aviso "Reservado".                          |
| **Vendido**   | Aparece com o aviso "Vendido" e sugere imóveis parecidos. |

Ao salvar, **o site mostra a mudança na hora**: a busca, a página do imóvel e os
favoritos leem os dados direto do banco. No GitHub Pages, as páginas "de vitrine" (página
inicial, bairros, resultado no Google e prévia ao compartilhar no WhatsApp) são regeradas
sozinhas em até uns 15 minutos.

### Pré-visualizar

Clique em **Pré-visualizar** para ver o anúncio exatamente como vai ficar no site. Se estiver
em rascunho, dá para publicar direto dali com **Publicar agora**.

### Duplicar

Tem vários imóveis parecidos no mesmo empreendimento? Abra um e clique em **Duplicar imóvel**.
É criada uma cópia em rascunho (com as fotos), com um código novo. Ajuste o que muda e publique.

### Histórico

No fim da página de cada imóvel aparece **quem mudou o quê e quando**, com o valor antigo e o
novo. **Mudanças de preço** ficam destacadas em laranja, com a porcentagem de aumento ou
desconto. O administrador vê o histórico geral em **Histórico**.

---

## 4. Leads (contatos do site)

Todo formulário do site (contato, pedido de visita, "tenho interesse", anuncie) vira um lead
no painel. O lead vai **automaticamente para o corretor do imóvel**. Leads sem imóvel (ex.:
formulário de contato) ficam **sem corretor**, e o administrador distribui.

- **Leads** mostra o **funil**: Novo → Em atendimento → Visita agendada → Proposta →
  Ganho / Perdido.
- **Arraste o cartão** para outra coluna, ou escolha a etapa no seletor do cartão.
- O botão verde abre o **WhatsApp** do cliente.
- Clique no nome para ver tudo: mensagem, renda informada, data de visita desejada, anotações.
- Em **Perdido**, informe o motivo (ajuda a melhorar o atendimento).
- **Exportar planilha (XLSX)** baixa os leads (com os filtros da tela) para abrir no Excel.
- Pedido de exclusão de dados (LGPD): o administrador abre o lead e clica em **Excluir lead**.

Se o site também tiver um webhook configurado (`LEADS_WEBHOOK_URL`), cada lead continua sendo
enviado para lá como cópia extra.

---

## 5. Equipe (só administrador)

1. **Equipe → Cadastrar pessoa**: nome, e-mail, senha provisória (mínimo 10 caracteres),
   papel, CRECI e WhatsApp.
2. Envie o e-mail e a senha provisória para a pessoa por um canal seguro.
3. **Dados do anúncio** muda o nome, CRECI e WhatsApp que aparecem nos anúncios.
4. **Senha** define uma nova senha provisória (para quem esqueceu).
5. **Desativar** bloqueia o acesso na hora (os imóveis dela continuam no site).

---

## 6. Planilha (importação em massa)

A planilha `dados/imoveis.csv` continua valendo para cadastrar muitos imóveis de uma vez:

1. Preencha a planilha (modelo em `dados/MODELO_IMOVEIS.csv`) e coloque as fotos em
   `public/imoveis/CP-0000/01.jpg, 02.jpg...`
2. Rode `npm run supabase:importar`. O script valida tudo, converte as fotos para WebP e grava
   no banco. Imóveis que já existem **não são sobrescritos** (para não apagar edições feitas no
   painel). Para sobrescrever: `npm run supabase:importar -- --atualizar`.

---

## 7. Configuração inicial (responsável técnico)

Feita uma vez só.

### 7.1 Criar o projeto no Supabase

1. Crie uma conta em **supabase.com** → **New project** (região _South America (São Paulo)_).
   Guarde a senha do banco.
2. **Project Settings → API Keys**: copie a _Project URL_, a _Publishable key_ e a _Secret key_.
3. **Connect → Connection string → Session pooler**: copie a URL e coloque a senha do banco.
4. Preencha o `.env.local` (modelo em `.env.example`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   SUPABASE_SECRET_KEY=...
   SUPABASE_DB_URL=...
   ```
   **A secret key e a senha do banco nunca vão para o GitHub, chat ou e-mail.**

### 7.2 Montar o banco

```bash
npm run supabase:migrar                      # cria tabelas, regras de segurança e bucket de fotos
npm run supabase:importar                    # envia os 24 imóveis de exemplo e as fotos
npm run supabase:admin -- voce@email.com "Seu Nome"   # cria o primeiro administrador
npm run supabase:status                      # confere se deu tudo certo
```

A senha provisória do primeiro administrador fica no arquivo `ACESSO_ADMIN_PROVISORIO.txt`
(fora do git). **Apague o arquivo** depois do primeiro acesso.

No Supabase, em **Authentication → Sign In / Providers**, desative _Allow new users to sign up_
(as contas são criadas só pelo painel).

### 7.3 Publicar

**GitHub Pages (atual, gratuito).** O workflow `.github/workflows/pages.yml` publica a cada
push na `main` e, a cada 10 minutos, confere se algo mudou no banco para regerar as páginas.
Ele precisa de duas **variáveis** do repositório (GitHub → Settings → Secrets and variables →
Actions → _Variables_): `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
(são chaves públicas). A chave secreta **não** vai para o GitHub.

Sem servidor, o painel e os formulários falam direto com o Supabase pelo navegador. A
segurança não depende do site: as regras RLS do banco decidem o que cada pessoa pode ver e
alterar, e os leads entram só pela função `registrar_lead` (valida os dados e limita abusos).

Criar/desativar pessoas da equipe usa a função **equipe** do Supabase (Edge Function, roda nos
servidores do Supabase com a chave secreta). Instalar/atualizar, uma vez:

```bash
npx supabase login                                   # abre o navegador para autorizar
npx supabase functions deploy equipe --project-ref SEU-PROJETO
```

**Vercel (opcional, com servidor).** O mesmo código roda na Vercel com atualização instantânea
de todas as páginas: importe o repositório, cadastre `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL` e
`NEXT_PUBLIC_MODO_DEMO=true` e faça o deploy. **Não** cadastre `SUPABASE_DB_URL` nem
`NEXT_PUBLIC_MODO_ESTATICO`.

### 7.4 Estrutura (para quem mantém o código)

- `supabase/migrations/`: SQL versionado (tabelas, RLS, auditoria, Storage, `registrar_lead`).
- `supabase/functions/equipe/`: Edge Function da gestão da equipe.
- `supabase/seed.sql`: dados mínimos (corretor de exemplo).
- `src/lib/repositorio/supabase.ts`: o site lê daqui (no build e no servidor) quando o Supabase
  está configurado; sem ele, lê `src/data`. As páginas não mudam.
- `src/lib/cliente/ao-vivo.ts`: leitura ao vivo no navegador (versão estática).
- `src/lib/admin/`: sessão, consultas e operações do painel (rodam no navegador).
- `scripts/versao-dados.mjs`: impressão digital dos dados, usada pelo workflow para saber se
  precisa regerar o site.
- Testes do painel: `tests/e2e/painel.spec.ts` (criam contas de teste e apagam no final).
  Para testar a versão estática: build com `NEXT_PUBLIC_MODO_ESTATICO=true` (sem `src/app/api`)
  e `E2E_ESTATICO=1 npx playwright test`.
