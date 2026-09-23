#!/usr/bin/env node
/**
 * PreToolUse hook — bloqueia Write/Edit que importa biblioteca de ícone.
 * Enforcement técnico da R7 (RULES.md): ícones SEMPRE via /icon-extract (Figma)
 * ou export_nodes (Pencil), NUNCA de Lucide/Heroicons/Material/FontAwesome.
 *
 * Exit codes:
 *   0 = permitir
 *   2 = bloquear (mensagem no stderr vai pro Claude + usuário)
 */

import { readFileSync } from 'node:fs'

let payload
try {
  payload = JSON.parse(readFileSync(0, 'utf-8'))
} catch {
  // Se não conseguir parsear, não bloqueia (safe default)
  process.exit(0)
}

const toolName = payload.tool_name || payload.toolName || ''
if (!['Write', 'Edit', 'MultiEdit'].includes(toolName)) {
  process.exit(0)
}

const input = payload.tool_input || payload.toolInput || {}
const filePath = input.file_path || input.filePath || ''

// Só valida arquivos de UI
if (!/\.(jsx|tsx|astro)$/i.test(filePath)) {
  process.exit(0)
}

// Coleta todo o conteúdo relevante (Write = content, Edit = new_string, MultiEdit = edits[].new_string)
let content = ''
if (input.content) content += input.content
if (input.new_string) content += '\n' + input.new_string
if (Array.isArray(input.edits)) {
  for (const e of input.edits) if (e?.new_string) content += '\n' + e.new_string
}

if (!content) process.exit(0)

// Bibliotecas de ícone conhecidas — import dessas = ícone inventado
const INVENTED_ICON_PATTERNS = [
  { pattern: /from\s+['"]lucide-react['"]/, lib: 'lucide-react' },
  { pattern: /from\s+['"]@lucide\/[^'"]+['"]/, lib: '@lucide/*' },
  { pattern: /from\s+['"]@heroicons\/[^'"]+['"]/, lib: '@heroicons/*' },
  { pattern: /from\s+['"]react-icons\/[^'"]+['"]/, lib: 'react-icons/*' },
  { pattern: /from\s+['"]@fortawesome\/[^'"]+['"]/, lib: '@fortawesome/*' },
  { pattern: /from\s+['"]@mui\/icons-material[^'"]*['"]/, lib: '@mui/icons-material' },
  { pattern: /from\s+['"]material-icons[^'"]*['"]/, lib: 'material-icons' },
  { pattern: /from\s+['"]@tabler\/icons[^'"]*['"]/, lib: '@tabler/icons' },
  { pattern: /from\s+['"]phosphor-react['"]/, lib: 'phosphor-react' },
  { pattern: /from\s+['"]@phosphor-icons\/[^'"]+['"]/, lib: '@phosphor-icons/*' },
  { pattern: /from\s+['"]feather-icons[^'"]*['"]/, lib: 'feather-icons' },
  { pattern: /from\s+['"]react-feather['"]/, lib: 'react-feather' },
  // CDN direto no className/href (menos comum mas possível)
  { pattern: /material-symbols-(outlined|rounded|sharp)/, lib: 'Material Symbols (CDN)' },
]

const matches = []
for (const { pattern, lib } of INVENTED_ICON_PATTERNS) {
  if (pattern.test(content)) matches.push(lib)
}

if (matches.length === 0) process.exit(0)

// BLOQUEIO
const msg = `
BLOQUEADO pelo hook check-icons.mjs

Arquivo: ${filePath}
Biblioteca(s) detectada(s): ${matches.join(', ')}

Regra R7 (.claude/RULES.md): NUNCA importar ícone de biblioteca. SEMPRE extrair SVG real do design.

Como resolver:
  - Figma → rodar /icon-extract ANTES de gerar código (REST API → src/assets/icons/{page}/, --format svg-files)
  - Pencil → usar MCP export_nodes pra salvar os ícones em src/assets/icons/{page}/
  - Importar como componente React via vite-plugin-svgr (padrão único do projeto):
      import IconNome from 'assets/icons/{page}/icon-nome.svg?react'
      <IconNome className="w-5 h-5 text-primary" aria-hidden="true" />

  Variantes svgr:
    ?react → componente React (default pra ícones e logos inline)
    ?url   → URL string (pra background-image, <img src>, hrefs)

  NUNCA usar ?raw + dangerouslySetInnerHTML (legado, perde props/typing/tree-shaking).
  NUNCA usar sprite (<use href="/icons.svg#nome" />) — esse projeto não tem public/icons.svg.

Se este import é intencional e NÃO é ícone do design (ex: ícone genérico de UI kit),
mova pra um componente dedicado e documente no topo do arquivo a exceção.
`

process.stderr.write(msg.trim() + '\n')
process.exit(2)
