# wallet-app-v1

Template para iniciar SaaS em SPA — Vue 3 + TypeScript.

## Tecnologias principais

- **Vue 3** (`<script setup>`) + **TypeScript** strict
- **Vite** + **bun**
- **Tailwind CSS v4** (config em `src/assets/index.css`, sem `tailwind.config.js`)
- **shadcn-vue** sobre primitivas **reka-ui**
- **Pinia** + **vue-router**
- **Biome** (lint + formatter)
- **Phosphor Icons**, **GSAP**, **Embla Carousel**, **vee-validate** + **zod**

## Comandos

```bash
bun install       # instala dependências
bun dev            # servidor de desenvolvimento
bun run build       # type-check (vue-tsc) + build de produção
bun run preview     # preview do build
bun check           # lint + format check (Biome)
bun format          # aplica lint + format (Biome)
```

## Fluxo do projeto

```
routers → layouts → pages → views (seções) → components/<dominio> → components/ui
```

Conteúdo de página é estático por padrão: constantes tipadas em `src/data/<dominio>.ts`, importadas direto pelas views.

Página nova nasce em duas fases a partir de um design (Figma ou Pencil):

1. `/build-prep <url-figma | pencil:<node-id>>` — extrai assets, tokens, ícones e gera o manifesto da página
2. `/build-page <page>` — implementa componentes e seções a partir do manifesto

**Toda regra de código do projeto vive em [`.claude/RULES.md`](./.claude/RULES.md)** — única fonte da verdade (tokens, aliases, anatomia de componente, dados, ícones, imagens, responsivo, semântica). Ver [`CLAUDE.md`](./CLAUDE.md) para o guia de contribuição com IA.
