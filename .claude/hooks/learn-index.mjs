#!/usr/bin/env node
/**
 * PostToolUse hook — valida frontmatter de notas em .claude/learn/ e
 * regenera _index.json sempre que uma nota é escrita/editada.
 *
 * O índice legível pra humano/Obsidian é gerenciado pelo `index.base`
 * (Obsidian Bases, atualiza sozinho via plugin). Aqui só geramos o JSON
 * machine-readable que o agente consome no protocolo de leitura N1.
 *
 * Roda DEPOIS de Write/Edit/MultiEdit. NÃO bloqueia o tool em si (já foi).
 * O exit-2 aqui só comunica problemas de validação no stderr (visíveis pro
 * agente e pro usuário). Pra erro fatal no I/O, exit-1 (não-bloqueante).
 *
 * Exit codes:
 *   0 = ok (índices regenerados, validação passou)
 *   1 = erro interno do hook (não bloqueante, só sinaliza)
 *   2 = uma ou mais notas violam o schema (mensagem no stderr)
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep, dirname, basename } from 'node:path'

const PROJECT_ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const LEARN_DIR = join(PROJECT_ROOT, '.claude', 'learn')
const SCHEMA_PATH = join(LEARN_DIR, '_SCHEMA.md')
const INDEX_JSON = join(LEARN_DIR, '_index.json')

// ---- Trigger filter ---------------------------------------------------------
// Hook-mode: payload via stdin (PostToolUse). Só roda se Write/Edit em learn/**.md
// Manual-mode: chamada direta sem stdin → sempre regenera (útil pra bootstrap/testes)

let payload = null
try {
  const stdin = readFileSync(0, 'utf-8')
  if (stdin.trim()) payload = JSON.parse(stdin)
} catch {
  payload = null
}

if (payload) {
  const toolName = payload.tool_name || payload.toolName || ''
  if (!['Write', 'Edit', 'MultiEdit'].includes(toolName)) process.exit(0)

  const input = payload.tool_input || payload.toolInput || {}
  const filePath = input.file_path || input.filePath || ''
  const normalized = filePath.replace(/\\/g, '/')
  if (!/\/\.claude\/learn\/.+\.md$/i.test(normalized)) process.exit(0)
}

// ---- Helpers ----------------------------------------------------------------

const ADMIN = new Set(['_SCHEMA.md', '_TEMPLATE.md', 'README.md', 'log.md'])

function walkNotes(dir) {
  const out = []
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of entries) {
    const full = join(dir, name)
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      out.push(...walkNotes(full))
    } else if (name.endsWith('.md') && !ADMIN.has(name) && !name.startsWith('_')) {
      out.push(full)
    }
  }
  return out
}

function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return null
  const end = raw.search(/\r?\n---/)
  if (end === -1) return null
  const yaml = raw.slice(3, end).replace(/^\r?\n/, '')
  return parseYaml(yaml)
}

// Parser YAML mínimo: cobre o que o template gera (escalares, listas inline,
// listas em bloco). Suficiente pro contrato; falha alto se YAML "complexo".
function parseYaml(yaml) {
  const lines = yaml.split(/\r?\n/).map((l) => l.replace(/\r$/, ''))
  const out = {}
  let currentKey = null
  let currentList = null
  for (const rawLine of lines) {
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue
    if (/^\s+-\s+/.test(rawLine) && currentList !== null) {
      currentList.push(rawLine.replace(/^\s+-\s+/, '').trim().replace(/^["']|["']$/g, ''))
      continue
    }
    const m = rawLine.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
    if (!m) continue
    const [, key, valueRaw] = m
    currentKey = key
    const value = valueRaw.trim()
    if (value === '' || value === '[]') {
      // Lista vazia ou começa lista em bloco abaixo.
      if (value === '[]') {
        out[key] = []
        currentList = null
      } else {
        out[key] = []
        currentList = out[key]
      }
      continue
    }
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim()
      out[key] = inner
        ? inner.split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''))
        : []
      currentList = null
      continue
    }
    out[key] = value.replace(/^["']|["']$/g, '')
    currentList = null
  }
  return out
}

function readSchema() {
  let text
  try {
    text = readFileSync(SCHEMA_PATH, 'utf-8')
  } catch {
    return null
  }
  const cats = []
  const tags = []
  const cMatch = text.match(/```yaml\s*\ncategories:[\s\S]*?```/)
  if (cMatch) {
    for (const m of cMatch[0].matchAll(/^\s*-\s*([\w-]+)/gm)) cats.push(m[1])
  }
  const tMatch = text.match(/```yaml\s*\ntags:[\s\S]*?```/)
  if (tMatch) {
    for (const m of tMatch[0].matchAll(/^\s*-\s*([\w-]+)/gm)) tags.push(m[1])
  }
  return {
    categories: new Set(cats),
    tags: new Set(tags),
    recurrence: new Set(['baixa', 'media', 'alta']),
    scope: new Set(['generic', 'project']),
  }
}

function validate(note, schema) {
  const errors = []
  const fm = note.frontmatter
  const required = ['title', 'date', 'category', 'tags', 'recurrence', 'scope']
  for (const k of required) {
    if (fm[k] === undefined || fm[k] === '' || (Array.isArray(fm[k]) && fm[k].length === 0 && k === 'tags')) {
      errors.push(`campo obrigatório ausente ou vazio: ${k}`)
    }
  }
  if (fm.category && !schema.categories.has(fm.category)) {
    errors.push(`category="${fm.category}" não está em _SCHEMA.md`)
  }
  if (fm.category) {
    const expectedDir = join(LEARN_DIR, fm.category)
    if (dirname(note.path) !== expectedDir) {
      errors.push(`category="${fm.category}" não bate com pasta-pai (esperado ${relative(PROJECT_ROOT, expectedDir)})`)
    }
  }
  if (Array.isArray(fm.tags)) {
    for (const t of fm.tags) {
      if (!schema.tags.has(t)) errors.push(`tag desconhecida: "${t}"`)
    }
  }
  if (fm.recurrence && !schema.recurrence.has(fm.recurrence)) {
    errors.push(`recurrence="${fm.recurrence}" inválido (use baixa|media|alta)`)
  }
  if (fm.scope && !schema.scope.has(fm.scope)) {
    errors.push(`scope="${fm.scope}" inválido (use generic|project)`)
  }
  if (fm.scope === 'project' && !fm.project) {
    errors.push('scope=project exige campo project:')
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fm.date || ''))) {
    errors.push(`date="${fm.date}" não está em YYYY-MM-DD`)
  }
  return errors
}

// ---- Main -------------------------------------------------------------------

const schema = readSchema()
if (!schema) {
  process.stderr.write('learn-index.mjs: _SCHEMA.md não encontrado em .claude/learn/. Pulando regeneração.\n')
  process.exit(1)
}

const notePaths = walkNotes(LEARN_DIR)
const notes = []
const violations = []

for (const p of notePaths) {
  let raw
  try {
    raw = readFileSync(p, 'utf-8')
  } catch {
    continue
  }
  const fm = parseFrontmatter(raw)
  const slug = basename(p, '.md')
  const rel = relative(LEARN_DIR, p).split(sep).join('/')
  if (!fm) {
    violations.push({ path: rel, errors: ['frontmatter ausente ou inválido'] })
    continue
  }
  const note = { path: p, rel, slug, frontmatter: fm }
  const errs = validate(note, schema)
  if (errs.length) {
    violations.push({ path: rel, errors: errs })
  }
  notes.push(note)
}

// ---- Generate _index.json --------------------------------------------------
// Único índice gerado pelo hook. O índice navegável fica em index.base
// (Obsidian Bases). _index.json é o payload do protocolo de leitura N1.

const byCategory = new Map()
const byTag = new Map()
for (const n of notes) {
  const cat = n.frontmatter.category || 'unknown'
  if (!byCategory.has(cat)) byCategory.set(cat, [])
  byCategory.get(cat).push(n)
  for (const t of n.frontmatter.tags || []) {
    if (!byTag.has(t)) byTag.set(t, [])
    byTag.get(t).push(n.slug)
  }
}

const sortedCats = [...byCategory.keys()].sort()
const sortedTags = [...byTag.keys()].sort()

const json = {
  generated_at: new Date().toISOString(),
  total: notes.length,
  categories: Object.fromEntries(
    sortedCats.map((cat) => [
      cat,
      byCategory
        .get(cat)
        .sort((a, b) => a.slug.localeCompare(b.slug))
        .map((n) => ({
          slug: n.slug,
          path: n.rel,
          title: n.frontmatter.title || '',
          tags: n.frontmatter.tags || [],
          recurrence: n.frontmatter.recurrence || '',
          scope: n.frontmatter.scope || '',
        })),
    ])
  ),
  tags: Object.fromEntries(sortedTags.map((t) => [t, byTag.get(t).sort()])),
}
writeFileSync(INDEX_JSON, JSON.stringify(json, null, 2) + '\n', 'utf-8')

// ---- Reportar violações -----------------------------------------------------

if (violations.length) {
  const lines = ['learn-index.mjs: violações de schema detectadas:']
  for (const v of violations) {
    lines.push(`  - ${v.path}`)
    for (const e of v.errors) lines.push(`      • ${e}`)
  }
  lines.push('')
  lines.push('Corrigir com /learn ou editando o frontmatter manualmente.')
  lines.push('Vocabulário válido: ver .claude/learn/_SCHEMA.md')
  process.stderr.write(lines.join('\n') + '\n')
  process.exit(2)
}

process.exit(0)
