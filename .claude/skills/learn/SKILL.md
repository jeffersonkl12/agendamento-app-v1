---
name: learn
description: >
  Ingest multi-pagina no vault .claude/learn/. A partir de um diff real,
  decide se atualiza nota existente ou cria nova; mantem cross-refs
  bidirecionais; loga em log.md. MANUAL — roda apenas apos corrigir um
  erro de verdade. Use quando: "aprendi X", "salvar licao", "registrar
  erro", "/learn", apos corrigir algo que o modelo tinha feito errado.
disable-model-invocation: true
user-invocable: true
---

# `/learn` — Ingest no vault de aprendizado

Você é **mantenedor de wiki**, não autor solto de notas. Toda execução pode tocar várias páginas: cria ou atualiza nota, ajusta cross-refs bidirecionais, anexa ao log. O hook `learn-index.mjs` regenera `_index.json` automaticamente após cada Write/Edit (o índice navegável humano fica em `index.base`, gerenciado pelo Obsidian).

## Contexto adicional do usuário
$ARGUMENTS

## Pré-condições

- [ ] Há `git diff` real mostrando a correção (`git diff HEAD~1` ou range especificado).
- [ ] O erro original foi cometido pelo modelo (não pelo dev).
- [ ] A correção tem código antes/depois identificável.

Falhou alguma → ABORTAR: "Sem correção real no diff. Execute o comando só após corrigir um erro concreto."

## Workflow (ingest multi-página)

### 1. Coletar raw source

- `git diff HEAD~1` (ou range fornecido).
- `git log -1 --format="%H %s"` pra capturar commit hash → entra em `sources:`.

### 2. Caracterizar a lição

- **O que estava errado** (regra/padrão violado).
- **Por que aconteceu** (alucinação, esquecimento, regra ausente).
- **Como foi corrigido** (snippet real).
- **Categoria** (= subpasta). Vocab fechado em `.claude/learn/_SCHEMA.md`.
- **Tags**. Vocab fechado em `_SCHEMA.md`.
- **Recorrência** (`baixa|media|alta`).
- **Escopo** (`generic|project` — se project, preencher `project:`).

### 3. **Decidir: nova nota ou update?** (compounding)

Sempre rodar este check antes de criar:

1. Ler `.claude/learn/_index.json`.
2. Filtrar pela categoria identificada → lista de slugs daquela pasta.
3. Para cada slug candidato (mesma categoria + ≥1 tag em comum), abrir a nota e comparar:
   - Mesmo padrão de erro? → **propor update** (anexar exemplo, ajustar `recurrence` se subiu, adicionar commit em `sources:`).
   - Padrão similar mas distinto? → criar nova **e** adicionar `[[slug-existente]]` em `related:` (e vice-versa).
   - Padrão diferente? → criar nova sem cross-ref forçado.

Mostrar ao usuário a decisão antes de escrever.

### 4. Validar contra `_SCHEMA.md`

- Categoria deve existir em `categories:`.
- Cada tag deve existir em `tags:`.
- **Tag desconhecida** → perguntar ao usuário inline: "tag `X` não está no vocab. Adicionar ao `_SCHEMA.md` ou usar tag existente equivalente?". NÃO criar a nota até resolver.

### 5. Sugerir slug

- Inglês, kebab-case, descritivo, estável. Pedir confirmação.

### 6. Escrever a nota (criar ou atualizar)

- Caminho: `.claude/learn/{categoria}/{slug}.md`.
- Frontmatter completo seguindo `_TEMPLATE.md`:

```markdown
---
title: Título curto
date: YYYY-MM-DD
category: tokens
tags: [tag1, tag2]
recurrence: media
scope: generic
related: ["[[outra-nota]]"]
sources: ["git:abc1234"]
supersedes: []
superseded_by: []
rules_ref: ["RULES.md#R1"]
origin: pagina/componente
---

# Título

**Erro:** ...
```código errado```
**Correção:** ...
```código certo```
**Por quê:** ...
```

### 7. Cross-refs bidirecionais

Se você adicionou `related: ["[[note-a]]"]` na nota nova, **abrir `note-a` e adicionar a referência reversa** no campo `related:` dela. Sem isso, a wiki vira árvore ao invés de grafo.

### 8. Append em `.claude/learn/log.md`

Linha única, prefixo parseável:

```markdown
## [YYYY-MM-DD] ingest | {slug} — {created|updated}
```

### 9. Confiar no hook

Após Write/Edit, o `learn-index.mjs` regenera `_index.json` e valida frontmatter. Se houver violação, o hook escreve no stderr — corrija e refaça.

## Regras duras

- Sem diff com código errado + certo → não escrever (sem evidência, sem nota).
- Tag fora do vocab → aprovação humana inline antes de prosseguir.
- NUNCA editar `_index.json` à mão (gerado pelo hook).
- NUNCA editar `index.base` à mão (gerenciado pelo Obsidian Bases).
- NUNCA editar `log.md` no meio (append-only).
- NUNCA modificar `RULES.md` direto (papel do `/dream`).
- Slug em inglês kebab-case. Não renomear depois.
- Uma ingestão por execução. Se identificou 3 erros independentes, rodar `/learn` 3 vezes.

## Saída esperada

Mostrar ao usuário:

1. Decisão tomada: criou nota nova OU atualizou existente OU adicionou cross-ref.
2. Caminho do(s) arquivo(s) escrito(s).
3. Linha anexada ao `log.md`.
4. Confirmação de que o hook regenerou índices sem violações (caso contrário, listar e corrigir).
5. Sugestão: "Se essa tag já tem ≥3 notas ou recorrência é `alta`, considere rodar `/dream` em breve pra consolidar".
