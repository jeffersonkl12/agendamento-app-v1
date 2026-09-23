---
title: Imagens estáticas — import por alias, sem transformador no build
date: 2026-05-04
category: tokens
tags: [images, svg]
recurrence: alta
scope: generic
related:
  - "[[figma-svg-preserve-aspect-ratio]]"
  - "[[svg-currentcolor]]"
sources: []
supersedes: []
superseded_by: []
rules_ref:
  - "RULES.md#R10"
  - "RULES.md#R11"
origin: src/assets/images/{page}/*.webp, src/assets/icons/{page}/*.svg
---

# Imagens estáticas — import por alias, sem transformador no build

**Padrão (raster):** arquivo já entregue otimizado em `.webp` (R11) — o projeto **não** tem transformador de imagem no build (sem imagetools/sharp em runtime). Import direto por alias devolve a URL com hash; `<img>` leva `:src`, `alt` descritivo em PT-BR (**obrigatório**; **proibido** `alt=""` por omissão) e dimensão **só via CSS** (`class`), nunca atributo `width`/`height` inline. `loading="lazy"` abaixo da dobra.

Camadas só visuais (ex.: overlay CSS) podem levar `aria-hidden` no nó certo; a fotografia com significado **não** deve ficar escondida de leitores de tela só pra "decorar".

## Raster

```vue
<script setup lang="ts">
import heroBg from '@assets/images/wallet/hero.webp'
</script>

<template>
  <img
    :src="heroBg"
    alt="Descrição PT-BR do conteúdo ou função da imagem na tela."
    class="absolute inset-0 h-full w-full object-cover"
    loading="lazy"
  >
</template>
```

Errado / certo:

```vue
<!-- ❌ dimensão como atributo inline, compete com o CSS -->
<img :src="heroBg" :width="1920" :height="1080" alt="…">

<!-- ❌ alt vazio — remove a imagem da leitura assistiva sem marcar como decorativa -->
<img :src="heroBg" alt="">

<!-- ✅ -->
<img :src="heroBg" alt="…" class="h-[400px] w-full object-cover">
```

Se o original vier em `.jpg`/`.png`, converter pra `.webp` **no prep** (`sharp`, ver `build-prep.md` Passo 6) — não no build.

## SVG como imagem de conteúdo (`<img>`)

```vue
<script setup lang="ts">
import divider from '@assets/images/wallet/divider.svg'
</script>

<template>
  <img :src="divider" alt="Linha separadora entre blocos do extrato." class="block max-h-px w-full">
</template>
```

Raiz do SVG: [[figma-svg-preserve-aspect-ratio]].

## SVG como componente de ícone

Ícone extraído do design vira componente em `src/components/icons/` (R10), não import de imagem. Dimensão do ícone: classe Tailwind no uso (`size-4`, `size-5`), nunca prop de tamanho custom.

```vue
<script setup lang="ts">
import { PhCaretDown } from '@phosphor-icons/vue'
import IconBrandLogo from '@components/icons/IconBrandLogo.vue'
</script>

<template>
  <PhCaretDown class="size-4" aria-hidden="true" />
  <IconBrandLogo class="size-6" aria-hidden="true" />
</template>
```

Ícone do catálogo Phosphor primeiro (R10); SVG customizado só pra marca/ilustração fora do catálogo. Cores: [[svg-currentcolor]].
