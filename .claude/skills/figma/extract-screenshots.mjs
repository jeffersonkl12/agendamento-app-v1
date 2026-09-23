#!/usr/bin/env node
/**
 * Figma Screenshot Extractor
 *
 * Exports screenshots from Figma using the REST API. Default pipeline:
 * downloads JPG from Figma (cheaper transfer than PNG) and re-encodes to WebP
 * via sharp before writing to disk. Only the .webp is kept — no duplicates.
 *
 * Replaces mcp__figma__get_screenshot, which only returns 1x PNGs and has no
 * scale/quality knobs. Uses the same auth/batching pattern as extract-icons.mjs
 * (FIGMA_TOKEN, batched /v1/images calls, follow-redirect download).
 *
 * Why these defaults:
 *   - scale=1.5: vision models tile by pixel dimensions, not file size. 1.5 is
 *     the sweet spot (~44% of the bytes of 2x with negligible perceived loss).
 *   - WebP on: ~30-50% smaller than JPG at the same quality. Helps disk/git/IDE
 *     preview. Doesn't help the IA itself (token cost is dimension-driven).
 *
 * Usage:
 *   # Single screenshot (defaults: scale=1.5, .webp output)
 *   node .claude/skills/figma/extract-screenshots.mjs \
 *     --url "https://www.figma.com/design/ABC123/File?node-id=123-456" \
 *     --output docs/figma --prefix vante- --name overview
 *   # → docs/figma/vante-overview.webp
 *
 *   # Batch several sections in one request
 *   node .claude/skills/figma/extract-screenshots.mjs \
 *     --file-key ABC123 \
 *     --node-id "100:201=hero,100:202=solutions,100:203=about,100:204=cta" \
 *     --output docs/figma --prefix vante-
 *   # → docs/figma/vante-hero.webp, vante-solutions.webp, ...
 *
 *   # Keep raw JPG (skip WebP conversion)
 *   node .claude/skills/figma/extract-screenshots.mjs --url "..." --no-webp
 *
 * Args:
 *   --url <url>                 Figma URL (extracts fileKey + nodeId).
 *   --file-key <key>            Alternative to --url.
 *   --node-id <ids>             Comma-separated. Optional name via "id=name".
 *                               Examples: "100:200" or "100:200=hero,100:201=cta"
 *   --name <name>               Override filename when using a single --url node.
 *   --output <dir>              Output directory. Default: current dir.
 *   --prefix <prefix>           Filename prefix (e.g. "vante-").
 *   --scale <n>                 0.01..4. Default: 1.5.
 *   --format <fmt>              jpg | png | svg | pdf. Default: jpg.
 *                               (Format requested FROM Figma; final on disk
 *                                is .webp unless --no-webp or svg/pdf.)
 *   --no-webp                   Skip WebP conversion; keep raw --format file.
 *                               Auto-disabled when --format is svg or pdf.
 *   --webp-quality <n>          1..100. Default: 82.
 *   --use-absolute-bounds       Include effects that bleed outside the box.
 *   --token <token>             Overrides FIGMA_TOKEN (repo `.env` loaded via dotenv).
 *   --verbose                   Log per-file details.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { get as httpsGet } from 'https';
import dotenv from 'dotenv';
import sharp from 'sharp';

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
  const fileKeyMatch = url.match(/figma\.com\/(?:design|file|board)\/([a-zA-Z0-9]+)/);
  const nodeIdMatch = url.match(/node-id=([^&]+)/);
  if (!fileKeyMatch) throw new Error(`Cannot extract file key from: ${url}`);
  return {
    fileKey: fileKeyMatch[1],
    nodeId: nodeIdMatch ? decodeURIComponent(nodeIdMatch[1]).replace(/-/g, ':') : null,
  };
}

function sanitizeName(name) {
  return name
    .replace(/[\/\\]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[:,]/g, '-')
    .replace(/[^a-zA-Z0-9\-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'unnamed';
}

function parseNodeMappings(input) {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      const [id, name] = part.split('=').map((p) => p.trim());
      return { id, name: name || null };
    });
}

// --- Figma API ---

async function figmaRequest(path, token) {
  const url = `https://api.figma.com/v1${path}`;
  const res = await fetch(url, { headers: { 'X-Figma-Token': token } });
  if (!res.ok) throw new Error(`Figma API ${res.status}: ${await res.text()}`);
  return res.json();
}

function downloadBinary(url) {
  return new Promise((resolve, reject) => {
    httpsGet(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadBinary(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// --- Main ---

async function main() {
  const args = parseArgs();

  let fileKey = args['file-key'];
  const mappings = [];

  if (args.url) {
    const parsed = parseFigmaUrl(args.url);
    fileKey = fileKey || parsed.fileKey;
    if (parsed.nodeId && !args['node-id']) {
      mappings.push({ id: parsed.nodeId, name: args.name || null });
    }
  }

  if (args['node-id']) {
    mappings.push(...parseNodeMappings(args['node-id']));
  }

  const token = args.token || process.env.FIGMA_TOKEN;
  const outputDir = resolve(args.output || './');
  const prefix = args.prefix || '';
  const scale = String(args.scale || '1.5');
  const format = (args.format || 'jpg').toLowerCase();
  const useAbsoluteBounds = !!args['use-absolute-bounds'];
  const verbose = !!args.verbose;
  const noWebp = !!args['no-webp'];
  const webpQuality = parseInt(args['webp-quality'] || '82', 10);

  if (!fileKey) {
    console.error('Error: --file-key or --url required');
    process.exit(1);
  }
  if (!token) {
    console.error('Error: --token or FIGMA_TOKEN env var required');
    process.exit(1);
  }
  if (mappings.length === 0) {
    console.error('Error: --node-id or --url with node-id required');
    process.exit(1);
  }

  const validFormats = ['jpg', 'png', 'svg', 'pdf'];
  if (!validFormats.includes(format)) {
    console.error(`Error: --format must be one of ${validFormats.join(', ')}`);
    process.exit(1);
  }

  const scaleNum = parseFloat(scale);
  if (!(scaleNum >= 0.01 && scaleNum <= 4)) {
    console.error('Error: --scale must be between 0.01 and 4');
    process.exit(1);
  }

  if (!(webpQuality >= 1 && webpQuality <= 100)) {
    console.error('Error: --webp-quality must be between 1 and 100');
    process.exit(1);
  }

  // WebP only makes sense for raster formats
  const isVector = format === 'svg' || format === 'pdf';
  const useWebp = !noWebp && !isVector;
  const finalExt = useWebp ? 'webp' : format;

  for (const m of mappings) {
    if (!m.name) m.name = sanitizeName(m.id);
    else m.name = sanitizeName(m.name);
  }

  const pipelineMsg = useWebp
    ? `${scale}x ${format.toUpperCase()} → WebP (q=${webpQuality})`
    : `${scale}x ${format.toUpperCase()}`;
  console.log(`\n📸 Capturing ${mappings.length} screenshot(s) at ${pipelineMsg}...`);
  if (verbose) {
    for (const m of mappings) {
      console.log(`   • ${prefix}${m.name}.${finalExt}  ← ${m.id}`);
    }
  }

  // Step 1: Request URLs in batches
  const BATCH_SIZE = 15;
  const allUrls = {};

  for (let i = 0; i < mappings.length; i += BATCH_SIZE) {
    const batch = mappings.slice(i, i + BATCH_SIZE);
    if (i > 0) {
      console.log('   ⏳ Rate limit pause (1s)...');
      await new Promise((r) => setTimeout(r, 1000));
    }

    const ids = batch.map((m) => m.id).join(',');
    const params = new URLSearchParams({
      ids,
      scale,
      format,
    });
    if (useAbsoluteBounds) params.set('use_absolute_bounds', 'true');

    console.log(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} request(s)...`);
    const resp = await figmaRequest(`/images/${fileKey}?${params.toString()}`, token);

    if (resp.err) {
      console.error(`   ❌ Figma error: ${resp.err}`);
      continue;
    }

    Object.assign(allUrls, resp.images || {});
  }

  // Step 2: Download, optionally re-encode, write to disk
  mkdirSync(outputDir, { recursive: true });
  let saved = 0;
  let totalRawBytes = 0;
  let totalFinalBytes = 0;

  for (const m of mappings) {
    const url = allUrls[m.id];
    if (!url) {
      console.warn(`   ⚠️ No URL returned for ${m.id} (${m.name})`);
      continue;
    }
    try {
      const buf = await downloadBinary(url);
      totalRawBytes += buf.length;

      let outBuf = buf;
      if (useWebp) {
        outBuf = await sharp(buf).webp({ quality: webpQuality }).toBuffer();
      }
      totalFinalBytes += outBuf.length;

      const filename = `${prefix}${m.name}.${finalExt}`;
      const fullPath = join(outputDir, filename);
      writeFileSync(fullPath, outBuf);
      saved++;

      if (useWebp) {
        const ratio = ((1 - outBuf.length / buf.length) * 100).toFixed(0);
        console.log(
          `   ✓ ${filename} (${(outBuf.length / 1024).toFixed(1)} KB, -${ratio}% vs raw)`,
        );
      } else {
        console.log(`   ✓ ${filename} (${(outBuf.length / 1024).toFixed(1)} KB)`);
      }
    } catch (err) {
      console.warn(`   ⚠️ Download failed for ${m.name}: ${err.message}`);
    }
  }

  if (useWebp && saved > 0) {
    const totalRatio = ((1 - totalFinalBytes / totalRawBytes) * 100).toFixed(0);
    console.log(
      `\n✅ Done! ${saved}/${mappings.length} screenshot(s) → ${outputDir}/  ` +
      `(total: ${(totalFinalBytes / 1024).toFixed(0)} KB, -${totalRatio}% vs raw JPG)`,
    );
  } else {
    console.log(`\n✅ Done! ${saved}/${mappings.length} screenshot(s) → ${outputDir}/`);
  }

  if (saved < mappings.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
