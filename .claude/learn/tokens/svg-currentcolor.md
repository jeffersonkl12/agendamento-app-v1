---
title: SVGs inline devem usar currentColor
date: 2026-04-07
category: tokens
tags: [svg, colors]
recurrence: media
scope: generic
related:
  - "[[gradients-utility-class]]"
  - "[[figma-svg-preserve-aspect-ratio]]"
  - "[[static-assets-import]]"
sources: []
supersedes: []
superseded_by: []
rules_ref: ["RULES.md#R1", "RULES.md#R10"]
origin: src/components/icons/
---

# SVGs inline devem usar currentColor

**Erro:** `stroke="#3b82f6"` / `fill="#ffffff"` hardcoded em SVGs inline.

```vue
<!-- ❌ -->
<path stroke="#3b82f6" d="M..." />
```

**Correção:** trocar por `currentColor`, controlar cor via classe `text-*` no pai.

```vue
<!-- ✅ src/components/icons/IconArrowRight.vue -->
<template>
  <svg fill="currentColor" ...><path d="M..." /></svg>
</template>
```

```vue
<!-- uso -->
<div class="text-primary">
  <IconArrowRight class="size-4" />
</div>
```

**Por quê:** R1 proíbe hex em cores, mas não menciona SVGs explicitamente. `currentColor` herda do `text-*` do pai e respeita os tokens (R10 — ícone fora do catálogo Phosphor vira SVG em `src/components/icons/` com `fill="currentColor"`).
