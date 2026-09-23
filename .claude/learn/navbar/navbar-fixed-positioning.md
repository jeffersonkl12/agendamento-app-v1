---
title: Navbar precisa ser fixed top-0
date: 2026-04-07
category: navbar
tags: [navbar, layout]
recurrence: baixa
scope: generic
related: ["[[mobile-menu-separate-buttons]]"]
sources: []
supersedes: []
superseded_by: []
rules_ref: []
origin: Topbar
---

# Navbar precisa ser fixed top-0

**Erro:** Topbar com posição estática — rola junto com a página.

```vue
<!-- ❌ -->
<nav class="h-20 w-full">
```

**Correção:** `fixed top-0 left-0 w-full z-50` + spacer/padding-top no conteúdo abaixo.

```vue
<!-- ✅ -->
<nav class="fixed top-0 left-0 z-50 h-20 w-full">
```

**Por quê:** o design exige navbar persistente; sem `fixed` ela some no scroll. Lembrar do offset no conteúdo seguinte.
