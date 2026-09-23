// Helper one-off: baixa raster images do MCP figma asset URL
// Uso: node .claude/skills/figma/download-figma-assets.mjs <output-dir> <name1=url1> <name2=url2> ...
// Detecta extensão pelo content-type. Salva sem reconvertir.

import fs from 'node:fs/promises'
import path from 'node:path'

const args = process.argv.slice(2)
if (args.length < 2) {
  console.error('Usage: node download-figma-assets.mjs <output-dir> <name1=url1> ...')
  process.exit(1)
}

const outputDir = args[0]
const pairs = args.slice(1).map((p) => {
  const i = p.indexOf('=')
  return { name: p.slice(0, i), url: p.slice(i + 1) }
})

await fs.mkdir(outputDir, { recursive: true })

const extFor = (ct, fallback = 'webp') => {
  if (!ct) return fallback
  if (ct.includes('png')) return 'png'
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg'
  if (ct.includes('webp')) return 'webp'
  if (ct.includes('svg')) return 'svg'
  return fallback
}

const results = []
for (const { name, url } of pairs) {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`  ✗ ${name}: HTTP ${res.status}`)
      results.push({ name, ok: false, status: res.status })
      continue
    }
    const ct = res.headers.get('content-type') || ''
    const ext = extFor(ct)
    const buf = Buffer.from(await res.arrayBuffer())
    const filename = `${name}.${ext}`
    await fs.writeFile(path.join(outputDir, filename), buf)
    console.log(`  ✓ ${filename} (${(buf.length / 1024).toFixed(1)} KB, ${ct})`)
    results.push({ name, ok: true, file: filename, size: buf.length, ext })
  } catch (e) {
    console.warn(`  ✗ ${name}: ${e.message}`)
    results.push({ name, ok: false, error: e.message })
  }
}

const ok = results.filter((r) => r.ok).length
console.log(`\nDone: ${ok}/${results.length} downloaded → ${outputDir}/`)
