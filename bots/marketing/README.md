# Bot de marketing do SIMPLE ATHLETIC

Este bot divulga as ofertas do site sozinho no **Telegram**, no **X (Twitter)**, no **Instagram** e (se você quiser) no **WhatsApp**.

Como ele funciona, em 5 passos:

1. Lê as ofertas em `src/data/products.json` (que o outro bot mantém atualizado).
2. Escolhe a melhor oferta que **ainda não foi postada** naquele canal: maior desconto, com bônus para oferta nova, que está acabando, com cupom ou frete grátis.
3. Monta o post em português: título, preço de/por, % de desconto, cupom, frete grátis e "acaba em".
4. Publica em cada canal que tiver as chaves configuradas. O link é sempre `https://SEU_DOMINIO/ir/<id>`, **nunca o link direto da loja**. Assim você pode trocar o link de afiliado depois sem quebrar posts antigos, e cada clique passa pelo seu site.
5. Anota o que postou em `bots/marketing/postados.json` para não repetir.

O GitHub Actions roda o bot **uma vez por hora**, de graça.

---

## Regras anti-spam (já vêm prontas)

| Regra | Padrão | Como mudar |
|---|---|---|
| Horário | só das 8h às 22h (Brasília) | `HORA_INICIO`, `HORA_FIM` |
| Intervalo no mesmo canal | 1 post por hora (55 min, por causa do atraso do cron) | `INTERVALO_MINUTOS` |
| Telegram e X por dia | até 8 | `MAX_POSTS_DIA` |
| Instagram por dia | até 3 | `INSTAGRAM_MAX_POR_DIA` |
| WhatsApp por dia | 1 | `WHATSAPP_MAX_POR_DIA` |
| Desconto mínimo | 10% | `DESCONTO_MINIMO` |
| Repetir a mesma oferta | só depois de 7 dias, ou se o preço cair mais 3% | `REPOSTAR_APOS_DIAS` |

---

## 1. Testar no seu computador (sem publicar nada)

Você precisa do [Node.js 24](https://nodejs.org) instalado. Na pasta do projeto:

```bash
npm install
```

```bash
npm run bot:marketing -- --dry-run
```

O `--dry-run` **só imprime** como ficariam os posts de cada canal e salva a imagem do card em `bots/marketing/.preview/` para você ver. Não publica e não mexe no histórico.

Outras opções úteis:

```bash
npm run bot:marketing -- --dry-run --quantidade=5
```

(mostra as 5 próximas ofertas da fila de cada canal)

```bash
npm run bot:marketing -- --dry-run --canal=telegram
```

(só um canal: `telegram`, `x`, `instagram` ou `whatsapp`)

### Guardar suas chaves no computador

Copie `bots/marketing/.env.example` para `bots/marketing/.env` e preencha. O arquivo `.env` **nunca** vai para o GitHub (está no `.gitignore`). O comando `npm run bot:marketing` já lê esse arquivo sozinho.

---

## 2. Telegram (comece por aqui)

### 2.1 Criar o bot no @BotFather

1. No Telegram, procure **@BotFather** (tem o selo azul de verificado).
2. Mande `/newbot`.
3. Escolha um nome, por exemplo `Simple Athletic Ofertas`.
4. Escolha um usuário terminado em `bot`, por exemplo `simpleathletic_ofertas_bot`.
5. Ele responde com um **token** parecido com `123456789:AAH...`. Esse é o `TELEGRAM_BOT_TOKEN`. Não mostre para ninguém.

### 2.2 Criar o canal

1. No Telegram: menu ✏️ → **Novo canal**. Nome: `Simple Athletic | Ofertas Esportivas`.
2. Escolha **Público** e um link, por exemplo `t.me/simpleathletic`.
3. Abra o canal → nome do canal → **Administradores** → **Adicionar administrador** → procure o seu bot → deixe ligado **Publicar mensagens** → salvar.

### 2.3 Descobrir o `TELEGRAM_CHAT_ID`

- **Canal público:** é só o @ do canal, por exemplo `@simpleathletic`.
- **Canal privado (bom para testes):** publique qualquer mensagem no canal, depois abra no navegador `https://api.telegram.org/botSEU_TOKEN/getUpdates`. Procure `"chat":{"id":-100...`. Esse número (com o `-100` na frente) é o chat id.

### 2.4 Primeiro post de verdade

Coloque `SITE_URL`, `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID` no `bots/marketing/.env` e rode:

```bash
npm run bot:marketing -- --canal=telegram --forcar
```

O `--forcar` ignora o horário e o limite de posts. Use só para testar. Deve aparecer `🚀 publicado` e o post com foto e botão **🛒 Ver oferta** no canal. Esse post é registrado em `postados.json`. Se foi só um teste e você quer que a oferta seja postada de novo depois, apague esse registro do arquivo.

> Dica: o botão só funciona com um `SITE_URL` real em `https://`. O Telegram recusa `localhost`.

---

## 3. Colocar as chaves no GitHub (para rodar sozinho)

1. No GitHub, abra o repositório → **Settings** → **Secrets and variables** → **Actions**.
2. Na aba **Secrets**, clique em **New repository secret** para cada chave:

| Secret | Canal |
|---|---|
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Telegram |
| `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET` | X |
| `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID` | Instagram |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TO` | WhatsApp |

3. Na aba **Variables**, crie:
   - `SITE_URL` = `https://seudominio.com.br` (obrigatória)
   - opcionais: `MAX_POSTS_DIA`, `WHATSAPP_ENABLED` (`true` para ligar), `WHATSAPP_TEMPLATE`

Canal sem chave fica desligado. Você pode começar só com o Telegram e ir ligando os outros depois.

### Testar o workflow

Vá em **Actions** → **Bot de marketing** → **Run workflow**:
- **modo = teste** só mostra os posts no log (dry-run).
- **modo = publicar** posta de verdade. Marque **forcar** para ignorar horário e limites.

Depois disso ele roda sozinho no minuto 17 de toda hora. O arquivo do workflow é `.github/workflows/bot-marketing.yml`.

### Evitar que a Vercel faça deploy a cada post

Cada post gera um commit do `postados.json`. Para a Vercel não reconstruir o site à toa, abra o projeto na Vercel → **Settings** → **Git** → **Ignored Build Step** → escolha **Custom** e cole:

```bash
git diff --quiet HEAD^ HEAD -- . ':(exclude)bots'
```

Assim, só há deploy quando algo fora de `bots/` muda. Mudanças no `products.json` continuam gerando deploy.

---

## 4. X (Twitter)

1. Entre em [developer.x.com](https://developer.x.com) com a conta que vai postar e crie um **Project** e um **App**.
2. No App → **User authentication settings** → **Set up**: permissão **Read and write**, tipo **Web App, Automated App or Bot**. Em Callback URL e Website, use o endereço do seu site.
3. Em **Keys and tokens**:
   - **API Key and Secret** → `X_API_KEY` e `X_API_SECRET`
   - **Access Token and Secret** → `X_ACCESS_TOKEN` e `X_ACCESS_SECRET`

   ⚠️ Gere o Access Token **depois** de mudar a permissão para "Read and write". Se gerou antes, gere de novo, senão dá erro 403.

**Custos:** o X muda os planos da API com frequência. Hoje a cobrança é por uso (créditos). Veja o preço atual em developer.x.com antes de ligar. Com 8 posts por dia o volume é pequeno, mas confira. O post é só texto + link: o X mostra a prévia do site sozinho.

---

## 5. Instagram

O Instagram só deixa publicar por API em conta **profissional** (Business ou Creator) **ligada a uma Página do Facebook**.

1. No app do Instagram: **Configurações** → **Tipo de conta e ferramentas** → **Mudar para conta profissional**.
2. Crie uma Página no Facebook e ligue o Instagram a ela (na Página: **Configurações** → **Contas vinculadas** → **Instagram**).
3. Em [developers.facebook.com](https://developers.facebook.com) → **Meus apps** → **Criar app** → tipo **Empresa**.
4. Abra o **Graph API Explorer**, escolha seu app e peça as permissões: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`. Clique em **Generate Access Token**.
5. No Explorer, rode `me/accounts?fields=name,instagram_business_account`. O número em `instagram_business_account.id` é o `INSTAGRAM_USER_ID`.
6. O token do Explorer dura só 1 hora. Para um que não expira: no **Business Manager** (business.facebook.com) → **Configurações do negócio** → **Usuários do sistema** → crie um usuário Admin → **Gerar token** com as mesmas permissões e dê acesso à Página e à conta do Instagram. Esse é o `INSTAGRAM_ACCESS_TOKEN`.

**Como a imagem chega ao Instagram:** a API não aceita envio de arquivo. Ela baixa a imagem de um link público. Então o bot gera o card 1080x1080 e faz isto:
1. sobe o card temporariamente para `bots/marketing/cards/` no seu repositório;
2. manda o link para o Instagram;
3. publica;
4. apaga o arquivo.

Por isso, o Instagram:
- só funciona pelo **GitHub Actions** (lá existem `GITHUB_TOKEN` e `GITHUB_REPOSITORY` automaticamente);
- precisa de **repositório público**. Se o repositório for privado, o Instagram não consegue baixar a imagem. Me avise, porque aí dá para trocar por outro jeito de hospedar a imagem.

Na legenda, o link não é clicável (regra do Instagram). Por isso o texto diz "link na bio": coloque o endereço do site na bio do perfil. O Instagram aceita no máximo 50 posts por API a cada 24h, e o bot usa 3 por dia.

---

## 6. WhatsApp (preparado, mas desligado)

O bot usa só a **WhatsApp Cloud API oficial da Meta**. Ele **não usa** bibliotecas que "imitam" o WhatsApp Web (como whatsapp-web.js ou Baileys). Elas violam os termos de uso e o número acaba banido.

### Limitações importantes

- **Não existe API para postar em Canais do WhatsApp nem em grupos.** A Cloud API manda mensagem só para **números individuais**.
- Só mande para quem **pediu para receber** (opt-in), por exemplo quem se cadastrou num formulário do site. Mandar para quem não pediu gera denúncias e bloqueio do número.
- Se a pessoa não falou com você nas últimas 24h, você só pode mandar **modelos (templates) aprovados pela Meta**. Ofertas são da categoria **Marketing**.
- **Custo:** a Meta cobra **cada mensagem de marketing entregue**. No Brasil são alguns centavos de dólar por mensagem (veja a tabela atual em developers.facebook.com/docs/whatsapp/pricing). Exemplo: 1.000 pessoas × 1 oferta por dia × 30 dias = 30.000 mensagens por mês. Por isso o padrão é **1 envio por dia**.
- O número usado na API não pode estar ao mesmo tempo no app normal do WhatsApp.

**Alternativa grátis:** criar um **Canal do WhatsApp** pelo app e repostar nele, à mão, as melhores ofertas do canal do Telegram.

### Como ligar, se quiser

1. Em developers.facebook.com, no seu app, adicione o produto **WhatsApp** e siga o "Primeiros passos". Lá aparecem o **Phone number ID** (`WHATSAPP_PHONE_NUMBER_ID`) e um token temporário.
2. Crie um token permanente pelo **Usuário do sistema** (igual ao do Instagram), com a permissão `whatsapp_business_messaging`. Ele é o `WHATSAPP_TOKEN`.
3. No **WhatsApp Manager** → **Modelos de mensagem** → **Criar modelo**:
   - Categoria: **Marketing**. Nome: `oferta_do_dia`. Idioma: **Português (BR)**.
   - Corpo, exatamente com 3 variáveis:
     ```
     🔥 {{1}}
     {{2}}
     Ver oferta: {{3}}
     ```
   - Aguarde a aprovação.
4. Crie o secret `WHATSAPP_TO` com os números que aceitaram receber, com DDI e DDD, separados por vírgula: `5511999999999,5521988888888`.
5. Crie a variable `WHATSAPP_ENABLED` = `true`.

---

## Arquivos

| Arquivo | O que faz |
|---|---|
| `index.mjs` | Programa principal: decide o que postar e chama cada canal |
| `config.mjs` | Lê as variáveis de ambiente e os limites |
| `ofertas.mjs` | Escolhe ofertas, aplica as regras de horário e limite, guarda o histórico |
| `texto.mjs` | Monta o texto de cada rede |
| `card.mjs` | Desenha a imagem 1080x1080 (usa o pacote `sharp`, que já vem com o Next.js) |
| `canais/*.mjs` | Um arquivo por rede social |
| `postados.json` | Histórico do que já foi postado (o bot atualiza sozinho) |

## Problemas comuns

- **"Defina a variável SITE_URL"**: falta o `SITE_URL` (no `.env` ou nas Variables do GitHub).
- **Telegram "chat not found"**: o chat id está errado ou o bot não é administrador do canal.
- **Telegram "not enough rights"**: ligue a permissão **Publicar mensagens** para o bot.
- **X 403**: gere o Access Token de novo depois de pôr a permissão "Read and write".
- **Instagram "Only photo or video can be accepted"** ou erro ao baixar a imagem: o repositório é privado.
- **Nada acontece de madrugada**: é proposital, o bot só posta das 8h às 22h.
- **"agora não: último post há X min"**: limite de 1 post por hora por canal. Use `--forcar` só para testar.
