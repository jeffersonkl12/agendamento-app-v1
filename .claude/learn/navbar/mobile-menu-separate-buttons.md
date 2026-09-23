---
title: Menu mobile com botões separados (abrir vs fechar)
date: 2026-04-07
category: navbar
tags: [navbar, mobile, accessibility]
recurrence: baixa
scope: generic
related: ["[[navbar-fixed-positioning]]"]
sources: []
supersedes: []
superseded_by: []
rules_ref: ["RULES.md#R13"]
origin: Topbar / menu mobile
---

# Menu mobile com botões separados (abrir vs fechar)

**Erro:** hamburger com toggle (mesmo botão abre e fecha) — fica sobreposto ao overlay fullscreen.

```vue
<!-- ❌ -->
<button @click="isOpen = !isOpen">
  <PhX v-if="isOpen" aria-hidden="true" />
  <PhList v-else aria-hidden="true" />
</button>
```

**Correção:** hamburger fora do overlay (só abre, `invisible` quando aberto). X dentro do overlay (só fecha).

```vue
<!-- ✅ -->
<button @click="open" :class="isOpen ? 'invisible' : ''" aria-label="Abrir menu">
  <PhList aria-hidden="true" />
</button>
<div class="fixed inset-0 z-50">
  <button @click="close" aria-label="Fechar menu">
    <PhX aria-hidden="true" />
  </button>
</div>
```

**Por quê:** evita conflito de stacking entre botão e overlay e dá foco/keyboard semantics mais claros. Botão só-ícone precisa de `aria-label` (R10/R13), já que `PhList`/`PhX` não têm nome acessível.
