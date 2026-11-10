# Curadoria 🔖

Diretório pessoal de links organizado em **coleções** (filtros), com busca, marcadores, favoritos e ordenação.
Visual Apple HIG — branco, azul e cinza-claro, glassmorphism e animações — e **mobile first**.

**Stack:** Vite + React + TypeScript · Motion (animações) · Lucide (ícones) · sem backend.
Hospedagem 100% grátis: código no **GitHub**, deploy automático na **Vercel**.

---

## Rodar no seu computador

```bash
npm install
npm run dev        # abre em http://localhost:5173
npm run build      # gera a pasta dist/
```

Requer Node 18+.

## Publicar (GitHub + Vercel, grátis)

1. Crie um repositório no GitHub (ex.: `curadoria`) e envie o projeto:
   ```bash
   git init && git add . && git commit -m "Curadoria"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/curadoria.git
   git push -u origin main
   ```
2. Em [vercel.com/new](https://vercel.com/new), entre com o GitHub, importe o repositório e clique **Deploy**.
   A Vercel detecta Vite sozinha (o `vercel.json` já está configurado).
3. Pronto. Cada `git push` na `main` publica uma nova versão em ~1 minuto.

---

## Onde ficam os links

Tudo está em **um arquivo só**: [`src/data/library.json`](src/data/library.json).

### Criar um novo "tipo de filtro" (coleção)

Adicione um item em `collections`:

```json
{
  "id": "cursos",
  "name": "Cursos",
  "description": "Plataformas e cursos gratuitos.",
  "icon": "graduation",
  "color": "green"
}
```

- `id`: curto, sem espaços/acentos — é o que os links usam para apontar para a coleção.
- `icon`: um dos nomes em [`src/lib/icons.ts`](src/lib/icons.ts) (`folder`, `github`, `code`, `building`, `briefcase`, `sparkles`, `bot`, `smartphone`, `layout`, `palette`, `pen`, `type`, `book`, `graduation`, `newspaper`, `wrench`, `database`, `cloud`, `globe`, `rocket`, `camera`, `film`, `music`, `gamepad`, `shopping`, `landmark`, `health`, `travel`, `heart`, `star`).
- `color`: `blue`, `indigo`, `purple`, `pink`, `red`, `orange`, `yellow`, `green`, `teal` ou `gray`.

A coleção vira automaticamente um chip de filtro na tela inicial, um card em Coleções e um item na barra lateral.

### Adicionar um site

Adicione um item em `links`:

```json
{
  "id": "coursera",
  "url": "https://www.coursera.org",
  "title": "Coursera",
  "description": "Cursos de universidades, muitos com opção gratuita.",
  "collection": "cursos",
  "tags": ["certificado", "inglês"],
  "addedAt": "2026-11-10",
  "favorite": true
}
```

Só `id`, `url`, `title`, `collection` e `addedAt` são obrigatórios.

### Ou pelo próprio site (sem mexer em código)

1. Use **+ Novo link** e **Nova coleção** no site. Tudo fica salvo no seu navegador na hora.
2. Quando quiser publicar para todos os aparelhos: **Ajustes → Baixar library.json** (ou **Copiar JSON**).
3. No GitHub, abra `src/data/library.json` → ✏️ editar → cole/substitua → **Commit**. A Vercel publica sozinha.
4. Opcional: **Ajustes → Descartar alterações locais** para voltar a ver só o que está publicado.

> O site é estático: o que você cria no navegador não aparece para outras pessoas até ir para o `library.json` no GitHub.

## Atalhos

| Tecla | Ação |
| --- | --- |
| `/` ou `Ctrl/⌘ + K` | Buscar |
| `N` | Novo link |
| `Esc` | Fechar janela / limpar busca |

## Estrutura

```
src/
  data/library.json      ← seus links e coleções
  lib/                   ← tipos, armazenamento, ícones, utilitários
  components/            ← cards, folhas (modais), barra lateral, tab bar
  pages/                 ← Explorar, Coleções, Coleção, Salvos, Ajustes
  styles.css             ← tokens do design (cores, vidro, sombras) e layout
```

Os ícones dos sites vêm do serviço público de favicons do Google; se algum falhar, aparece a inicial colorida.
