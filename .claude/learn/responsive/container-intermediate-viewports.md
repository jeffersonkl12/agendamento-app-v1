---
title: Containers em viewports intermediários 1180–1792px
date: 2026-05-04
category: responsive
tags: [responsive, layout, tailwind]
recurrence: media
scope: generic
related: []
sources: []
supersedes: []
superseded_by: []
rules_ref: ["RULES.md#R12"]
origin: Delta antigo de RULES.md (atenção sob responsive desktop-first); promovido a nota de vault na consolidação 2026-05.
---

# Containers em viewports intermediários 1180–1792px

**Erro:** revisar página só nos breakpoints triviais e pular ~1180px–1792px — faixa onde `.container` com max-width pode parecer certo nos tokens mas ficar espremido (padding lateral pouco perceptível antes de bater no max).

```html
<!-- Situação a inspecionar com o navegador nessa faixa -->
<div class="container">...</div>
```

**Correção:** sempre inspecionar 1180–1792px quando o shell usa `.container`; ajustar a configuração do `.container` em `src/assets/index.css` (`@theme` / `@utility`), não dispersar max-w ou padding mágicos por página.

```html
<!-- Mantém R12 — continua usando .container; mexe na definição global -->
<div class="container flex flex-col ...">...</div>
```

**Por quê:** centralizar o `.container` num único lugar em `index.css` evita max-w/padding divergentes por página; esse gap é comportamental QA, não exceção de token por seção (R12).

