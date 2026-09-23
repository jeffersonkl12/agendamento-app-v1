---
title: Gradientes em classe utilitária, nunca inline
date: 2026-04-07
category: tokens
tags: [gradients, css, tailwind]
recurrence: media
scope: generic
related: ["[[svg-currentcolor]]"]
sources: []
supersedes: []
superseded_by: []
rules_ref: ["RULES.md#R1"]
origin: Wallet / Balance — fundo em gradiente do card
---

# Gradientes em classe utilitária, nunca inline

**Erro:** `:style="{ background: 'radial-gradient(...)' }"` com cor hardcoded no template.

```vue
<!-- ❌ -->
<div :style="{ background: 'radial-gradient(ellipse, oklch(0.5 0.134 242.749 / 0.3), transparent)' }" />
```

**Correção:** criar utilitário `@utility bg-{nome}-gradient` em `src/assets/index.css` usando `var(--token)` (mesmo padrão dos text-styles, R1/R2).

```css
/* ✅ src/assets/index.css */
@utility bg-balance-gradient {
  background: radial-gradient(ellipse at center, oklch(from var(--primary) l c h / 30%), transparent);
}
```

**Por quê:** centraliza o gradiente no design system, respeita tokens (R1) e fica reutilizável.
