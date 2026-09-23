# learn/ — Wiki compounding de aprendizado

Vault de notas atômicas. **Inspirado no padrão de Andrej Karpathy** ([LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)) sobre estrutura Obsidian. Substitui o antigo `LESSONS.md` único.

## Filosofia: você é mantenedor de wiki, não autor solto

Toda ingestão (`/learn`) **toca múltiplas páginas**:

- Atualiza nota existente quando o padrão já foi visto.
- Cria cross-refs bidirecionais (`related:` mútuo entre notas afins).
- Marca contradições / supersedes quando uma lição substitui outra.
- Append em `log.md` para auditoria cronológica.
- Hook regenera `_index.json` automaticamente.

**Notas devem ser atômicas mas conectadas.** Uma nota isolada que ninguém referencia é candidata a virar regra (`/dream` propõe) ou ser absorvida por outra.

## Três camadas

- **Raw sources (imutáveis):** `git diff`, PRs, snapshots Figma/Pencil. Lemos, nunca modificamos.
- **Wiki (LLM-owned):** este vault. O agente cria, atualiza, cross-refera.
- **Schema (contrato):** [`_SCHEMA.md`](./_SCHEMA.md) + [`CLAUDE.md`](../../CLAUDE.md). Define convenções; co-evoluído com o dev.

## Estrutura

```
.claude/learn/
  README.md       (este arquivo)
  _SCHEMA.md      (vocab fechado; validado pelo hook)
  _TEMPLATE.md    (gabarito)
  index.base      (índice navegável humano — Obsidian Bases; gerenciado pelo plugin)
  _index.json     (GERADO pelo hook; payload machine-readable do agente)
  log.md          (cronológico; append-only; nunca regenerado)
  {categoria}/
    {slug}.md
```

Categorias = pastas. Vocabulário e categorias válidos: ver [`_SCHEMA.md`](./_SCHEMA.md).

## Protocolo de leitura em 3 níveis (consumo gradual)

O agente NUNCA abre o vault inteiro. Sempre:

```
N1 — sempre (~50 tokens, 1 Read):
  Ler .claude/learn/_index.json
  Decidir: quais categorias e/ou tags interessam pra tarefa atual

N2 — só categorias escolhidas (~200 tokens, 1-2 Glob+Grep):
  Glob learn/{cat}/*.md  +  Grep frontmatter (title, tags, recurrence)
  Decidir: quais notas abrir

N3 — máximo 3 notas (~300 tokens cada):
  Read learn/{cat}/{slug}.md
  Se mais que 3 batem: priorizar recurrence:alta + scope:generic
```

Token cost cresce **sublinear** com número de notas.

## Como o agente escolhe categorias (gatilhos)

1. **Por skill** — cada skill (`figma`, `pencil`, `gsap`) declara as categorias que puxa.
2. **Por diff** — `code-reviewer` infere categoria pelo path/diff:
   - `src/components/**/navbar*`, `src/views/**/Topbar.vue` → `navbar`
   - `src/assets/index.css`, novas classes/text-styles → `tokens`
   - SVG inline (`<path>`, `<svg>`), `src/components/icons/**` → `icons`, `tokens`
   - GSAP / `useAnimations` → `gsap`
   - `<a href=`, headings, `RouterLink` → `semantica`

## Operações

| Comando | Quem usa | O que faz | Toca log? |
|---|---|---|---|
| `/learn` | dev, manual | Cria ou atualiza nota a partir de diff real; mantém cross-refs | sim (`ingest`) |
| `/dream` | dev, periódico | Lint estrutural (órfãos, stale, gaps); propõe promoção pra RULES, merges, splits | sim (`lint`) |
| Hook `learn-index.mjs` | automático | Valida frontmatter; regenera `_index.json` | não |

## Compatibilidade Obsidian

A pasta abre direto como vault no Obsidian:

- **Properties (frontmatter)** → painel "Properties" indexa tudo.
- **Tags** (no frontmatter, sem `#`) → painel "Tags" indexa.
- **Wikilinks** `[[slug]]` em `related:` → graph view e backlinks funcionam nativamente.
- **`index.base`** (Obsidian Bases) é o índice navegável pra humano — o plugin atualiza sozinho conforme novas notas chegam.
- `.obsidian/` é versionado (compartilha config de grafo, plugins, theme); só `workspace.json` e `workspace-mobile.json` ficam no `.gitignore` por serem voláteis (estado de abas).

## Manutenção

- Tag/categoria nova → editar `_SCHEMA.md` (aprovação humana). `/learn` aborta se vocab desconhecido.
- Pasta `outros/` é válvula de escape — `/dream` sinaliza split quando ≥3 notas acumulam ali.
- `log.md` nunca é editado a mão — só append por `/learn` e `/dream`.
