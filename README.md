# Link Founder 🔖

Diretório de links **compartilhado** organizado em coleções (filtros), com busca, marcadores, favoritos e ordenação.
**Qualquer pessoa com o link pode ver** e navegar pelos links; **só quem tem o código de acesso** cria, edita e apaga links e categorias.
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

### 4. Código de acesso
**Settings → Environment Variables** → adicione:

| Nome | Valor |
| --- | --- |
| `ACCESS_CODE` | uma frase que só vocês dois saibam, ex.: `girassol-azul-2026` |

Use algo comprido: é ele que impede outras pessoas de editar.

### 5. Publicar de novo
**Deployments → ⋯ → Redeploy**. Pronto!

### 6. Nos celulares de vocês
Abra o site → **Ajustes → Entrar para editar** → digite **seu nome** e o **código**. Ele fica salvo, então só é preciso digitar uma vez.
Visitantes não veem botões de adicionar, editar ou apagar, e o servidor recusa qualquer alteração sem o código.
Dica: no Safari use **Compartilhar → Adicionar à Tela de Início** (no Android, menu **⋮ → Instalar app**). O Link Founder abre como um app.

No primeiro acesso o banco é preenchido com os links de exemplo de `api/_lib/seed.ts`. Edite ou apague à vontade pelo próprio site.

---

## Como funciona o compartilhamento

| | Visitante (só o link) | Vocês (com o código) |
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

**Trocar o código:** mude `ACCESS_CODE` na Vercel e faça Redeploy. Os aparelhos de vocês saem do modo edição e pedem o código novo.

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

Sem `ACCESS_CODE`, todo mundo edita localmente. Para testar o modo visitante: `ACCESS_CODE=teste npm run dev`.
Para usar o banco real: `npx vercel link && npx vercel env pull` e depois `npx vercel dev`.

## Estrutura

```
api/                     ← Vercel Functions (rodam no servidor)
  library.ts             ← GET biblioteca (público) · PUT restaurar backup
  links.ts               ← POST salvar link · DELETE apagar
  collections.ts         ← POST salvar coleção · DELETE apagar (com seus links)
  _lib/                  ← banco (Redis/memória), código de acesso, validação, dados iniciais
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
