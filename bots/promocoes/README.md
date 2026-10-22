# Bot de promoções

Este bot procura ofertas de artigos esportivos nas lojas, coloca o **seu link de afiliado** em cada uma
e grava tudo em `src/data/products.json`. O site lê esse arquivo, então quando ele muda o site muda junto.

No GitHub, ele roda sozinho **de hora em hora** (arquivo `.github/workflows/bot-promocoes.yml`).
Se alguma oferta mudou, ele faz um commit e a Cloudflare publica o site de novo automaticamente.

## O que ele faz a cada execução

1. **Recheca as ofertas que estão no site.** Sai do ar (`active: false`) quando:
   o preço subiu, o produto esgotou ou foi removido, o desconto ficou abaixo de 15%,
   passou da data `expiresAt`, ou a oferta não pôde ser confirmada por 2 dias.
2. **Busca ofertas novas** com desconto real de **15% ou mais**, só nas categorias do site
   (`src/data/catalog.ts`). Os termos de busca de cada categoria ficam em `bots/promocoes/categorias.ts` — edite à vontade.
3. **Evita repetição**: o mesmo anúncio ou o mesmo título na mesma loja não entra duas vezes.
4. **Mantém no máximo 200 ofertas ativas** (ficam as de maior desconto) e **apaga** do arquivo as inativas há mais de 30 dias.
5. As **ofertas de exemplo** (`demo-…`) saem do ar sozinhas assim que entra a primeira oferta real.
6. Se aparecer imagem de um domínio novo, ele acrescenta o domínio em `next.config.ts` (senão a imagem não carrega).

Só usamos **APIs oficiais** das lojas e das redes de afiliados. Nada de copiar dados das páginas (scraping),
o que é proibido pelos termos das lojas e pode cancelar sua conta de afiliado.

## Situação de cada loja

| Loja | Como o bot fala com ela | Situação |
| --- | --- | --- |
| Mercado Livre | API oficial do Mercado Livre | **Pronto.** Só falta você criar as chaves. |
| Amazon | Creators API (substituta da PA-API 5.0) | Pronto, mas não testado: a Amazon só libera a API após 10 vendas em 30 dias. |
| Shopee | API do Shopee Afiliados (GraphQL) | Pronto, mas não testado com chaves reais. |
| Netshoes, Centauro, Decathlon | Feeds de produtos da Awin | Pronto (testado com feed de exemplo). Liga com `AWIN_FEED_API_KEY` e só lê lojas em que você foi aprovado. |
| Magalu e outras | Lomadee | Esqueleto: ainda não busca nada. |

Cada loja só liga quando as chaves dela existem. Sem chaves, ela é ignorada e o bot avisa no log.

---

## Passo a passo: cadastro nos programas de afiliados

> Dica: comece **só pelo Mercado Livre**. É o mais fácil de aprovar e o bot já está pronto para ele.
> Cadastre o site já publicado (`https://simpleathletic.com.br`) — os programas pedem um site no ar.

### 1. Mercado Livre (comece por aqui)

São **duas coisas diferentes**, e você precisa das duas:

**a) Programa de Afiliados (é o que te paga comissão)**

1. Entre em <https://www.mercadolivre.com.br/afiliados> com sua conta do Mercado Livre e faça a inscrição.
2. Depois de aprovado, abra o **gerador de links** no painel de afiliados e gere um link de qualquer produto.
3. Abra esse link no navegador e veja o endereço completo. Ele tem algo como `matt_word=SEUNOME` e `matt_tool=12345678`.
   - O valor de `matt_word` é o seu **`ML_AFFILIATE_TAG`**.
   - O valor de `matt_tool` é o seu **`ML_AFFILIATE_TOOL`**.
   - Se o formato do link for diferente disso, me mostre um link gerado que eu ajusto o bot.

**b) Aplicativo de desenvolvedor (é o que deixa o bot buscar ofertas)**

Desde 2025 a busca do Mercado Livre só responde para aplicativos cadastrados. É grátis:

1. Entre em <https://developers.mercadolivre.com.br> com a mesma conta e vá em **Minhas aplicações > Criar aplicação**.
2. Preencha nome (ex.: "Simple Athletic Bot"), descrição curta e, em **URI de redirect**, o endereço do seu site.
3. Em **Fluxos OAuth**, deixe **Client Credentials** marcado. Em **Negócios**, marque **Mercado Livre**.
4. Nas permissões, coloque **"Publicação e sincronização" → Leitura** (é ela que libera os preços do catálogo) e
   **"Promoções, cupons e descontos" → Leitura**. Todas as outras em **Sem acesso**: o bot só lê.
5. Salve. Em **Editar**, a tela mostra o **Client ID** (`ML_CLIENT_ID`) e a **Chave secreta** (`ML_CLIENT_SECRET`).

O que o ML libera para um app novo: o **catálogo** (`/products/search`), as **ofertas de cada produto**
(`/products/{id}/items`, com preço, preço "de", vendedor e frete) e a **reputação do vendedor** (`/users/{id}`).
Busca de anúncios, `/items`, avaliações e estoque ficam bloqueados; o bot trata esses dados como indisponíveis.

### 2. Amazon Associados

1. Cadastre-se em <https://associados.amazon.com.br>. Você recebe uma **tag de associado** parecida com `seunome-20` → **`AMAZON_PARTNER_TAG`**.
2. A Amazon exige **3 vendas nos primeiros 180 dias** para aprovar a conta.
3. A busca automática usa a **Creators API** (Ferramentas → API de criadores), que substituiu a PA-API 5.0.
   Ela só libera credenciais para **conta aprovada** e com **10 vendas qualificadas nos últimos 30 dias**.
4. Quando liberar: em **API de criadores → Aplicativos**, crie um aplicativo e copie o **Client ID** (`AMAZON_CLIENT_ID`)
   e o **Client Secret** (`AMAZON_CLIENT_SECRET`). Coloque os dois nos GitHub Secrets. Pode levar até 48 h para a
   Amazon ativar; até lá a API responde "AssociateNotEligible".

**Situação em 22/10/2026 (conferido no painel):**

- Tag de associado: **`simpleathleti-20`** (já configurada no bot e nos botões "Procurar na Amazon" do site).
- Conta ainda **não aprovada** → a Creators API ainda não pode ser ativada. O bot (`lojas/amazon.ts`, já escrito para a
  Creators API) fica desligado e liga sozinho quando os dois secrets existirem.
- Até lá, o site mostra só **links de busca** da Amazon com a sua tag (sem preço). **Não** copie preços da Amazon
  "na mão" ou por robô lendo a página: o contrato de associados só permite preços vindos da API.

### 3. Shopee Afiliados (bom para roupas: catálogo enorme e aceita pessoa física)

1. Cadastre-se em <https://affiliate.shopee.com.br> com a sua conta Shopee (CPF serve). Informe o site
   `https://simpleathletic.com.br` e as redes sociais onde vai divulgar.
2. Depois de aprovado, no painel de afiliados procure **Open API** e peça acesso (a Shopee analisa o pedido).
3. Liberado, a tela mostra um **AppID** (`SHOPEE_APP_ID`) e uma **Secret** (`SHOPEE_APP_SECRET`). Coloque os dois nos
   GitHub Secrets. O adaptador (`lojas/shopee.ts`) busca por palavra-chave e usa o `offerLink` (já com a sua comissão).
4. A Shopee só informa o preço atual e o % de desconto; o bot calcula o preço "de" a partir deles.

### 4. Netshoes e Centauro (rede Awin)

Netshoes, Centauro e Decathlon não têm programa próprio aberto: ficam na rede de afiliados **Awin**.
Você se cadastra na Awin e depois pede para participar do programa de cada loja.

1. Cadastre-se em <https://www.awin.com/br> como **publisher** (afiliado), informando o site. A Awin pode cobrar um
   pequeno depósito de cadastro, que volta junto com o primeiro pagamento de comissão.
2. No painel, vá em **Anunciantes → Ingressar em programas**, procure **Netshoes**, **Centauro** e **Decathlon** e
   peça para participar de cada um. Cada loja aprova (ou não) separadamente.
3. **Atenção:** a página da Centauro na Awin diz que **não aceita afiliado pessoa física**. Para ela, você
   vai precisar de um CNPJ (um MEI resolve). Confira as regras atuais de cada programa antes de pedir.
4. Depois de aprovado em pelo menos uma loja, vá em **Toolbox → Create-a-Feed** (ou **Feeds de produtos**) e copie a
   **chave de API de feeds** que aparece nos links de download. Ela é diferente do token da API do publisher.
   Coloque nos GitHub Secrets como `AWIN_FEED_API_KEY`.
5. Pronto: o bot (`lojas/awin.ts`) lê o feed de produtos oficial de cada loja em que você foi aprovado, procura os
   mesmos termos (legging, camiseta dry fit, tênis...) e só publica o que tem preço "de" e desconto real.
   O link usado é o `aw_deep_link`, que já leva a sua comissão. Lojas não aprovadas aparecem só como aviso no relatório.

- **Lomadee** — <https://www.lomadee.com>. Outra rede brasileira; o adaptador (`lojas/redes.ts`) ainda é um esqueleto.

Quais lojas estão em cada rede muda com o tempo. Olhe no painel da rede antes de escolher.

---

## Onde colocar as chaves

### No GitHub (para o bot rodar sozinho)

1. No seu repositório do GitHub, vá em **Settings > Secrets and variables > Actions**.
2. Clique em **New repository secret**, coloque o **nome** exatamente como na tabela e o **valor**. Repita para cada chave.

| Nome do secret | De onde vem |
| --- | --- |
| `ML_CLIENT_ID` | App de desenvolvedor do Mercado Livre |
| `ML_CLIENT_SECRET` | App de desenvolvedor do Mercado Livre |
| `ML_AFFILIATE_TAG` | `matt_word` do link de afiliado do Mercado Livre |
| `ML_AFFILIATE_TOOL` | `matt_tool` do link de afiliado do Mercado Livre |
| `AMAZON_PARTNER_TAG` | Opcional: troca a tag padrão `simpleathleti-20` |
| `AMAZON_CLIENT_ID` / `AMAZON_CLIENT_SECRET` | Creators API da Amazon (após 10 vendas em 30 dias) |
| `SHOPEE_APP_ID` / `SHOPEE_APP_SECRET` | Open API do Shopee Afiliados |
| `AWIN_FEED_API_KEY` | Chave de feeds de produtos da Awin (Netshoes, Centauro, Decathlon) |
| `LOMADEE_APP_TOKEN` / `LOMADEE_SOURCE_ID` | Lomadee |

Só preencha as que você já tem. As outras lojas ficam desligadas.

Para testar sem esperar a próxima hora: aba **Actions > Bot de promoções > Run workflow**.

> Sem `ML_AFFILIATE_TAG` o bot funciona, mas os links vão **sem a sua comissão** (aparece um aviso no log).
> Nunca coloque chaves dentro do código nem em arquivos que vão para o GitHub.

### No seu computador (para testar)

Crie o arquivo `bots/promocoes/.env` (já está no `.gitignore`, então não vai para o GitHub).
**Não use o `.env.local` da raiz para chaves do bot:** o build do site na Cloudflare embute o `.env.local` no servidor.

```
ML_CLIENT_ID=coloque_aqui
ML_CLIENT_SECRET=coloque_aqui
ML_AFFILIATE_TAG=coloque_aqui
ML_AFFILIATE_TOOL=coloque_aqui
```

## Rodar no seu computador

Na pasta do projeto, instale as dependências (só na primeira vez):

```bash
npm install
```

Rode o bot (ele atualiza `src/data/products.json`):

```bash
npm run bot:promocoes
```

Para só ver o que ele faria, sem gravar nada:

```bash
npm run bot:promocoes -- --seco
```

Depois abra o site em <http://localhost:3000> para ver as ofertas:

```bash
npm run dev
```

## Arquivos

- `index.ts` — o "cérebro": rechecagem, regras de desconto, limite de 200, limpeza e gravação.
- `categorias.ts` — o que buscar em cada categoria do site.
- `tipos.ts` — a interface comum das lojas (`buscarOfertas` e `verificarOferta`) e funções de apoio.
- `lojas/mercadolivre.ts`, `lojas/amazon.ts`, `lojas/shopee.ts`, `lojas/awin.ts`, `lojas/redes.ts` — um adaptador por loja ou rede.

Para adicionar uma loja nova: crie um arquivo em `lojas/` seguindo a interface `AdaptadorLoja` e coloque-o na lista
`TODOS_ADAPTADORES` em `index.ts`. O formato de `products.json` (tipo `Product` em `src/types/product.ts`) não deve mudar.
