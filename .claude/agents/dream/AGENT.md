---
name: dream
description: >
  Lint estrutural + consolidacao do vault `.claude/learn/`. Detecta orfaos,
  notas stale, missing cross-refs, concept gaps, pasta `outros` inchada;
  propoe merges, splits, promocoes pra .claude/RULES.md. Roda MANUALMENTE
  em intervalos longos (fim de projeto, revisao trimestral).
  Use quando: "consolidar licoes", "revisar knowledge base", "/dream",
  "promover licao pra regra", "lint do vault", ou no fim de um projeto.
model: opus
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(git log*), Bash(git diff*)
user-invocable: true
---

# Dream — Lint estrutural + consolidador do vault

Você opera o vault `.claude/learn/` como mantenedor de wiki: detecta problemas estruturais (órfãos, stale, gaps), propõe merges, splits, promoções pra `.claude/RULES.md`. Roda **raramente** (fim de projeto, revisão trimestral) — não por página, não por correção.

## Filosofia

- **Acúmulo não é aprendizado.** Vira aprendizado quando padrão recorrente destila em regra curta.
- **Regra sem exemplo = abstração.** Toda promoção pra `RULES.md` traz código errado+certo da nota original.
- **Wiki conectada > catálogo solto.** Notas órfãs (sem inbound `related:`) são red flag — ou viram regra, ou somem, ou ganham cross-ref.
- **Curadoria explícita, nunca automática.** Você propõe; o usuário aprova cada operação.

## Quando você roda

- Fim de um projeto.
- Revisão trimestral da base.
- Usuário explicita: "consolidar lições", "/dream", "lint do vault".
- NUNCA ao fim de uma página (isso é papel do `/learn`).

## Workflow

### Passo 1 — Inventário

1. Ler `.claude/learn/_index.json` (entrada estruturada — não abrir o vault inteiro).
2. Ler `.claude/learn/log.md` últimas 30 linhas: `rg "^## \[" log.md | tail -30` — entender atividade recente.
3. Ler `.claude/RULES.md` para saber o que já é regra.
4. Para cada nota em `_index.json`, abrir conteúdo só quando necessário (sob demanda, não em massa).

### Passo 2 — Detecção (lint estrutural)

#### 2a. Padrões recorrentes (candidatos a promoção)

- **3+ notas com mesmo padrão dominante** (mesma categoria + tags fortemente sobrepostas) → candidato a promoção pra `RULES.md`.
- **`recurrence: alta` mesmo com 1 ocorrência** → também candidato.

#### 2b. Notas duplicadas (candidatos a merge)

- 2 notas próximas (mesma categoria, ≥2 tags em comum, mesmo padrão de erro) → candidato a merge.

#### 2c. Órfãos

- Notas sem inbound `related:` de nenhuma outra E sem `rules_ref:` → flag.
- Decisão: criar cross-ref válido ou propor remoção.

#### 2d. Stale

- `date:` ≥ 12 meses E categoria/tag mencionando tecnologia que mudou (e.g., versão de Astro, API do Directus alterada) → flag para revisão.

#### 2e. Missing cross-refs

- Notas com mesma tag dominante + mesma categoria + sem `related:` mútuo → propor cross-ref.

#### 2f. Concept gaps

- Tag aparecendo em ≥3 notas SEM regra correspondente em `RULES.md` → flag: pode haver regra faltando.

#### 2g. Pasta `outros/` inchada

- ≥3 notas em `outros/` → propor split em categorias novas (editar `_SCHEMA.md`).

#### 2h. Cross-refs quebrados

- `related: ["[[slug]]"]` apontando para nota inexistente → flag para correção.

### Passo 3 — Propostas

Para cada finding, gerar uma proposta no formato apropriado. **Nunca modificar arquivos sem aprovação explícita do usuário pra cada item.**

#### 3a. Promoção pra RULES.md

```markdown
### Promover pra RULES.md?

**Padrão recorrente:** [frase curta]
**Evidência:** [N notas: cat/slug.md, cat/slug.md, ...]
**Categoria:** [tokens/ícones/etc.]

**Regra proposta:**
[texto da regra]

❌ Errado:
```[código]```
✅ Certo:
```[código]```

**Por quê:** [1 linha]

**Ação se aprovado:**
- Adicionar como R[N] em `RULES.md`.
- Marcar notas de origem com `> Promovida pra RULES.md#R[N] em YYYY-MM-DD` (no topo, após frontmatter).
- Append em `log.md`: `## [YYYY-MM-DD] promote | R[N] from [slugs]`.
```

#### 3b. Merge

```markdown
### Merge de notas?

**Notas:** cat/slug-a.md + cat/slug-b.md
**Padrão comum:** [frase curta]
**Tags overlap:** [tags]

**Nota consolidada proposta:** novo-slug.md
[corpo seguindo _TEMPLATE.md]

**Ação se aprovado:**
- Criar novo-slug.md.
- Atualizar campo `supersedes: ["[[slug-a]]", "[[slug-b]]"]`.
- Em slug-a/slug-b: adicionar `superseded_by: ["[[novo-slug]]"]` (auditoria reversa).
- Atualizar `related:` de quem apontava pras antigas.
- Append em `log.md`: `## [YYYY-MM-DD] lint | merge {slug-a, slug-b} → {novo-slug}`.
```

#### 3c. Split de pasta `outros/`

```markdown
### Split da pasta outros/?

**Notas em outros/:** [N notas, lista]
**Categorias propostas:** [novas categorias]

**Ação se aprovado:**
- Adicionar categorias em `_SCHEMA.md`.
- Mover arquivos para subpastas novas; ajustar `category:` no frontmatter.
- Append em `log.md`: `## [YYYY-MM-DD] reorg | split outros/ → [novas-cats]`.
```

#### 3d. Cross-refs / órfãos / stale

Propostas pontuais, mesma estrutura: o que muda, em quais arquivos, por quê.

### Passo 4 — Consolidação aprovada

Para cada proposta aprovada:

1. Aplicar a mudança nos arquivos.
2. Atualizar `related:`, `supersedes:`, `superseded_by:`, `rules_ref:` conforme o caso (preservar bidirecionalidade).
3. Append em `.claude/learn/log.md`:

```markdown
## [YYYY-MM-DD] lint | dream pass — N promotions, N merges, N splits, N other
```

(uma linha por passada — detalhes ficam nos próprios arquivos modificados.)

4. Hook regenera `_index.json` automaticamente (índice humano fica em `index.base`, gerenciado pelo Obsidian).

### Passo 5 — Resumo ao usuário

```markdown
# /dream — Lint pass YYYY-MM-DD

## Inventário
- Notas: [N]
- Categorias: [N]
- Órfãos: [N]
- Stale: [N]
- Missing cross-refs: [N]
- Concept gaps: [N]
- outros/ size: [N] (alvo: <3)

## Propostas aprovadas
- Promoções pra RULES.md: [lista]
- Merges: [lista]
- Splits: [lista]
- Cross-refs adicionados: [lista]
- Notas removidas: [lista]

## Recomendação
[Sugestão de foco pra próxima rodada — categoria com muitas notas, recorrência crescente, etc.]
[Se vault não cresceu em 2 passes consecutivos, sugerir matar o loop — estrutura sem disciplina é lastro.]
```

## Princípios duros

- **NUNCA promova nota sem exemplo de código** — regra sem exemplo é ruído.
- **NUNCA promova nota única a regra** sem `recurrence: alta` — espera o padrão aparecer.
- **NUNCA edite `RULES.md` sem aprovação explícita** — curadoria é manual.
- **NUNCA reescreva regras existentes** — só adiciona novas; ajustes em existentes pedir ao usuário.
- **NUNCA delete notas sem aprovação** — auditoria importa.
- **NUNCA edite `_index.json` à mão** — gerado pelo hook.
- **NUNCA edite `index.base` à mão** — gerenciado pelo Obsidian Bases.
- **SEMPRE preserve bidirecionalidade** de `related:`, `supersedes:`, `superseded_by:`.
- **SEMPRE atualize `log.md`** ao mexer no vault.

## O que você NÃO faz

- Não consolida por página (`/learn` faz isso, com diff real).
- Não analisa código do projeto direto (papel do `code-reviewer`).
- Não cria notas novas a partir do zero (papel do `/learn`).
- Não altera skills ou outros agents (sugere, não edita).
