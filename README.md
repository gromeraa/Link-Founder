# Link Founder 🔖

Diretório de links **compartilhado** organizado em coleções (filtros), com busca, marcadores, favoritos e ordenação.
**Qualquer pessoa com o link pode ver** e navegar pelos links; **só quem tem conta** (login com e-mail e senha) cria, edita e apaga links e categorias.
Visual Apple HIG: branco, azul e cinza-claro, glassmorphism e animações. Pensado primeiro para o celular.

**Stack (tudo grátis):**
- **GitHub**: guarda o código
- **Vercel**: hospeda o site e a API (`/api`, Vercel Functions)
- **Upstash Redis**: banco de dados, conectado pelo Marketplace da Vercel (plano gratuito)
- Vite + React + TypeScript · Motion (animações) · Lucide (ícones)

---

## Publicar (uma vez só, ~10 minutos)

### 1. Código no GitHub
```bash
npm install
git remote add origin https://github.com/gromeraa/Link-Founder.git
git push -u origin main
```

### 2. Site na Vercel
Em [vercel.com/new](https://vercel.com/new), entre com o GitHub, importe o repositório e clique **Deploy**.
(O primeiro acesso vai mostrar um erro de banco não conectado. É esperado: os próximos passos resolvem.)

### 3. Banco de dados (grátis)
No projeto na Vercel: **Storage → Create Database → Upstash for Redis** → plano **Free** → **Connect** ao projeto.
A Vercel cria sozinha as variáveis de conexão (`KV_REST_API_URL` / `KV_REST_API_TOKEN` ou `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`; o app aceita os dois nomes).

### 4. Contas de login
**Settings → Environment Variables** → adicione:

| Nome | Valor |
| --- | --- |
| `LOGIN_USERS` | `Gui:seu-email@gmail.com:senha-inicial-do-gui;Ana:email-da-ana@gmail.com:senha-inicial-da-ana` |

Formato: `nome:e-mail:senha`, com as contas separadas por **ponto e vírgula**. A senha não pode ter `;`.
Essa é só a **senha inicial**: depois de entrar, cada um troca a sua em **Ajustes → Alterar senha** (a nova fica guardada com criptografia no banco).
Para adicionar ou remover alguém, edite essa variável e faça Redeploy.

### 5. Publicar de novo
**Deployments → ⋯ → Redeploy**. Pronto!

### 6. Nos celulares de vocês
Abra o site → **Ajustes → Entrar** → e-mail e senha. Vocês continuam conectados no aparelho até sair (sessão de 180 dias).
Depois, troque a senha inicial em **Ajustes → Alterar senha**.
Dica: no Safari use **Compartilhar → Adicionar à Tela de Início** (no Android, menu **⋮ → Instalar app**). O Link Founder abre como um app.

Visitantes não veem botões de adicionar, editar ou apagar, e o servidor recusa qualquer alteração sem login.

No primeiro acesso o banco é preenchido com os links de exemplo de `api/_lib/seed.ts`. Edite ou apague à vontade pelo próprio site.

---

## Como funciona o compartilhamento

| | Visitante (só o link) | Vocês (logados) |
| --- | --- | --- |
| Ver, buscar, filtrar e abrir links | ✅ | ✅ |
| Copiar e compartilhar links | ✅ | ✅ |
| Adicionar, editar, mover e apagar links | ❌ | ✅ |
| Criar, editar e apagar coleções | ❌ | ✅ |
| Marcar como Salvo | ❌ | ✅ |
| Backup e restauração | ❌ | ✅ |

- Tudo que um de vocês adiciona, edita, move ou apaga vai direto para o banco.
- Os outros aparelhos conferem novidades **a cada 30 segundos** e sempre que o app volta para a tela.
- Em **Ajustes** dá para atualizar na hora, ver quando sincronizou, mudar seu nome e sair do aparelho.
- Cada link mostra **quem adicionou** ("Ana · Há 2 dias").
- Os **Salvos** (favoritos) são marcados por vocês e aparecem como destaques para todos.

**Backup:** Ajustes → *Baixar backup (.json)*. Para voltar uma cópia: *Restaurar backup*, que substitui a biblioteca inteira para todos.

**Se o site mostrar "Serviço indisponível":** falta alguma configuração (banco ou `LOGIN_USERS`) ou o Redeploy. Por segurança o site não mostra o motivo para quem está usando: veja em **Vercel → Logs**, nas linhas que começam com `[configuração]`.

**Segurança do login:**
- Senhas trocadas no app são guardadas com hash (scrypt), nunca em texto.
- Depois de 8 tentativas erradas, o e-mail fica bloqueado por 15 minutos.
- Trocar a senha desconecta os outros aparelhos daquela conta.
- Esqueceu a senha? Na Vercel, abra **Storage → (seu banco) → Open in Upstash → Data Browser** e apague a chave `linkfounder:auth:pw:<seu e-mail>`. A senha inicial de `LOGIN_USERS` volta a valer.

## Criar um novo "tipo de filtro"

Pelo site: **+ Novo filtro** (tela inicial) ou **Nova coleção**. Escolha nome, cor e ícone. Ela aparece na hora como chip de filtro, pasta em Coleções e item na barra lateral, para os dois.

Para ter mais ícones à disposição: importe de [lucide.dev/icons](https://lucide.dev/icons) em `src/lib/icons.ts`.

## Trocar o nome do app

`src/lib/config.ts` (`APP_NAME`), `index.html` (`<title>`) e `public/manifest.webmanifest`.

## Rodar no computador

```bash
npm install
npm run dev        # http://localhost:5173 — a API roda junto, com dados em memória
```

Sem `LOGIN_USERS`, todo mundo edita localmente. Para testar o login: `LOGIN_USERS='Teste:teste@teste.com:12345678' npm run dev`.
Para usar o banco real: `npx vercel link && npx vercel env pull` e depois `npx vercel dev`.

## Estrutura

```
api/                     ← Vercel Functions (rodam no servidor)
  auth.ts                ← login, sessão e troca de senha
  library.ts             ← GET biblioteca (público) · PUT restaurar backup
  links.ts               ← POST salvar link · DELETE apagar
  collections.ts         ← POST salvar coleção · DELETE apagar (com seus links)
  _lib/                  ← banco (Redis/memória), login, validação, dados iniciais
src/
  lib/store.tsx          ← estado do app, sincronização e edição otimista
  components/  pages/    ← interface
  styles.css             ← tokens do design (cores, vidro, sombras) e layout
```

## Atalhos

| Tecla | Ação |
| --- | --- |
| `/` ou `Ctrl/⌘ + K` | Buscar |
| `N` | Novo link |
| `Esc` | Fechar janela / limpar busca |
