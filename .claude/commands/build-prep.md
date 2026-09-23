---
description: >
  Fase 1 do build de página — extrai assets, tokens, ícones, gera manifesto rico e
  stubs a partir de uma URL do Figma OU de um node do Pencil. Roda ANTES de /build-page.
  Trabalho mecânico apenas: não escreve componente nem seção.
argument-hint: <figma-url-do-frame-raiz | pencil:<node-id>>
---

# /build-prep — Fase mecânica do build de página

**Fase 1 de 2**: `/build-prep` → `/build-page`. O objetivo é produzir tudo que é mecânico — assets, tokens, inventário de seções, specs de componente, manifesto e stubs — antes da implementação. Sem isso as tarefas paralelas da Fase 2 colidem nos mesmos arquivos e trabalham sem contrato.

Duas fontes de design: **Figma** (default) e **Pencil**. O workflow é escrito no idioma Figma; cada passo afetado traz um bloco `**Pencil:**` com o equivalente. A detecção acontece no Passo 1.

Leitura obrigatória antes de começar: `.claude/RULES.md`.

## Convenção de nomes

Uma página por chamada. Cada execução precisa de:

- **`{page}`** (kebab-case) — `home`, `wallet`, `reports`. Vira nome do manifesto, pasta de assets, prefixo de screenshot e argumento do `/build-page`.
- **`{Page}`** (PascalCase) — `Home`, `Wallet`, `Reports`. Vira o arquivo em `src/pages/`.
- **`{rota}`** — caminho no vue-router: `/`, `/wallet`, `/reports`.

## O que esta fase entrega

- `docs/build-manifest-{page}.md` — manifesto rico, fonte de verdade da Fase 2
- `src/assets/images/{page}/*.webp` — imagens baixadas, organizadas por seção
- `src/assets/icons/{page}/*.svg` — um arquivo por ícone do design
- Tokens novos em `src/assets/index.css`; text-styles novos também registrados em `src/libs/utils.ts`
- Stubs: `src/pages/{Page}.vue`, `src/views/{page}/` e a entrada de rota comentada
- Screenshots de referência em `docs/figma/{page}-*.webp` ou `docs/pencil/{page}-*.{webp,pdf}`

## O que esta fase NÃO faz

- Não escreve `.vue` de seção — é papel do `section-builder` na Fase 2
- Não cria componente em `src/components/` — é papel do Batch 0 da Fase 2
- Não roda `bun check` nem `bun run build`
- Não dispara o agent `review`
- Não marca item de checklist como concluído

## Pré-requisitos

**Fonte = Figma:**
- URL do frame raiz da página, passada como argumento
- `FIGMA_TOKEN` no ambiente
- Skills `/figma` e `/icon-extract`

**Fonte = Pencil:**
- Arquivo `.pen` aberto — `mcp__pencil__get_editor_state` devolve o `filePath`
- Node ID do frame raiz, passado como `pencil:<node-id>`
- Pasta `Images/` adjacente ao `.pen`, com os assets originais. É a fonte primária de imagem e SVG
- Skill `/pencil`

Argumento ausente: ABORTAR e pedir ao usuário.

---

## Workflow

### Passo 1 — Identificação da página e da fonte

1. Detectar a fonte pelo argumento:
   - contém `figma.com` → `source = figma`. Parsear a URL e extrair `fileKey` e `nodeId`
   - prefixo `pencil:` ou `mcp__pencil__get_editor_state` com `.pen` aberto → `source = pencil`
   - sem match → perguntar qual das duas e qual node/URL
2. Definir com o usuário (ou inferir do nome do frame) o `{page}`, o `{Page}` e a `{rota}`.
3. Fixar os caminhos (`{src}` = `figma` ou `pencil`):
   ```
   manifesto:   docs/build-manifest-{page}.md
   página:      src/pages/{Page}.vue
   seções:      src/views/{page}/
   imagens:     src/assets/images/{page}/
   ícones:      src/assets/icons/{page}/
   screenshots: docs/{src}/{page}-*.webp
   ```

### Passo 2 — Reconhecimento

**Figma:**

1. `mcp__figma__get_metadata` no frame raiz → estrutura e lista de children.
2. `mcp__figma__get_variable_defs` → tokens de cor, tipografia e spacing.
3. Screenshot do overview via REST API:

   ```bash
   node .claude/skills/figma/extract-screenshots.mjs \
     --url "<figma-url>" \
     --output docs/figma \
     --prefix {page}- \
     --name overview \
     --scale 1.5
   ```

   Produz `docs/figma/{page}-overview.webp`. Usar a REST API e não `mcp__figma__get_screenshot`, que devolve 1x e sai borrado.

**Pencil:**

1. `mcp__pencil__get_editor_state` → confirmar o arquivo e capturar o `filePath`, necessário em todas as chamadas seguintes.
2. `mcp__pencil__get_variables` + `mcp__pencil__get_guidelines` → tokens.
3. `mcp__pencil__batch_get` com `nodeIds: [<root>]` e `readDepth: 2` → children diretos. Anotar `width` e `height` de cada um; o Passo 4 usa a altura para decidir o formato do screenshot.
4. Overview sempre em PDF:

   ```jsonc
   // mcp__pencil__export_nodes
   {
     "filePath": "<.pen path>",
     "nodeIds": ["<root>"],
     "outputDir": "docs/pencil",
     "format": "pdf"
   }
   ```

   O raster do Pencil perde nitidez acima de ~1000px, e uma página inteira passa disso com folga. O PDF preserva vetor e o Read tool lê nativamente.

### Passo 3 — Tokens

1. Ler `src/assets/index.css`.
2. Para cada token vindo do design:
   - já existe → marcar como reusado no manifesto
   - não existe → adicionar em `:root`, em `.dark` e no `@theme inline` (R1). Nunca deixar como valor arbitrário
3. Para cada text-style novo (R2), executar os **dois** registros:
   - `@utility text-<nome>` em `src/assets/index.css`
   - o nome, sem o prefixo `text-`, no array `TEXT_STYLES` de `src/libs/utils.ts`

   Pular o segundo faz o `tailwind-merge` tratar a classe como utilitário de cor: qualquer `cn('text-<nome>', 'text-muted-foreground')` apaga a tipografia sem erro de build.
4. Antes de criar um text-style, procurar equivalente no catálogo existente. Dois nomes para o mesmo CSS custam mais que um nome bem escolhido.
5. Listar todos os tokens, reusados e adicionados, na seção `## Tokens` do manifesto.

### Passo 4 — Inventário de seções

1. Listar os children verticais do frame raiz na ordem visual. No Figma vêm do `get_metadata`; no Pencil, do `batch_get` do Passo 2.3, paginando de 25 em 25.

   ```
   Inventário da página {page}:
   1. Topbar       (node-id 100:200)
   2. Balance      (node-id 100:201)
   3. Statement    (node-id 100:202)
   4. Reports      (node-id 100:203)
   Total: 4 seções. Confirma? (sim/ajustar)
   ```

2. **Mostrar ao usuário e aguardar confirmação.** Sem confirmação, não prosseguir.
3. Anotar o node-id de cada seção confirmada.
4. Capturar os screenshots de todas as seções numa chamada em lote.

   **Figma** — uma requisição em vez de N round-trips:

   ```bash
   node .claude/skills/figma/extract-screenshots.mjs \
     --file-key <fileKey> \
     --node-id "<id1>=balance,<id2>=statement,<id3>=reports" \
     --output docs/figma \
     --prefix {page}- \
     --scale 1.5
   ```

   **Pencil** — duas pistas conforme a altura lida no Passo 2.3:

   - `height ≤ 1000px` → WebP, `format: "webp"`, `scale: 2`, `quality: 90`
   - `height > 1000px` → PDF

   Fazer uma chamada `export_nodes` para cada grupo. O PDF combina os nodes num único documento multi-página, na ordem do array — renomear para `{page}-vetor-sections.pdf` e anotar no manifesto qual página corresponde a qual seção.

   Renomear os arquivos retornados para `{page}-{secao}.{webp|pdf}`; o MCP devolve paths com nodeId.

   A política de retry do fim deste documento vale aqui.

### Passo 5 — Ícones

Todo ícone do design é extraído como SVG e vira um componente em `src/components/icons/`.

1. Detectar os ícones: instâncias `INSTANCE` no `get_metadata` (Figma) ou nodes `icon_font`, `path` e grupos com vector children no `batch_get` (Pencil).
2. Garantir a pasta: `mkdir -p src/assets/icons/{page}`.
3. Extrair.

   **Figma:**
   ```bash
   node .claude/skills/icon-extract/extract-icons.mjs \
     --url "<figma-url>" \
     --output src/assets/icons/{page} \
     --format svg-files \
     --verbose
   ```

   Usar `--format svg-files`; o projeto não usa sprite. Ícone de design fica em `src/assets/icons/{page}/`, não em `public/`.

   **Pencil:** nem o MCP nem a CLI exportam SVG. A fonte é a pasta `Images/` adjacente ao `.pen`. Casar cada ícone pelo nome referenciado no node (`fill.url`) ou pelo nome do node em kebab-case e copiar para `src/assets/icons/{page}/`.

4. Cada SVG vira um componente em `src/components/icons/`, com `fill="currentColor"` para herdar a cor de `text-*` do pai. O arquivo `.vue` é escrito na Fase 2; aqui só se registra o destino.
5. Listar todos na seção `## Ícones` do manifesto, com destino e seções que usam:

   ```
   - arrow-right.svg → src/components/icons/IconArrowRight.vue — usado em: Balance, Statement
   - check.svg       → src/components/icons/IconCheck.vue      — usado em: Statement
   ```

**HARD FAIL:** design com ícones e extração sem resultado → ABORTAR com a lista dos não resolvidos.

**Pencil:** ícone ausente da pasta `Images/` aborta imediatamente, com a lista dos faltantes e a instrução de exportá-los. Sem fallback raster: perde `currentColor` e pixela em retina.

### Passo 6 — Imagens por seção

**Figma** — para cada seção do inventário:

1. `mcp__figma__get_design_context` no node-id da seção.
2. Identificar os image-fills e baixar para `src/assets/images/{page}/` com nome descritivo (`balance-background.webp`, `statement-empty.webp`).
3. Registrar em `## Imagens > {Seção}` no manifesto.

**Pencil** — para cada seção:

1. `mcp__pencil__batch_get` no node da seção, `readDepth: 3`, no máximo 25 nodes → localizar nodes com `fill.type: "image"`. Capturar o `url` de cada fill.
2. Resolver pela pasta `Images/` adjacente ao `.pen` e copiar o original. O arquivo em disco não passou por re-encoding; `export_nodes` reprocessa e degrada.
3. Só se o arquivo não estiver na pasta, usar `export_nodes` como fallback (`format: "webp"`, `scale: 2`, `quality: 90`).
4. Registrar a origem de cada imagem no manifesto: `pasta Images/` ou `MCP export_nodes`.

O projeto entrega a fonte já otimizada em `.webp` e não tem transformador no build (R11). Converter no prep quando o original vier em JPG ou PNG:

```bash
bun -e 'import("sharp").then(s=>s.default("src/assets/images/{page}/balance-background.jpg").webp({quality:85}).toFile("src/assets/images/{page}/balance-background.webp"))' \
  && rm src/assets/images/{page}/balance-background.jpg
```

Imagem decorativa entra no inventário do mesmo jeito; quem decide se usa é o `section-builder`.

### Passo 7 — Inventário e specs de componente

Esta fase não cria arquivo em `src/components/`. Quem cria é o Batch 0 da Fase 2, consumindo as specs geradas aqui.

**Critérios de reuso e extração, avaliados em ordem. O primeiro match vence:**

1. **Existe no kit `src/components/ui/`** — 66 componentes disponíveis (button, card, dialog, table, tabs, select, sheet, sidebar, form, e assim por diante). Antes de propor qualquer coisa, listar a pasta e procurar. Se o design pede um botão, uma tabela ou um modal, quase sempre já existe → declarar em `## Componentes do kit reusados`, sem criar slot.
2. **Existe em `src/components/<dominio>/`** — `Glob src/components/**/index.ts`. Match → reusa. Se o design pede uma prop que o componente não tem, anotar `evolucao_pedida: [prop_x]`; o Batch 0 decide se re-dispara em modo `update`.
3. **Existe em manifesto anterior** (`docs/build-manifest-*.md`) → reusa e sinaliza evolução.
4. **Uso real em ≥ 2 seções distintas** desta página, com a mesma estrutura visual → cria slot novo.
5. **Component set no Figma** com variants explícitas **e** uso ≥ 2 → cria slot novo.
6. **Soma cross-página**: aparece com 1 uso em manifesto anterior e ganha mais um agora → cria slot novo.
7. **Nenhum dos anteriores** → não cria slot. Marca como `local: inline` na seção que usa; se repete 2x dentro da mesma seção, marca `local: v-for`.

Nome semântico no design (`Button`, `Card`, `Badge`) não basta sozinho. Sem match e sem 2 usos reais, a estrutura fica inline (R6).

**Inferência da spec — cascata com nível de confiança:**

*Figma:* Code Connect → `alta` · component set com `componentPropertyDefinitions` → `alta` · `get_design_context` no node do componente → `media` · heurística com 2-3 instâncias e pergunta ao humano → `baixa`.

*Pencil:* `batch_get` com `patterns: [{ reusable: true }]`, lendo instâncias com `resolveInstances: true`. Padrão `media`; `alta` só quando o nome já declara a variant (`Component/Button/Primary`). Em dúvida sobre props, perguntar em vez de inventar.

**Contagem de usos, obrigatória antes de gerar spec.** Percorrer o inventário e contar mecanicamente quantas seções distintas usam a estrutura. Registrar `usos_contados: N` e a lista de `aparições`. Abaixo de 2, e sem match nas regras 1-3, a entrada vai para `## Estruturas inline-only`, não para as specs.

**Formato da spec** — todo componente nasce com a anatomia da R5:

```markdown
### BalanceCard

- destino: src/components/wallet/balance-card/
- arquivos: BalanceCard.vue, BalanceCardLabel.vue, BalanceCardValue.vue, index.ts
- node_id: "100:850"
- screenshot: docs/figma/{page}-component-balance-card.webp
- usos_contados: 2
- aparições:
  - Balance (1 instância)
  - Reports (3 instâncias)
- compound: sim               # partes múltiplas → Card + CardHeader + CardContent
- envolve_primitiva: não      # se sim, nomear a primitiva reka-ui e usar forwarding
- precisa_cva: não            # só com 2+ variants ortogonais; senão mapa + cn
- props:
  - class: HTMLAttributes['class'] — sempre presente
  - currency: 'BRL' | 'USD' — opcional, default 'BRL'
- data_slot: balance-card
- slots: default
- tokens_usados: text-title, text-caption, bg-card, text-muted-foreground
- depende_de: []
- exemplo_uso: |
  <BalanceCard>
    <BalanceCardLabel>Disponível</BalanceCardLabel>
    <BalanceCardValue>R$ 1.240,00</BalanceCardValue>
  </BalanceCard>
- spec_confidence: alta | media | baixa
- spec_source: code_connect | component_set | design_context | heuristica_humana
- responsivo: desktop 320px fixo; abaixo de md ocupa 100%
- a11y: valor com aria-label descrevendo a moeda
```

Para estruturas com menos de 2 usos:

```markdown
### LinhaTransaction

- usos_contados: 1
- inline_na_secao: Statement        # valor EXATO da coluna Nome do inventário
- motivo: "Aparece só em Statement. Mantido inline conforme R6."
- recomendacao: inline-na-secao   # ou v-for, se repete dentro da seção
- node_id: "100:851"
- screenshot: docs/figma/{page}-component-transaction-row.webp
- tokens_usados: text-paragraph, text-label
```

`inline_na_secao` é o campo que o `section-builder` compara com o nome da seção que recebe, então precisa bater exatamente com a coluna `Nome` do inventário. É assim que ele sabe que não deve importar de `src/components/`.

Capturar o screenshot do node do componente e renomear para `{page}-component-{kebab-nome}.webp`.

### Passo 8 — Plano de dados

A UI consome conteúdo dinâmico via **constantes estáticas** em `src/data/` (R8). Este projeto ainda não tem service/store/composable de domínio — fica para uma skill separada, não ativa nesta fase. Este passo decide o contrato antes da Fase 2 implementar.

1. Para cada seção, classificar o conteúdo em:
   - **`literal`** — texto fixo do design: título de seção, rótulo de campo, microcopy. Vai direto no template
   - **`dado-estatico`** — conteúdo de card, tabela, gráfico, lista. Precisa de arquivo em `src/data/<dominio>.ts`
   - **`estado`** — deriva de interação do usuário (filtro, paginação, seleção)

2. **Reuso por domínio (obrigatório antes de propor arquivo novo):**
   - `Glob src/data/`
   - Cruzar com `docs/build-manifest-*.md` anteriores
   - Mesmo domínio / mesmos dados → **reusar** o path existente e listar só o que falta (`exports_novos`); `acao: estender`
   - Domínio novo → `acao: criar`

3. Para o conteúdo `dado-estatico`, agrupar por domínio e propor o arquivo completo:

   ```yaml
   dados_propostos:
     - arquivo: src/data/wallet.ts
       acao: criar | estender
       consumido_por: [Balance, Statement]
       exports:                              # se criar: conjunto completo
         - balance: Balance
         - transactions: Transaction[]
       exports_novos: []                     # se estender: só o que falta
       tipos:
         - Balance { total: number, blocked: number }
         - Transaction { id: string, description: string, amount: number, data: string }
     - local: src/views/{page}/Statement.vue
       motivo: open/closed de sheet só nesta seção
   ```

4. Decidir onde o dado mora:
   - **`src/data/<dominio>.ts`** quando é conteúdo de card/tabela/gráfico/lista, compartilhado ou não entre seções
   - **estado local** (`ref` na view) quando é UI pura da seção, sem domínio

5. Marcar no inventário a fonte de dados de cada seção: `literal`, `data:{nome}` ou `estado-local`.

O arquivo de `src/data/` é escrito na Fase 2, não aqui. O que sai deste passo é o contrato: qual constante, com qual tipo, e se cria ou estende.

**Texto literal vem do design, não do screenshot.** Os campos de texto do `get_design_context` (Figma) ou do `batch_get` (Pencil) são a fonte de verdade. Ler texto de imagem é erro recorrente.

### Passo 9 — Stubs

1. `src/pages/{Page}.vue` com as seções comentadas na ordem do design:

   ```vue
   <script setup lang="ts">
   // TODO: importar as seções conforme forem implementadas
   // import Saldo from '@views/{page}/Balance.vue'
   // import Extrato from '@views/{page}/Statement.vue'
   </script>

   <template>
     <!-- <Saldo /> -->
     <!-- <Extrato /> -->
   </template>
   ```

2. `src/views/{page}/` — pasta vazia.
3. Registrar a rota em `src/routers/`, lazy (R9):

   ```ts
   { path: '{rota}', component: () => import('@pages/{Page}.vue') }
   ```

### Passo 10 — Escrever o manifesto

Criar `docs/build-manifest-{page}.md` neste esquema. A Fase 2 depende dele.

```markdown
# Build Manifest — {Page}

> Gerado por /build-prep em {YYYY-MM-DD HH:MM}
> Fonte: {figma|pencil} — {url ou node-id}
> Para implementar: `/build-page {page}`

## Identificação
- page: {page}
- página: src/pages/{Page}.vue
- seções: src/views/{page}/
- rota: {rota}

## Frame raiz
- URL / node-id: {...}
- Screenshot: docs/{src}/{page}-overview.{webp|pdf}

## Tokens

### Adicionados
- `--success`: oklch(0.72 0.15 150) — em :root, .dark e @theme inline
- `text-metric`: 2rem / 600 / 1.2 — em index.css e em TEXT_STYLES

### Reusados
- `bg-card`, `text-muted-foreground`, `text-paragraph`

## Ícones
- Local: `src/assets/icons/{page}/`
- Total: N
- arrow-right.svg → src/components/icons/IconArrowRight.vue — Balance, Statement
- brand-logo.svg  → src/components/icons/IconBrandLogo.vue  — Topbar

## Imagens

### Balance
- src/assets/images/{page}/balance-background.webp — origem: pasta Images/

## Componentes do kit reusados
- `@components/ui/card` → containers de seção
- `@components/ui/table` → Extrato
- `@components/ui/button` → ações
  - evolucao_pedida: [variant: 'subtle']

## Componentes do projeto reusados
- `@components/shared/page-header` → Topbar

## Componentes compartilhados — specs
> Consumidas pelo Batch 0 do /build-page. status vira "implementado" quando o arquivo é criado.

### BalanceCard
- destino: src/components/wallet/balance-card/
- ... (formato completo no Passo 7)
- status: proposto

## Estruturas inline-only
### LinhaTransaction
- usos_contados: 1
- inline_na_secao: Statement

## Componentes — checkpoint humano
> Preencher só se algum componente ficou com spec_confidence: baixa. O gate do Passo 11 exige.

- BalanceCard (baixa) → revisado em {YYYY-MM-DD} por {nome}

## Plano de dados

### Dados propostos
- src/data/wallet.ts — acao: criar → exports: balance, transactions
  - consumido_por: [Balance, Statement]
- local em Statement (sheet open/closed)

## Inventário de seções

| # | Nome | node-id | Arquivo | Reusa | Dados | Paralelizável | Screenshot | Formato |
|---|------|---------|---------|-------|-------|---------------|------------|---------|
| 1 | Topbar | 100:200 | src/views/{page}/Topbar.vue | page-header | literal | não (serial) | docs/figma/{page}-topbar.webp | webp |
| 2 | Balance | 100:201 | src/views/{page}/Balance.vue | BalanceCard, ui/card | data:wallet | sim | docs/figma/{page}-balance.webp | webp |
| 3 | Statement | 100:202 | src/views/{page}/Statement.vue | ui/table | data:wallet | sim | docs/figma/{page}-statement.webp | webp |

> Pencil: seção com `height > 1000px` aponta para `.pdf` e `Formato: pdf`.

## Plano de execução (Fase 2)
1. Batch 0 serial: componentes compartilhados, em ordem de `depende_de`
2. Batch paralelo (máx 3): Balance, Statement
3. Serial no fim: Topbar

## Critério de aceite por seção
- Fiel ao screenshot da seção
- Zero valor arbitrário em cor, tipografia e espaçamento; dimensão só quando vem do design (R1, R2)
- Componente com pasta, index.ts, prop `class`, `cn(..., props.class)`, `data-slot` e `<slot />` (R5)
- Ícone via SVG extraído, componente em `src/components/icons/` com `currentColor` (R10)
- Imagem por import de `@assets`, `alt` em português, box no CSS (R11)
- Desktop-first com `max-*` (R12)
- Tag semântica correta, `<h1>` único, `RouterLink` na navegação interna (R13)

## Stubs criados
- src/pages/{Page}.vue
- src/views/{page}/
- rota em src/routers/

## Status

### Componentes (Batch 0)
- [ ] BalanceCard

### Seções (Batches 1-N)
- [ ] Balance
- [ ] Statement
- [ ] Topbar
- [ ] bun check + bun run build
- [ ] review
```

### Passo 11 — Gate de auditoria

Validar todos os itens antes do resumo final. Qualquer falha aborta com diagnóstico, sem sugerir o próximo comando.

```markdown
## Auditoria

- [ ] Tokens de cor novos existem nos três lugares de index.css (:root, .dark, @theme inline)
- [ ] Text-styles novos existem em index.css E em TEXT_STYLES de src/libs/utils.ts
      (contagem de `@utility text-` == contagem de entradas do array)
- [ ] Ícones extraídos: count em src/assets/icons/{page}/ >= count de ícones únicos do design
- [ ] Imagens baixadas: src/assets/images/{page}/ tem N arquivos, N ≥ image-fills detectados
- [ ] Overview capturado (Pencil: obrigatoriamente PDF)
- [ ] Cada seção do inventário tem screenshot; no Pencil, seções > 1000px saíram em PDF
- [ ] Cada spec tem props, data_slot, exemplo_uso e spec_confidence ∈ {alta, media, baixa}
- [ ] Todo componente com confidence baixa tem entrada em "Componentes — checkpoint humano"
- [ ] Antes de propor componente novo, o kit ui/ foi consultado (66 componentes)
- [ ] Cada seção tem fonte de dados declarada no inventário (`literal` | `data:{nome}` | `estado-local`)
- [ ] Toda seção com dado estático aponta para uma entrada em `src/data/` proposta; reuso por domínio foi checado (Glob + manifests anteriores)
- [ ] Stubs criados e rota registrada
```

Todos ✅ → resumo final e sugestão de `/build-page {page}`. Qualquer ❌ → abortar com o gate que falhou e a ação sugerida.

### Passo 12 — Resumo final

```markdown
## /build-prep concluído — {page}  (fonte: {figma|pencil})

✓ Tokens: N adicionados, M reusados (index.css)
✓ Text-styles: N novos, registrados em index.css e em TEXT_STYLES
✓ Ícones: N extraídos → src/assets/icons/{page}/
✓ Imagens: N em src/assets/images/{page}/
✓ Screenshots: N+1 (overview + N seções)
✓ Inventário: N seções (M paralelizáveis)
✓ Componentes: X reusados do kit, Y do projeto, Z specs novas
✓ Plano de dados: N arquivos em src/data/ (criar|estender)
✓ Manifesto: docs/build-manifest-{page}.md
✓ Stubs: src/pages/{Page}.vue, src/views/{page}/, rota registrada
✓ Auditoria: todos os gates passaram

**Próximo passo:**

  1. Revisar docs/build-manifest-{page}.md (~10 min)
     - specs de componente: props, compound, variants
     - plano de dados: arquivos em `src/data/` (criar vs estender)
  2. /build-page {page}

Ajustes no inventário, nas specs ou no plano de dados devem ser feitos no manifesto antes de seguir — a Fase 2 lê o arquivo como fonte de verdade.
```

---

## Pencil — política de fallback de assets

Aplica aos Passos 4 e 6 quando `source = pencil`. Ícones têm regra própria no Passo 5: sem retry, sem raster, só pasta `Images/` ou abort.

**Ordem rígida por asset:**

1. pasta `Images/` adjacente ao `.pen` — achou, usa, fim
2. `mcp__pencil__export_nodes` — sucesso, usa, fim
3. um retry do `export_nodes`, com os mesmos parâmetros
4. abort, listando os nodeIds não resolvidos

**Budgets:** no máximo 2 chamadas MCP por nodeId. Falha em asset essencial aborta na hora, sem acumular. Não existe terceiro nível de fallback nem script de API improvisado — a CLI do Pencil renderiza o design inteiro, não exporta por nodeId, então não serve aqui.

**Asset essencial:** tudo, por default. A exceção é imagem que o design marca como placeholder a ser trocado — registrar como `placeholder` no manifesto e seguir.

```
❌ /build-prep abortado — assets do Pencil não resolvidos:

Imagens (pasta Images/ + MCP falharam):
  - balance-background.jpg   (node abc-123, seção Saldo)

Ícones (ausentes na pasta Images/):
  - brand-logo.svg    (node ghi-789, usado em Topbar)

Ação:
  1. Abra o .pen no Pencil.
  2. Exporte os assets faltantes para a pasta Images/.
  3. Rode /build-prep novamente.
```

---

## Restrições

- Não escrever `.vue` de seção — papel do `section-builder` na Fase 2
- Não criar arquivo em `src/components/` — papel do Batch 0 da Fase 2
- Não rodar `bun check` nem `bun run build`
- Não disparar o agent `review`
- Não marcar item de checklist como concluído
- Não prosseguir sem a confirmação do inventário (Passo 4.2)
- Não prosseguir se os ícones não foram extraídos com sucesso (HARD FAIL do Passo 5)
- Não prosseguir se o gate do Passo 11 falhar
- Não propor componente novo antes de consultar o kit `ui/`
- **(Pencil)** Não chamar `export_nodes` mais de 2x para o mesmo nodeId
- **(Pencil)** Não usar `get_screenshot` em node grande — usar `export_nodes` em PDF
- **(Pencil)** Não fazer fallback raster para ícone

## Anti-alucinação

- Ler uma seção por vez com `get_design_context` (Figma) ou `batch_get` (Pencil). Nunca todos os nodes juntos
- Capturar o screenshot antes da leitura detalhada — a imagem é mais confiável que a árvore
- `get_metadata` acima de 10k tokens: usar filtros de profundidade e nome
- **(Pencil)** `batch_get` aceita no máximo 25 nodes por chamada. Telas grandes se dividem por seção
- **(Pencil)** O PDF do overview é vetor e barato para o Read tool. Não reconstruir o layout só a partir do `batch_get`
- **(Pencil)** Texto literal vem dos campos `content` dos nodes `type: "text"`, não do screenshot. O PDF serve para layout, cor e alinhamento
- Design com artboard desktop e mobile é **uma** execução, sobre o artboard desktop. O código sai responsivo desktop-first com `max-*` (R12). Extrair os dois artboards apenas quando as imagens diferem entre viewports

## Conversão PDF → imagem (opcional, Pencil)

Quando uma seção saiu em PDF e se quer preview raster, converter por binário externo. O projeto não adiciona dependência para isso: as opções em npm exigem `canvas` nativo ou puxam dezenas de MB, e o PDF já é o artefato canônico.

```bash
# mutool (MuPDF)
mutool draw -o docs/pencil/{page}-overview.png -r 144 docs/pencil/{page}-overview.pdf

# pdftocairo (poppler)
pdftocairo -png -r 144 -singlefile docs/pencil/{page}-overview.pdf docs/pencil/{page}-overview
```

Converter as seções em PDF vale quando o `section-builder` for consumi-las — assim ele lê WebP normal. O overview pode ficar em PDF. Se a conversão falhar, manter o PDF e anotar `Formato: pdf` no inventário.

## Referências

- Regras do projeto: `.claude/RULES.md`
- Workflow Figma: `.claude/skills/figma/SKILL.md`
- Workflow Pencil: `.claude/skills/pencil/SKILL.md`
- Extração de ícones: `.claude/skills/icon-extract/SKILL.md`
- Fase 2: `.claude/commands/build-page.md`
