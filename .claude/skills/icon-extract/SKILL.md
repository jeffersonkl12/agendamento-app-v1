---
name: icon-extract
description: >
  Extracts real SVG icons from Figma files using the REST API, solving the common
  problem where Claude invents icons (e.g. Material Icons) instead of using the
  actual SVGs from the design. Use this skill whenever implementing a Figma layout
  that contains icons, when the user mentions icons not matching the design, when
  you see icon components/instances in Figma metadata, or when converting Figma
  designs to code and you need the actual SVG assets. Also trigger when the user
  says "icons are wrong", "wrong icon", "don't invent icons", "use the real icons
  from Figma", or any variation. This skill should ALWAYS be used before falling
  back to any icon library (Material Icons, Lucide, Heroicons, etc.).
user-invocable: true
---

# Figma Icon Extractor v2

## The Problem

When converting Figma designs to code, Claude invents icons from known libraries (Material Icons, Lucide, Heroicons). These look completely different from the actual design. The Figma MCP tools return icon **names** but not SVG data.

## The Solution

This script uses the **Figma REST API** to:
1. Fetch the node tree from specific screens
2. Find icon **INSTANCE** nodes (the actual icon components, not sub-vectors)
3. Export them as real SVGs via `/v1/images?format=svg`
4. Save as individual `.svg` files or `<symbol>` elements in an SVG sprite

Key improvement over v1: only detects INSTANCE nodes (real icon components) instead of raw VECTORs/ELLIPSEs (which are icon fragments).

## Prerequisites

- **Figma Personal Access Token** (`FIGMA_TOKEN` env var)
- **Node.js 18+** (for native `fetch`)

## Quick Start

### Step 1: Get the token

```bash
export FIGMA_TOKEN="figd_xxxxx"
```

### Step 2: Extract icons from Figma screen(s)

```bash
# Single screen
node .claude/skills/icon-extract/extract-icons.mjs \
  --url "https://www.figma.com/design/<fileKey>/<name>?node-id=<nodeId>" \
  --output ./public \
  --format both \
  --verbose

# Multiple screens at once
node .claude/skills/icon-extract/extract-icons.mjs \
  --file-key ABC123 \
  --node-id "123:456,789:012,345:678" \
  --output ./public \
  --format symbols \
  --append
```

### Step 3: Use in code

**Padrão único deste projeto** (vite-plugin-svgr ativo em `astro.config.mjs`): `?react` import.

#### Como componente React (recomendado — `?react` via svgr)
```jsx
import EditIcon from 'assets/icons/projeto/edit-02.svg?react'

function MyComponent() {
  return <EditIcon className="w-5 h-5 text-primary" aria-hidden="true" />
}
```

`className`, `width`, `height`, `aria-*` passam direto como props. `currentColor` no SVG respeita a `text-{cor}` do pai.

#### Quando usar `?url` em vez de `?react`
Pra `background-image` em CSS, `<img src>` de logo decorativo, ou `<a href>` de download:

```jsx
import logoUrl from 'assets/icons/projeto/logo.svg?url'
<div style={{ backgroundImage: `url(${logoUrl})` }} />
```

#### Anti-padrões (não usar neste projeto)
- ❌ `?raw` + `dangerouslySetInnerHTML` — perde props/typing/tree-shaking, é legado de projetos sem svgr
- ❌ Sprite `<svg><use href="/icons.svg#edit-02" /></svg>` — projeto não tem `public/icons.svg`
- ❌ `--format symbols` ou `--output ./public` — gera sprite, fora do padrão

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--url` | -- | Figma URL (extracts file-key and node-id) |
| `--file-key` | -- | Figma file key (alternative to URL) |
| `--node-id` | -- | Node ID(s) to scan, comma-separated |
| `--token` | `$FIGMA_TOKEN` | Figma personal access token |
| `--output` | `./icons` | Output directory |
| `--format` | `symbols` | `svg-files`, `symbols`, or `both` |
| `--icons-file` | `<output>/icons.svg` | Path to the symbols sprite file |
| `--depth` | `8` | Node tree scan depth |
| `--min-size` | `16` | Min icon size in px |
| `--max-size` | `32` | Max icon size in px |
| `--name-filter` | -- | Regex to filter icon names |
| `--list-only` | false | List icons without downloading |
| `--append` | false | Append to existing icons.svg |
| `--keep-colors` | false | Don't replace colors with currentColor |
| `--verbose` | false | Detailed logs |

## Output Formats

### `symbols` (recommended for sprite usage)
Generates/appends to an SVG sprite file with `<symbol>` elements:
```xml
<svg aria-hidden="true" ...>
  <symbol id="edit-02" viewBox="0 0 20 20" fill="none">
    <path d="..." stroke="currentColor" .../>
  </symbol>
</svg>
```

### `svg-files`
Individual `.svg` files in the output directory.

### `both`
Both formats at once.

## How Detection Works

The script looks ONLY for **INSTANCE nodes** within the icon size range (16-32px). These are actual component instances from the Figma design system.

Automatically skips non-icon instances: Badge, Button, Tab, Input, Avatar, pagination, Text, Divider, Breadcrumb.

## Workflow for Claude Code

When implementing a Figma design that contains icons:

1. **Check** if icons exist in `public/icons.svg` or `src/assets/icons/` (grep for symbol IDs or filenames)
2. **If missing**, run the extractor targeting the Figma screen(s) with `--append`
3. **Reference** icons using the project's preferred method (inline SVG import or sprite `<use>`)
4. **NEVER** use Material Icons, Lucide, Heroicons, or any library
5. **NEVER** create SVG paths manually
6. **If no token**, ask the user for their Figma personal access token

## Troubleshooting

### "No icons detected"
- `--max-size 48` (icons may be larger than 32px)
- `--min-size 12` (icons may be smaller than 16px)
- `--name-filter "."` (match all names to see what's found)
- `--verbose` (see all candidates)
- Target a more specific `--node-id` (modal or card, not full page)

### URLs expired / Access Denied
- Script downloads immediately after getting URLs (they expire in seconds)
- Re-run the script for fresh URLs

### Colors wrong
- By default, `stroke="#hex"` becomes `stroke="currentColor"`
- Use `--keep-colors` to preserve original Figma colors
- White fills in masks are preserved automatically
