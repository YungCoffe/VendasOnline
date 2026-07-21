# Minha Loja de Afiliados — com backend

## O que mudou
Antes tudo ficava salvo em `localStorage` (só no navegador de cada visitante).
Agora existe um backend rodando como **Vercel Functions** (pasta `/api`) que
guarda os produtos, a senha do admin e as estatísticas num banco **Redis**
(via a integração "Redis" do Vercel Marketplace, powered by Redis Cloud).
Isso significa que os produtos que você cadastrar aparecem pra todo mundo
que visitar o site, e continuam lá mesmo depois de fechar o navegador.

> **Nota:** o antigo "Vercel KV" foi descontinuado pela própria Vercel em
> 2025. O backend aqui já usa o substituto oficial: a integração **Redis**
> do Marketplace, com a biblioteca padrão `redis` do Node (não usa mais
> `@vercel/kv`).

## Passo a passo para colocar no ar

### 1. Suba o projeto num repositório Git
Crie um repositório (GitHub, GitLab, etc.) com esses arquivos e dê push.

### 2. Importe o projeto na Vercel
Em vercel.com → **Add New Project** → selecione o repositório.
Não precisa mudar nada nas configurações de build (é só HTML + funções serverless).

### 3. Crie o banco Redis
No painel do projeto na Vercel: aba **Storage** → em **Marketplace Database
Providers**, procure **Redis** ("Official Redis for Vercel") → **Create**.
Escolha região/plano (o plano gratuito serve tranquilo pra esse projeto) →
**Create**. Depois de criado, clique em **Connect Project** e selecione
este projeto — a Vercel injeta automaticamente a variável de ambiente
`REDIS_URL` que o código usa. Você não precisa copiar nada manualmente.

### 4. Defina as variáveis de ambiente do admin
Ainda em **Settings → Environment Variables**, adicione:

| Nome | Valor sugerido | Obrigatória? |
|---|---|---|
| `ADMIN_SENHA_PADRAO` | uma senha forte, ex: `MinhaLoja2026!` | Recomendado (senão usa `admin123`) |
| `ADMIN_TOKEN_SECRET` | uma string longa e aleatória, ex: gerada em https://generate-secret.vercel.app/32 | Recomendado (senão usa um valor padrão inseguro) |

Depois de trocar a senha pela primeira vez no painel admin, ela passa a ficar
salva no banco (hash, nunca em texto puro) e o `ADMIN_SENHA_PADRAO` deixa de valer.

### 5. Deploy (ou redeploy)
Clique em **Deploy**. Se você conectou o Redis depois de um deploy já
existente, é preciso fazer um **novo deploy** pra variável `REDIS_URL` ser
aplicada — vá em **Deployments** → menu "⋯" do último deploy → **Redeploy**.

Pronto — seu site já estará em `https://seu-projeto.vercel.app` com o
painel admin acessível pelo botão "Admin" no canto superior direito.

## Rotas da API criadas
- `GET /api/produtos` — lista os produtos (pública)
- `POST /api/produtos` — cria produto (precisa login)
- `PUT /api/produtos` — edita produto (precisa login)
- `DELETE /api/produtos?id=123` — remove produto (precisa login)
- `GET /api/captcha` — gera uma nova continha de verificação
- `POST /api/login` — envia `{ senha, captchaId, captchaResposta }`, devolve `{ token }`
- `POST /api/senha` — troca a senha do admin (precisa login)
- `GET|POST /api/estatisticas` — visitas e cliques

## Segurança do login
- **Captcha simples**: antes de entrar, é preciso responder uma continha (soma ou
  subtração), gerada pelo backend e válida por 5 minutos, uso único.
- **Limite de tentativas por IP**: depois de 5 tentativas erradas (senha ou
  captcha) do mesmo IP, ele fica bloqueado por 15 minutos. O contador reseta
  automaticamente quando o login der certo.

## Se der erro 500 em qualquer rota
Normalmente significa que o Redis ainda não está conectado ao projeto (ou
falta um redeploy depois de conectar). Os erros agora vêm com uma mensagem
mais clara — dá pra ver o texto exato em **Vercel → Logs**, clicando na
linha do erro.

## Rodando localmente (opcional)
```bash
npm install -g vercel
npm install
vercel dev
```
A Vercel CLI pede pra linkar com um projeto/banco Redis da nuvem — não dá
pra rodar 100% offline, mas o `vercel dev` conecta no banco real da nuvem
mesmo em ambiente local.
