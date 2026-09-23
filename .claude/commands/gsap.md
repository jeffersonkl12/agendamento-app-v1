# GSAP — Instruções de Animação

## Stack

- **GSAP** 3.x + **ScrollTrigger** (já em `package.json`)
- Vue 3 Composition API (`<script setup lang="ts">`)
- API declarativa via **data-attributes**
- Sem `@gsap/react` — o lifecycle é Vue (`onMounted` / `onBeforeUnmount` + `gsap.context`)

## Arquivo central

`src/libs/gsap.ts` — registra ScrollTrigger uma vez, define presets e exporta os composables de animação.

Se o arquivo ainda não existir, criar na primeira animação da página (não no `/build-prep`).

## Data-attributes

| Atributo | Comportamento |
| --- | --- |
| `data-animate="fadeUp"` | Scroll reveal (ScrollTrigger) |
| `data-load="fadeIn"` | Animação imediata (above the fold) |
| `data-stagger="scaleUp"` | Anima children com stagger (ScrollTrigger) |
| `data-delay="0.2"` | Delay em segundos |
| `data-gap="0.12"` | Gap do stagger entre children |
| `data-duration="0.5"` | Duração customizada |
| `data-start="top 90%"` | ScrollTrigger `start` customizado |

## Presets

```ts
fadeUp      // opacity: 0, y: 30
fadeDown    // opacity: 0, y: -12
fadeIn      // opacity: 0
slideRight  // opacity: 0, x: -30
slideLeft   // opacity: 0, x: 30
scaleUp     // opacity: 0, scale: 0.92
```

## Composables

### `useAnimations()` — principal

Retorna um `Ref` de scope. No `onMounted`, processa `data-animate`, `data-stagger` e `data-load` dentro do scope. No `onBeforeUnmount`, chama `ctx.revert()`.

```vue
<script setup lang="ts">
import { useAnimations } from '@libs/gsap'

const scope = useAnimations()
</script>

<template>
  <section ref="scope">
    <div data-animate="fadeUp">
      Scroll reveal
    </div>
    <div data-load="fadeIn" data-delay="0.2">
      Imediato
    </div>
    <div data-stagger="fadeUp" data-gap="0.1">
      <div>Child 1</div>
      <div>Child 2</div>
    </div>
  </section>
</template>
```

### `useParallax(el, toVars, opts?)` — scrub no scroll

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useParallax } from '@libs/gsap'

const imgRef = useTemplateRef<HTMLElement>('img')
useParallax(imgRef, { y: -50 })
</script>

<template>
  <img ref="img" src="..." alt="...">
</template>
```

### `useTransition(el)` — troca de tab/conteúdo

```ts
const contentRef = useTemplateRef<HTMLElement>('content')
const { play } = useTransition(contentRef)

function onTabChange(next: string) {
  play(() => {
    activeTab.value = next
  })
}
```

### `useAccordion(isOpen)` — expand/collapse

```vue
<script setup lang="ts">
import { useAccordion } from '@libs/gsap'

const props = defineProps<{ open: boolean }>()
const bodyRef = useAccordion(() => props.open)
</script>

<template>
  <div ref="bodyRef">
    Conteúdo
  </div>
</template>
```

## Regras

1. Sempre `useAnimations()` + data-attributes para reveal/load/stagger
2. `ref="scope"` no elemento raiz da seção ou do bloco animado
3. Hover simples → CSS (`transition-transform`, `hover:scale-[1.02]`, etc.) — não GSAP
4. Parallax, tabs e accordion → composables específicos acima
5. Presets cobrem a maioria dos casos — evitar `gsap.to` / `gsap.from` soltos na view
6. Cleanup obrigatório via `gsap.context(...).revert()` no unmount (o composable faz isso)
7. Não usar Motion / Framer (`motion`, `whileInView`, etc.)

## Vite

`gsap` já está nas dependencies. Não precisa de `ssr.noExternal` (SPA Vite, sem SSR). Se o ScrollTrigger falhar no HMR, garantir o register uma única vez em `src/libs/gsap.ts`:

```ts
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
```
