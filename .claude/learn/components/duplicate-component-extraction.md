---
title: Componente em 2+ telas extrai já na primeira
date: 2026-04-08
category: components
tags: [components, refactor, dry]
recurrence: media
scope: generic
related: []
sources: []
supersedes: []
superseded_by: []
rules_ref: ["RULES.md#R6"]
origin: Team / TeamCard em views Leadership + Team
---

# Componente em 2+ telas extrai já na primeira

**Erro:** mesmo card (ex.: `TeamCard`) com marcação quase idêntica repetida inline em duas views, mesmo já sabendo que vai aparecer nas duas.

```vue
<!-- ❌ src/views/team/Leadership.vue -->
<template>
  <div v-for="p in leaders" :key="p.id" class="flex flex-col gap-2 rounded-lg bg-card p-6">
    <!-- mesma marcação -->
  </div>
</template>

<!-- ❌ src/views/team/Team.vue -->
<template>
  <div v-for="p in members" :key="p.id" class="flex flex-col gap-2 rounded-lg bg-card p-6">
    <!-- idem, copiada de novo -->
  </div>
</template>
```

**Correção:** se já se sabe que o card aparece em 2+ views, extrair pra `src/components/<dominio>/<componente>/` na primeira implementação (R5/R6), não esperar a segunda cópia pra refatorar.

```
✅ src/components/team/team-card/
  TeamCard.vue
  index.ts
```

**Por quê:** "refatorar depois" cobra juros — divergência de marcação entre cópias gera bugs sutis e dobra o trabalho de design. R6 fixa o gatilho em 2 consumidores; quando isso já é sabido de antemão, não faz sentido esperar a cópia acontecer pra só então extrair.
