---
name: gsap
description: >
  Skill de animacao com GSAP 3.x + ScrollTrigger via API declarativa (data-attributes).
  Use quando: implementar animacoes, efeitos de scroll, transicoes, parallax,
  fade in, stagger, accordion, tabs, "animar", "scroll effect", "parallax",
  "animacao", "gsap", "scroll trigger", "data-animate", "useAnimations".
user-invocable: true
---

# GSAP — Skill de Animação

Leia as instruções completas em `.claude/commands/gsap.md` antes de implementar animações.

## Resumo rápido

- **API declarativa**: data-attributes (`data-animate`, `data-load`, `data-stagger`)
- **Composable principal**: `useAnimations()` de `@libs/gsap` — retorna ref de scope
- **Presets**: `fadeUp`, `fadeDown`, `fadeIn`, `slideRight`, `slideLeft`, `scaleUp`
- **Extras**: `useParallax`, `useTransition`, `useAccordion`
- **Hover**: CSS transitions, não GSAP
- **Stack**: Vue 3 + TypeScript; cleanup com `gsap.context().revert()` no unmount
- **NUNCA** usar Motion / Framer (`motion`, `whileInView`, etc.)
- **NUNCA** preferir `gsap.to/from` solto na view — presets cobrem a maioria dos casos
