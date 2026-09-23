---
title: SVG export Figma — preserveAspectRatio não pode ser none
date: 2026-05-04
category: tokens
tags: [svg, css]
recurrence: alta
scope: generic
related: ["[[svg-currentcolor]]", "[[static-assets-import]]"]
sources: []
supersedes: []
superseded_by: []
rules_ref: ["RULES.md#R10"]
origin: ícones extraídos do Figma para src/components/icons/{Nome}.vue
---

# SVG export Figma — preserveAspectRatio não pode ser none

**Erro:** raiz `<svg>` vinda do Figma com `preserveAspectRatio="none"` e `width="100%" height="100%"`. Em `<img>` ou container com proporção diferente do `viewBox`, o vetor **estica** em X e Y de forma independente (logo/ícone “distorcido”).

```svg
<!-- ❌ -->
<svg preserveAspectRatio="none" width="100%" height="100%" viewBox="0 0 173 40" ...>
```

**Correção:** usar escala uniforme e tirar o forçar 100% na raiz do arquivo (tamanho vem do CSS/`width`/`height` no uso).

```svg
<!-- ✅ -->
<svg viewBox="0 0 173 40" preserveAspectRatio="xMidYMid meet" overflow="visible" ...>
```

Em componentes Vue de ícone (`src/components/icons/`), declarar no `<svg>` raiz:

```vue
<template>
  <svg viewBox="..." preserveAspectRatio="xMidYMid meet" fill="currentColor" ...>
    <path d="..." />
  </svg>
</template>
```

**Por quê:** `none` desliga o aspect ratio do SVG; `xMidYMid meet` é o comportamento padrão do SVG quando `none` não está definido — encaixa o `viewBox` inteiro sem deformar. Combina com `object-contain` em `<img>` quando as dimensões do box não batem com o `viewBox`.

**Escopo no repo:** ajuste aplicado nos ícones extraídos pra `src/components/icons/` (R10) e nas imagens SVG em `src/assets/images/{page}/` usadas via `<img>`.
