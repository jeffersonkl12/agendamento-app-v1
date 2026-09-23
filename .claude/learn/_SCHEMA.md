# _SCHEMA.md — Vocabulário fechado e frontmatter

Este arquivo é o **contrato de validação** do vault. O hook `learn-index.mjs` lê os enums daqui e bloqueia notas que violam.

## Categorias (= subpastas)

`/learn` exige uma destas. Categoria nova só por aprovação humana (editar este arquivo + criar pasta).

```yaml
categories:
  - tokens         # cores, tipografia, gradientes, design-system
  - icons          # SVG, icon-extract, anti-Lucide
  - responsive     # breakpoints, viewport, max-*
  - semantica      # HTML, links, headings, a11y
  - gsap           # animações, ScrollTrigger, cleanup
  - navbar         # navbar, menu mobile, fixed positioning
  - components     # extração, DRY, props
  - layout         # estrutura de página, container, flow
  - outros         # válvula de escape; dream propõe split quando ≥3 notas
```

## Tags (vocab fechado, lowercase, kebab-case)

`/learn` valida cada tag. Tag nova → aprovação humana inline (adicionar aqui).

```yaml
tags:
  # tokens / styling
  - svg
  - colors
  - gradients
  - css
  - tailwind
  # links / semantics
  - links
  - placeholders
  - semantics
  # nav
  - navbar
  - mobile
  - accessibility
  # components
  - components
  - refactor
  - dry
  # assets
  - images
  # animation
  - animation
  - scroll-trigger
  # layout
  - layout
  - responsive
```

## Enums

```yaml
recurrence: [baixa, media, alta]
scope: [generic, project]
```

## Frontmatter (cada nota DEVE ter)

```yaml
---
title: string                     # OBRIGATÓRIO; descritivo curto
date: YYYY-MM-DD                  # OBRIGATÓRIO; ISO
category: <um de categories>      # OBRIGATÓRIO; bate com pasta pai
tags: [tag1, tag2]                # OBRIGATÓRIO; ≥1; todas no vocab
recurrence: <baixa|media|alta>    # OBRIGATÓRIO
scope: <generic|project>          # OBRIGATÓRIO
project: string                   # OBRIGATÓRIO se scope=project
related: ["[[outra-nota]]"]       # opcional; cross-refs (mantido bidir pelo /learn)
sources: ["git:abc123", "PR#42"]  # opcional; raw sources
supersedes: ["[[antiga]]"]        # opcional; substituída por esta
superseded_by: ["[[nova]]"]       # opcional; auditoria reversa
rules_ref: ["RULES.md#R7"]        # opcional; regra crítica de ícones
origin: string                    # opcional; página/componente
---
```

## Validações que o hook aplica

1. Frontmatter parseável (YAML).
2. Todos os campos obrigatórios presentes.
3. `category` bate com a pasta-pai do arquivo (`learn/{category}/{slug}.md`).
4. `category` está em `categories`.
5. Toda `tag` está em `tags`.
6. `recurrence` está em `[baixa, media, alta]`.
7. `scope` está em `[generic, project]`.
8. Se `scope=project`, campo `project:` existe e não é vazio.
9. `related`, `supersedes`, `superseded_by` são listas de strings (sem checagem se a nota referenciada existe — `dream` faz lint disso).

Falha em qualquer validação → exit code 2 + mensagem no stderr (Claude e usuário veem).

## Convenções de slug

- Inglês, kebab-case, estável (não renomear depois).
- Frase descritiva (`svg-currentcolor`, não `svg-fix-1`).
- Sem data no nome (data está em `date:`).
