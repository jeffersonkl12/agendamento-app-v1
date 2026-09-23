# Carousel — Embla (shadcn-vue)

Usar quando o layout tiver slider/carrossel. Neste template o carrossel padrão é **`@components/ui/carousel`** (Embla via `embla-carousel-vue`) — não Swiper.

Regra do kit: ver `.claude/RULES.md` (bibliotecas padrão → Carrossel).

## Import

```ts
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@components/ui/carousel'
```

## Padrão básico

```vue
<script setup lang="ts">
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@components/ui/carousel'
</script>

<template>
  <Carousel
    :opts="{ align: 'start', loop: false }"
    class="w-full"
  >
    <CarouselContent>
      <CarouselItem
        v-for="item in items"
        :key="item.id"
        class="basis-auto max-w-[320px]"
      >
        <!-- conteúdo do slide -->
      </CarouselItem>
    </CarouselContent>
    <CarouselPrevious />
    <CarouselNext />
  </Carousel>
</template>
```

## Opções comuns (`opts`)

| Opção | Uso |
| --- | --- |
| `align: 'start'` | slides encostados à esquerda (padrão de listagens) |
| `loop: true` | loop infinito quando o design pede |
| `dragFree: true` | arraste livre (menos “snap”) |
| `slidesToScroll: 1` | quantos avançam por clique nas setas |

Largura do slide: preferir utilitários Tailwind (`basis-1/2`, `md:basis-1/3`, `basis-auto` + `max-w-[...]`). Valor arbitrário de dimensão só quando veio do design e não há token (R1).

## API / controle externo

O root expõe a API Embla. Para sync com estado da feature, preferir o composable de domínio (R8) — a view não fala com service/store direto.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { CarouselApi } from '@components/ui/carousel'

const api = ref<CarouselApi>()

function onInit(value: CarouselApi) {
  api.value = value
}
</script>

<template>
  <Carousel @init-api="onInit">
    <!-- ... -->
  </Carousel>
</template>
```

`useCarousel()` (interno do kit) serve aos subcomponentes do carousel; na page/view use o evento `init-api` ou o slot scope do `Carousel` quando precisar de `scrollNext` / `scrollPrev`.

## Não faça

- Instalar ou usar **Swiper** — o kit já cobre com Embla
- `ref` + `scrollBy` / scroll-snap custom como substituto de carrossel — quebra gesture, foco e manutenção
- Importar `embla-carousel-vue` direto na view quando o wrapper `@components/ui/carousel` resolve

## A11y

O `Carousel` já define `role="region"`, `aria-roledescription="carousel"` e setas de teclado. Em slides clicáveis/links, manter foco visível e não remover o `tabindex` do root sem motivo.

## Responsive

Desktop-first (R12): variar `basis-*` / `max-w-*` com `max-md:` etc. Contagem de slides visíveis muda pela largura do item, não por API de breakpoints do Swiper.
