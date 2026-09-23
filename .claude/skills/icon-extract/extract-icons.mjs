#!/usr/bin/env node
/**
 * Figma Icon Extractor v2
 *
 * Exports real SVG icons from Figma using the REST API.
 * Focused on INSTANCE nodes (actual icon components) instead of raw vectors.
 *
 * Usage:
 *   node .claude/skills/icon-extract/extract-icons.mjs --url <figma-url> [options]
 *   node .claude/skills/icon-extract/extract-icons.mjs --file-key <key> --node-id <id> [options]
 *
 * Examples:
 *   # Extract icons from a specific Figma screen
 *   node .claude/skills/icon-extract/extract-icons.mjs \
 *     --url "https://www.figma.com/design/ABC123/File?node-id=123-456" \
 *     --output ./public \
 *     --format both \
 *     --verbose
 *
 *   # Extract from multiple screens at once
 *   node .claude/skills/icon-extract/extract-icons.mjs \
 *     --file-key ABC123 \
 *     --node-id "123:456,789:012,345:678" \
 *     --output ./src/assets/icons \
 *     --format svg-files
 *
 *   # List icons first without downloading
 *   node .claude/skills/icon-extract/extract-icons.mjs --url "..." --list-only
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { get as httpsGet } from 'https';
import { get as httpGet } from 'http';
import dotenv from 'dotenv';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
dotenv.config({ path: join(repoRoot, '.env') });

// --- Args ---

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = process.argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

function parseFigmaUrl(url) {
  const fileKeyMatch = url.match(/figma\.com\/(?:design|file)\/([a-zA-Z0-9]+)/);
  const nodeIdMatch = url.match(/node-id=([^&]+)/);
  if (!fileKeyMatch) throw new Error(`Cannot extract file key from: ${url}`);
  return {
    fileKey: fileKeyMatch[1],
    nodeId: nodeIdMatch ? decodeURIComponent(nodeIdMatch[1]).replace(/-/g, ':') : null,
  };
}

// --- Figma API ---

async function figmaRequest(path, token) {
  const url = `https://api.figma.com/v1${path}`;
  const res = await fetch(url, { headers: { 'X-Figma-Token': token } });
  if (!res.ok) throw new Error(`Figma API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function downloadUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? httpsGet : httpGet;
    client(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// --- Icon Detection ---

function findIconInstances(node, opts, results = []) {
  if (!node) return results;

  const name = node.name || '';
  const type = node.type || '';
  const id = node.id || '';
  const bb = node.absoluteBoundingBox || {};
  const w = Math.round(bb.width || 0);
  const h = Math.round(bb.height || 0);

  if (type === 'INSTANCE' && w >= opts.minSize && w <= opts.maxSize && h >= opts.minSize && h <= opts.maxSize) {
    const skipNames = /^(Badge|Button|Tab|Input|Avatar|pagination|Text|Divider|Breadcrumb)/i;
    if (!skipNames.test(name)) {
      if (!opts.nameFilter || opts.nameFilter.test(name)) {
        results.push({ id, name, type, width: w, height: h });
        return results;
      }
    }
  }

  for (const child of node.children || []) {
    findIconInstances(child, opts, results);
  }

  return results;
}

function sanitizeName(name) {
  return name
    .replace(/[\/\\]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/,/g, '-')
    .replace(/[^a-zA-Z0-9\-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'unnamed';
}

function deduplicateIcons(icons) {
  const byName = new Map();
  for (const icon of icons) {
    const key = sanitizeName(icon.name);
    const existing = byName.get(key);
    if (!existing || icon.id.length < existing.id.length) {
      byName.set(key, { ...icon, safeName: key });
    }
  }
  return [...byName.values()];
}

// --- SVG Processing ---

function cleanSvg(svg, keepColors) {
  svg = svg.replace(/<\?xml[^?]*\?>\s*/g, '');
  svg = svg.replace(/<!--[\s\S]*?-->/g, '');

  if (!keepColors) {
    svg = svg.replace(/stroke="#[0-9a-fA-F]{3,8}"/g, 'stroke="currentColor"');
    svg = svg.replace(/fill="#(?!fff|FFF|ffffff|FFFFFF)[0-9a-fA-F]{3,8}"/g, 'fill="currentColor"');
  }

  return svg.trim();
}

function svgToSymbol(id, svg) {
  const vbMatch = svg.match(/viewBox="([^"]+)"/);
  const viewBox = vbMatch ? vbMatch[1] : '0 0 24 24';

  const inner = svg
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim();

  return `  <symbol id="${id}" viewBox="${viewBox}" fill="none">\n    ${inner}\n  </symbol>`;
}

// --- Output ---

function writeSymbolsFile(icons, svgMap, outputPath, append) {
  const symbols = [];
  for (const icon of icons) {
    const svg = svgMap[icon.id];
    if (!svg) continue;
    symbols.push(`\n  <!-- Figma: ${icon.name} -->\n${svgToSymbol(icon.safeName, svg)}`);
  }

  if (append && existsSync(outputPath)) {
    let existing = readFileSync(outputPath, 'utf-8');
    existing = existing.replace(/\n*<\/svg>\s*$/, '');
    writeFileSync(outputPath, existing + '\n' + symbols.join('\n') + '\n\n</svg>\n', 'utf-8');
  } else {
    const content = `<svg aria-hidden="true" style="position: absolute; width: 0; height: 0; overflow: hidden"
  version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
${symbols.join('\n')}

</svg>
`;
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, content, 'utf-8');
  }

  return symbols.length;
}

function writeSvgFiles(icons, svgMap, outputDir) {
  mkdirSync(outputDir, { recursive: true });
  let count = 0;
  for (const icon of icons) {
    const svg = svgMap[icon.id];
    if (!svg) continue;
    writeFileSync(join(outputDir, `${icon.safeName}.svg`), svg, 'utf-8');
    count++;
  }
  return count;
}

// --- Main ---

async function main() {
  const args = parseArgs();

  let fileKey = args['file-key'];
  let nodeIds = [];

  if (args.url) {
    const parsed = parseFigmaUrl(args.url);
    fileKey = fileKey || parsed.fileKey;
    if (parsed.nodeId) nodeIds.push(parsed.nodeId);
  }

  if (args['node-id']) {
    nodeIds.push(...args['node-id'].split(',').map((s) => s.trim()));
  }
  const token = args.token || process.env.FIGMA_TOKEN;
  const outputDir = resolve(args.output || './icons');
  const format = args.format || 'symbols';
  const iconsFile = args['icons-file'] || join(outputDir, 'icons.svg');
  const depth = parseInt(args.depth || '8', 10);
  const minSize = parseInt(args['min-size'] || '16', 10);
  const maxSize = parseInt(args['max-size'] || '32', 10);
  const nameFilter = args['name-filter'] ? new RegExp(args['name-filter'], 'i') : null;
  const listOnly = !!args['list-only'];
  const append = !!args.append;
  const keepColors = !!args['keep-colors'];
  const verbose = !!args.verbose;

  if (!fileKey) {
    console.error('Error: --file-key or --url required');
    process.exit(1);
  }
  if (!token) {
    console.error('Error: --token or FIGMA_TOKEN env var required');
    process.exit(1);
  }
  if (nodeIds.length === 0) {
    console.error('Error: --node-id or --url with node-id required');
    process.exit(1);
  }

  // Step 1: Fetch node trees
  console.log(`\n🔍 Fetching ${nodeIds.length} node tree(s) from Figma (depth=${depth})...`);
  const encodedIds = nodeIds.join(',');
  const nodesData = await figmaRequest(
    `/files/${fileKey}/nodes?ids=${encodeURIComponent(encodedIds)}&depth=${depth}`,
    token
  );

  // Step 2: Find icon INSTANCE nodes
  console.log(`🔎 Scanning for icon instances (${minSize}-${maxSize}px)...`);
  let allIcons = [];

  for (const [nodeId, nodeData] of Object.entries(nodesData.nodes || {})) {
    if (!nodeData?.document) {
      console.warn(`   ⚠️ Node ${nodeId} not found`);
      continue;
    }
    const icons = findIconInstances(nodeData.document, { minSize, maxSize, nameFilter });
    if (verbose) {
      for (const ic of icons) {
        console.log(`   ✓ ${ic.name} (${ic.width}x${ic.height}, ${ic.id})`);
      }
    }
    allIcons.push(...icons);
  }

  const icons = deduplicateIcons(allIcons);
  console.log(`\n📋 Found ${icons.length} unique icons:`);
  for (const icon of icons) {
    console.log(`   • ${icon.safeName} ← "${icon.name}" (${icon.width}x${icon.height})`);
  }

  if (listOnly || icons.length === 0) {
    if (icons.length === 0) {
      console.log('\n⚠️  No icons detected. Tips:');
      console.log('   --max-size 48     (increase max size)');
      console.log('   --min-size 12     (decrease min size)');
      console.log('   --name-filter "." (match all names)');
      console.log('   --verbose         (see all candidates)');
    }
    return;
  }

  // Step 3: Export SVGs via Figma Images API
  console.log(`\n📥 Exporting ${icons.length} SVGs...`);
  const BATCH_SIZE = 20;
  const svgMap = {};

  for (let i = 0; i < icons.length; i += BATCH_SIZE) {
    const batch = icons.slice(i, i + BATCH_SIZE);
    if (i > 0) {
      console.log('   ⏳ Rate limit pause (2s)...');
      await new Promise((r) => setTimeout(r, 2000));
    }

    const batchIds = batch.map((ic) => ic.id).join(',');
    console.log(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} icons...`);

    const imgResponse = await figmaRequest(
      `/images/${fileKey}?ids=${encodeURIComponent(batchIds)}&format=svg&svg_include_id=false&svg_simplify_stroke=true`,
      token
    );

    if (imgResponse.err) {
      console.error(`   ❌ Figma error: ${imgResponse.err}`);
      continue;
    }

    for (const icon of batch) {
      const url = imgResponse.images?.[icon.id];
      if (!url) {
        console.warn(`   ⚠️ No URL for "${icon.safeName}" (${icon.id})`);
        continue;
      }
      try {
        let svg = await downloadUrl(url);
        if (svg.includes('<Error>')) {
          console.warn(`   ⚠️ Expired URL for "${icon.safeName}"`);
          continue;
        }
        svgMap[icon.id] = cleanSvg(svg, keepColors);
        if (verbose) console.log(`   ✓ ${icon.safeName} (${svg.length}b)`);
      } catch (err) {
        console.warn(`   ⚠️ Download failed for "${icon.safeName}": ${err.message}`);
      }
    }
  }

  const downloaded = Object.keys(svgMap).length;
  console.log(`   Downloaded: ${downloaded}/${icons.length}`);

  // Step 4: Write output
  console.log(`\n💾 Writing output (format: ${format})...`);

  if (format === 'svg-files' || format === 'both') {
    const count = writeSvgFiles(icons, svgMap, outputDir);
    console.log(`   📁 ${count} SVG files → ${outputDir}/`);
  }

  if (format === 'symbols' || format === 'both') {
    const count = writeSymbolsFile(icons, svgMap, iconsFile, append);
    console.log(`   📄 ${count} symbols → ${iconsFile}`);
  }

  // Summary
  console.log(`\n✅ Done! ${downloaded} icons exported.`);
  console.log(`\n--- ICON REFERENCE (for code — vite-plugin-svgr ?react) ---`);
  for (const icon of icons) {
    if (svgMap[icon.id]) {
      if (format === 'svg-files' || format === 'both') {
        // PascalCase do safeName (kebab-case) para nome de componente React
        const componentName = icon.safeName
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join('');
        console.log(`import ${componentName} from 'assets/icons/${icon.safeName}.svg?react'`);
      }
      if (format === 'symbols') {
        console.log(`// (sprite output — não é o padrão deste projeto, prefira --format svg-files + ?react)`);
        console.log(`<svg><use href="/icons.svg#${icon.safeName}" /></svg>`);
      }
    }
  }
  console.log(`--- END ---\n`);
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
