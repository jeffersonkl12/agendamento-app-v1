# LESSONS.md — STUB

> **Substituído por `.claude/learn/`** (vault wiki compounding).
> Mantido apenas como aterrissagem para links antigos em docs e PRs.

## Como puxar contexto agora

- **Regras universais:** `.claude/RULES.md` (sempre).
- **Vault de aprendizado:** `.claude/learn/` — notas atômicas em subpastas por categoria.
- **Entrada do agente:** `.claude/learn/_index.json` (machine-readable, ~50 tokens).
- **Para humanos / Obsidian:** `.claude/learn/index.base` (Obsidian Bases — filtra/ordena notas pelo frontmatter).
- **Histórico:** `.claude/learn/log.md` cronológico.
- **Vocabulário válido:** `.claude/learn/_SCHEMA.md` (categorias, tags, enums).

## Protocolo 3 níveis

```
N1 — Read .claude/learn/_index.json → categoria(s)
N2 — Glob+Grep nas categorias → até 3 notas
N3 — Read ≤3 notas completas
```

## Comandos

- `/learn` → ingest multi-página (cria ou atualiza nota; cross-refs bidirecionais; log).
- `/dream` → lint estrutural (órfãos, stale, gaps) + propostas de consolidação.

## Hook automático

`.claude/hooks/learn-index.mjs` (PostToolUse) regenera `_index.json` e valida frontmatter contra `_SCHEMA.md` a cada Write/Edit em `.claude/learn/`. O índice humano é o `index.base` (Obsidian Bases — atualiza sozinho).
