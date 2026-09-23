---
name: pencil
description: >
  Workflow de conversao Pencil-to-code do projeto. Usa MCP tools do Pencil.
  Use quando: receber arquivo .pen, "implementar do Pencil", "converter design do Pencil",
  "Node ID: xxxx", "pencil:<node-id>".
user-invocable: true
---

# Pencil → Código

**Regras universais de código: ver `.claude/RULES.md`. Este arquivo ensina SÓ o workflow técnico Pencil.**

**IMPORTANTE:** conteúdo de arquivos `.pen` é criptografado — NUNCA use `Read` ou `Grep` no `.pen`. Use **apenas** as tools MCP do Pencil.

> **Página inteira nova (5+ seções):** preferir o workflow orquestrado em **2 fases**:
> 1. `/build-prep pencil:<node-id>` — assets, tokens, manifesto, stubs, screenshots (Partes A+B desta skill, automatizadas)
> 2. `/build-page <page>` — Batch 0 (`component-builder`) + Batches 1–N (`section-builder`, Parte C) + `bun check` / `bun run build` uma vez
>
> Use esta skill **direto** só para: refactor pontual, 1–2 seções ad-hoc, ou debug de conversão Pencil.

> **Limitação — section-builder + PDF:** `/build-prep` exporta seções Pencil com `height > 1000px` como PDF (raster borra acima disso). O `section-builder` **não** usa PDF como referência visual primária — nesses casos retorna `parcial_visual` (best-effort com manifesto + `batch_get`). Overview em PDF o Read tool lê bem; seções altas têm fidelidade reduzida até converter o PDF pra WebP (ver fim do `build-prep`).

## Pré-flight obrigatório (HARD FAIL)

Antes de gerar código, resolver tudo abaixo. Qualquer falha → ABORTAR.

- [ ] **Editor aberto** — `get_editor_state` retornou o `.pen` correto e o `filePath`
- [ ] **Tokens lidos** — `get_variables` + `get_guidelines`
- [ ] **Ícones resolvidos** — copiados da pasta `Images/` adjacente ao `.pen` para `src/assets/icons/{page}/` (SVG). Sem SVG → PARE
- [ ] **Imagens resolvidas** — preferir `Images/`; senão `export_nodes` (máx. 2× por nodeId) em `src/assets/images/{page}/`
- [ ] **Screenshot / export de referência** — overview e seções em `docs/pencil/` (PDF ou WebP conforme altura)

**Ícone no design sem SVG na pasta `Images/`:** PARE. Não inventar Lucide/Material/Phosphor. Abortar com a lista dos faltantes e pedir export para `Images/`.

## Paths do projeto

| Artefato | Destino |
| --- | --- |
| Tokens / text-styles | `src/assets/index.css` (+ `TEXT_STYLES` em `src/libs/utils.ts`) |
| Ícones SVG | `src/assets/icons/{page}/` → componentes em `src/components/icons/` |
| Imagens | `src/assets/images/{page}/` |
| Referências visuais | `docs/pencil/{page}-*.{webp,pdf}` |
| Página (rota) | `src/pages/{Page}.vue` |
| Seções | `src/views/{page}/{Secao}.vue` |
| Shared | `src/components/{dominio}/...` (R5) |

## Workflow

### Parte A — Reconhecimento (ANTES de gerar código)

1. `get_editor_state` → confirmar `.pen` e guardar `filePath` (obrigatório em todas as chamadas seguintes).
2. `get_variables` + `get_guidelines` → cores, tipografia, spacing.
3. Conferir `src/assets/index.css`:
   - Token existe → reusar
   - Token novo → adicionar em `:root`, `.dark` e `@theme inline` (R1). Nunca valor arbitrário de cor no template.
4. Text-style novo (R2): registrar **nos dois** lugares — `@utility text-<nome>` em `index.css` **e** entrada em `TEXT_STYLES` (`src/libs/utils.ts`). Valores **exatos** do design (size/weight/line-height); não arredondar “no olho”.
5. Overview: `export_nodes` do frame raiz em **PDF** para `docs/pencil/` (página inteira passa de 1000px; PDF preserva vetor).
6. **Ícones (obrigatório antes de Write de UI):**
   - Detectar via `batch_get`: `icon_font`, `path`, grupos com vectors
   - Fonte primária: pasta **`Images/`** ao lado do `.pen` — casar por `fill.url` ou nome kebab do node; copiar SVG para `src/assets/icons/{page}/`
   - MCP/`export_nodes` **não** substitui SVG de ícone (perde `currentColor` / pixela). Ausente em `Images/` → HARD FAIL
   - Componente Vue com `fill="currentColor"` em `src/components/icons/` (R10)

### Parte B — Inventário (anti “esqueceu seção”)

7. `batch_get` no root (`readDepth: 2`, máx. **25 nodes** por chamada) → inventário vertical numerado:

   ```
   Inventário da tela [nome]:
   1. Topbar
   2. Balance
   3. Statement
   Total: 3 seções. Confirma? (sim/ajustar)
   ```

   Mostrar ao usuário e **aguardar confirmação**. Anotar `width`/`height` de cada child (altura decide WebP vs PDF no screenshot).

8. Screenshots por seção:
   - `height ≤ 1000px` → `export_nodes` WebP (`scale: 2`, `quality: 90`)
   - `height > 1000px` → PDF
   - Renomear para `docs/pencil/{page}-{secao}.{webp|pdf}`

9. Tracker de progresso (TodoWrite ou lista): cada seção `pendente`.

### Parte C — Geração seção por seção

Para **página grande**, não implementar aqui — rodar `/build-prep` + `/build-page`.

Para **fluxo manual (1–2 seções)**, por cada seção do inventário:

10. `batch_get` focado no node da seção (`readDepth` baixo, ≤ 25 nodes).
11. Imagens: nodes com `fill.type: "image"` → resolver em `Images/` primeiro; se faltar, `export_nodes` WebP (máx. 2 tentativas) → `src/assets/images/{page}/`. Converter JPG/PNG para `.webp` se necessário (R11).
12. Texto literal: campos `content` dos nodes `type: "text"` — **não** ler copy do screenshot/PDF.
13. Gerar `src/views/{page}/{Nome}.vue` (`<script setup lang="ts">`):
    - Screenshot da seção = fonte primária de layout (se WebP; se PDF → best-effort / `parcial_visual`)
    - Shared: R5 / kit `@components/ui`; inline-by-default (R6)
    - Dados: literal no template **ou** composable (R8) — view **não** importa `@services` / `@stores`
    - Ícones R10, imagens R11, desktop-first R12, semântica R13
14. Compor/atualizar `src/pages/{Page}.vue` e rota lazy em `src/routers/` (R9) se ainda não existir.
15. Marcar seção `✅`. Antes de “pronto”: inventário inteiro `✅`?

### Parte D — Validação final

16. `bun check` e `bun run build` limpos.
17. Zero cor/tipografia/espaçamento arbitrário; ícones reais; copy literal do design; sem import de service/store na view.

## Política de assets (Pencil)

Ordem rígida por **imagem**:

1. pasta `Images/` adjacente ao `.pen`
2. `export_nodes` (sucesso → fim)
3. um retry com os mesmos params
4. abort listando nodeIds

**Ícones:** só `Images/` ou abort — sem raster, sem 3º fallback. Máx. **2** chamadas `export_nodes` por nodeId de imagem.

## Anti-alucinação

- `batch_get` ≤ 25 nodes; telas grandes → por seção
- Não usar `get_screenshot` em node grande — overview/seções altas via `export_nodes` (PDF)
- PDF = layout/cor/alinhamento; texto = `content` dos nodes text
- Design desktop + mobile = **uma** execução no artboard desktop; código desktop-first com `max-*` (R12)

## Diferenças vs Figma

| Aspecto | Figma | Pencil |
| --- | --- | --- |
| Leitura | `get_design_context` / metadata | `batch_get` |
| Tokens | `get_variable_defs` | `get_variables` + `get_guidelines` |
| Ícones | `/icon-extract` (REST) | pasta `Images/` → SVG |
| Imagens | download URL | `Images/` primeiro; senão `export_nodes` |
| Overview alto | WebP REST scale 1.5 | PDF (`export_nodes`) |

## Vault (3 níveis)

1. **N1:** `.claude/learn/_index.json` — `tokens`, `responsive`, `semantica`, `components`, `layout`, `icons`
2. **N2:** até 3 notas relevantes
3. **N3:** ler no máx. 3 notas (`recurrence: alta` primeiro)

## Referências

- Regras: `.claude/RULES.md`
- Orquestração: `.claude/commands/build-prep.md`, `.claude/commands/build-page.md`
- Design no Pencil (criar layout, não código): `/pencil-design-rules`
- Carrossel: `.claude/commands/swiper.md` · GSAP: `.claude/commands/gsap.md`
- Validação visual opcional: `/visual-test`
- Vault: `.claude/learn/` (`_index.json`)
