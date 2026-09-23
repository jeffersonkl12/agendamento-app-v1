# log.md — Histórico cronológico do vault

Append-only. Prefixo parseável `## [YYYY-MM-DD] op | título`.
Operações: `ingest` (criar/atualizar nota), `lint` (passagem do `/dream`), `reorg` (movimentação manual), `promote` (lição → RULES.md).

Útil pro agente: `rg "^## \[" .claude/learn/log.md | tail -10` mostra atividade recente em uma chamada.

---

## [2026-04-07] ingest | svg-currentcolor — created (tokens/)
## [2026-04-07] ingest | gradients-utility-class — created (tokens/)
## [2026-04-07] ingest | href-placeholder — created (semantica/)
## [2026-04-07] ingest | navbar-fixed-positioning — created (navbar/)
## [2026-04-07] ingest | mobile-menu-separate-buttons — created (navbar/)
## [2026-04-08] ingest | duplicate-component-extraction — created (components/)
## [2026-04-08] ingest | directus-image-and-visual-editing — created (directus/)
## [2026-05-04] reorg | migrated 7 notes from flat layout to category folders + bidirectional cross-refs
## [2026-05-04] reorg | RULES.md slim: 14→13 rules; former R4 folded into R1; Swiper details → commands/swiper.md; full R renumber R1–R13; container viewport note → responsive/container-intermediate-viewports.md
## [2026-05-04] ingest | figma-svg-preserve-aspect-ratio — created (tokens/) + bidir ref em svg-currentcolor
## [2026-05-04] ingest | static-assets-import-jsx — JPG/PNG/SVG (?url vs .jsx), sem SVGR; refs em figma-svg, svg-currentcolor, directus-image
## [2026-05-04] ingest | static-assets-import-jsx — vite-imagetools (query w|h, WebP q90, default export URL string; plugin order vs optimizer); errado/certo vs .src
## [2026-05-04] ingest | static-assets-import-jsx + RULES R6 — padrão imagetools; width/height literais no `<img>` (sem const de layout); rules_ref
## [2026-05-04] ingest | R6 + static-assets — sem width/height no `<img>` raster; só `?w`|`?h` + CSS do box
## [2026-05-04] ingest | R6/R10 + screens — `alt` PT obrigatório; sem `sizes`/`decoding` por defeito; VanteFooter alts
## [2026-05-05] reorg | cleanup vante project: deletadas páginas/screens/assets/fontes/tokens; lições generalizadas (paths `vante/` → `projeto/`)
## [2026-05-20] ingest | group-tabs-special-group-flag — created (directus/) + gate em validate-directus-schema + docs build-cms/build-prep/directus.md
## [2026-08-21] reorg | vault adaptado de stack antiga (Astro/JSX/Directus) pra wallet-app-v1 (Vue 3 + shadcn-vue + Tailwind v4); removida categoria directus/ (CMS não usado no projeto) + tags cms/visual-editing; static-assets-import-jsx renomeada pra static-assets-import; exemplos e rules_ref das notas restantes atualizados pra sintaxe Vue e numeração atual de RULES.md
