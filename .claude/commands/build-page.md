---
description: >
  Fase 2 do build de página (2 fases: prep → page). Orquestra a implementação da
  página inteira em batches: camada de dados estática (arquivos em src/data/),
  Batch 0 de components shared serial via component-builder, Batches 1-N de seções
  via section-builder paralelo (max 3). bun check + bun run build uma única vez no
  fim. Roda APÓS /build-prep.
argument-hint: <page-name>
---

# /build-page — Orquestrador da implementação de página

Você está executando a **Fase 2** do workflow (2 fases: prep → page). Objetivo: criar/estender a camada de dados estática (`src/data/`), implementar os componentes shared e todas as seções da página em batches isolados, sem lint/build no meio do caminho. Seu contexto deve permanecer leve — SFC `.vue` gerado pelos subagentes NÃO entra aqui.

## Princípio central

Você é um **orquestrador**, não um implementador. Camada de dados mockada sai do manifesto. Cada componente shared é construído por 1 `component-builder` serial (Batch 0). Cada seção é construída por 1 `section-builder` paralelo (Batches 1-N, max 3). Cada subagente retorna apenas um resumo YAML (~200 tokens). Seu contexto cresce devagar:

```
Contexto seu = manifesto (~5k) + N resumos de subagentes (~200 cada) + check/build output (uma vez)
            ≈ 10-15k tokens, constante durante toda a execução
```

Se você se pegar lendo `.vue` gerado por um subagente ou tentando "ajustar" código direto, **PARE** — isso é violação do contrato. Devolva pro subagente.

**Contrato de dados (R8):** page e view importam constantes direto de `src/data/<dominio>.ts` (via `@data`). Sem camada intermediária — service/store/composable ficam para uma skill separada, ainda não ativa.

---

## Pré-requisitos (HARD GATE — falhar alto, não improvisar)

Antes de qualquer Task tool, validar **TODOS** os itens. Se **qualquer** falhar, **ABORTAR** e perguntar ao usuário — **proibido** prosseguir com fallback silencioso.

1. `/build-prep` rodou com sucesso
2. `docs/build-manifest-{page}.md` existe
3. `.claude/agents/section-builder/AGENT.md` existe
4. `.claude/agents/component-builder/AGENT.md` existe
5. Stub da página e pasta de seções existem (criados pelo prep):
   - `src/pages/{Page}.vue`
   - pasta `src/views/{page}/`
6. **`subagent_type` aceito está disponível.** Em ordem de preferência:
   - **PREFERIDO:** `section-builder` / `component-builder` — Claude Code (custom subagents registrados).
   - **SANCIONADO:** `generalPurpose` — Cursor (executor blank-slate). Contrato preservado via AGENT.md INTEIRO injetado inline.
   - Se nenhum disponível, **ABORTA** e mostra opções ao usuário (trocar ambiente / autorizar outro tipo / cancelar). Sem resposta = sem build. Usar `generalPurpose` sem AGENT.md inline = fallback silencioso (proibido).

## Argumento

`<page-name>` (kebab-case, ex: `home`, `wallet`, `reports`). Página correspondente: `src/pages/{Page}.vue` (PascalCase). Seções: `src/views/{page}/`.

---

## Workflow

### Passo 0 — Validar pré-condições e ler manifesto

1. `Read docs/build-manifest-{page}.md` — manifesto completo. Memoriza:
   - Inventário de seções (tabela com node-id, arquivo, reusa, **Dados**, paralelizável, screenshot + formato)
   - Plano de execução (batches de sections definidos no manifesto)
   - Critério de aceite
   - `## Plano de dados` — arquivos em `src/data/` (`acao: criar | estender`); camada dinâmica fica pra skill futura
   - `## Componentes compartilhados — specs` — quais com `status: proposto` (vão pra Batch 0)
   - `## Componentes do kit reusados` / `## Componentes do projeto reusados` (matches que NÃO precisam ser construídos; pode ter `evolucao_pedida` em update)
   - `## Estruturas inline-only` — candidatos com `usos_contados < 2`; section-builders inline
   - `## Status` (idempotência — quais shared/seções já estão `[x]`)
2. Pra cada componente em `## Componentes compartilhados — specs`, `Glob` no `destino` da spec (ex.: `src/components/wallet/balance-card/`) — marcar quais pastas já existem com arquivos não vazios (pular no Batch 0).
3. `Glob src/views/{page}/*.vue` — marcar seções já implementadas (pular nos batches 1-N).
4. `Glob` nos paths de `## Plano de dados` (`src/data/*.ts`) — marcar o que já existe (criar vs estender no Passo 1).
5. Confirmar stub: `src/pages/{Page}.vue` e pasta `src/views/{page}/`.

Qualquer divergência: reportar ao usuário e pedir confirmação antes de prosseguir.

### Passo 1 — Camada de dados estática

Implementa o contrato de `## Plano de dados` **antes** dos components e das sections. O front consome direto as constantes de `src/data/{dominio}.ts` — sem service, store ou composable (fica para uma skill separada, ainda não ativa).

Se o plano de dados estiver vazio (todas as seções só `literal` / `estado-local`), **pular** este passo e seguir pro Passo 2.

#### 1.1 — Filtrar o que criar ou estender

Para cada entry de `### Dados propostos`:

| `acao` | Arquivo existe? | Ação |
| --- | --- | --- |
| `criar` | não | criar do zero |
| `criar` | sim | tratar como `estender` (aditivo) |
| `estender` | sim | acrescentar só `exports_novos` |
| `estender` | não | criar com o conjunto completo listado |

Se a lista resulta em nada a fazer → pular Passo 1.

**Não inventar** exports, tipos ou arquivos fora do manifesto. Em modo `estender`, **não remover** exports existentes.

#### 1.2 — Arquivos de dados

Pra cada entry (`criar` ou `estender`), arquivo `src/data/{dominio}.ts` no padrão R8:

- Interfaces/tipos do manifesto (novos só os listados em `tipos` / `exports_novos` ao estender)
- `export const` tipados com valores estáticos — **sem** `http`, axios ou fetch
- Cabeçalho obrigatório:

```ts
// DADOS ESTÁTICOS — trocar por camada dinâmica (service/store/composable) quando a skill existir.
// Assinaturas e tipos são o contrato; não alterar sem atualizar o manifesto.
```

Exemplo (domínio vem do manifesto):

```ts
// src/data/wallet.ts
// DADOS ESTÁTICOS — trocar por camada dinâmica (service/store/composable) quando a skill existir.

export interface Balance {
  total: number
  blocked: number
}

export interface Transaction {
  id: string
  description: string
  amount: number
  data: string
}

export const balance: Balance = { total: 1240, blocked: 0 }

export const transactions: Transaction[] = [
  { id: '1', description: 'Transferência recebida', amount: 250, data: '2026-08-20' },
  { id: '2', description: 'Pagamento', amount: -89.9, data: '2026-08-19' },
]
```

Quem escreve: o **orquestrador** **ou** 1 Task `generalPurpose` com prompt curto listando só o manifesto. Não usar `section-builder`/`component-builder` aqui.

Estado marcado como `local` no manifesto **não** vira arquivo em `src/data/` — a section-builder usa `ref`/`reactive` na própria view.

Page e view importam essas constantes direto (via `@data`, além de UI/components).

### Passo 2 — Batch 0 (Components serial)

Implementa os components shared do manifesto antes das sections rodarem. **Sempre serial** — components podem ter dependência (`Card` usa `Heading`). Output do A pode ser consumido pelo B no mesmo batch.

#### 2.1 — Filtrar e validar lista

1. Lista de candidatos = entries em `## Componentes compartilhados — specs` com `status: proposto` (skip `implementado` e `bloqueado`).
2. Cruzar com o Glob do Passo 0.2: se a pasta `destino` já tem os arquivos da spec e não está vazia, marcar como `implementado` no manifesto e **pular**.
3. Se a lista resultante está **vazia**, pular Batch 0 inteiro e seguir pro Passo 3.

#### 2.2 — Gate humano (opcional, só se há suspeito de inline)

Pra cada candidato:
- Ler `usos_contados: N` da spec
- Se `N < 2` E não há match em componentes do kit/projeto reusados: **SUSPEITO** (candidato a inline conforme RULES R6)

Se há suspeitos, mostrar ao usuário e esperar resposta:

```
Componentes propostos com 1 uso só (candidatos a inline conforme RULES R6):

- BalanceCard (só em Balance)
- MetricChip (só em Reports)

Pra cada, responder:
  inline  → não despacha; move spec pra `## Estruturas inline-only`; section-builder inline
  shared  → mantém, despacha component-builder normalmente
```

Aplicar respostas via `Edit docs/build-manifest-{page}.md`:
- **inline:** mover entry pra `## Estruturas inline-only`, mudar `status: proposto` → `status: inline-na-secao`, anotar `motivo: "Confirmado inline em /build-page Batch 0 gate (1 uso)"` e gravar **`inline_na_secao: {Nome}`** — o valor é exatamente a coluna `Nome` do `## Inventário de seções` onde a estrutura aparece (derivar de `aparições`; sem prefixo de página). É esse campo que o section-builder usa pra match mecânico. NÃO despachar subagente.
- **shared:** mantém na seção atual.

Sem suspeitos → pular gate.

#### 2.3 — Topological sort

Pra cada componente filtrado restante, ler `depende_de: [...]`:
- Componentes sem `depende_de` (ou `[]`) → folhas (primitivos)
- Componentes que listam outros → dependentes

Ordenar por níveis: nível 0 primeiro, nível N por último. Se houver ciclo (A↔B), **ABORTA** e reporta ao usuário.

#### 2.4 — Despachar component-builder em SERIAL

Pra cada componente NA ORDEM:

1. Lançar 1 Task tool (não paralelo — sempre 1×1):
   - **subagent_type:** `component-builder` se disponível; senão `generalPurpose` **com AGENT.md INTEIRO inline**
   - **description:** `"build component {Comp}"`
   - **prompt:** conteúdo completo de `.claude/agents/component-builder/AGENT.md` + bloco YAML:
     ```yaml
     manifesto_path: docs/build-manifest-{page}.md
     componente_nome: {Comp}
     spec_anchor: "## Componentes compartilhados — specs / ### {Comp}"
     output_path: src/components/{dominio}/{kebab}/   # destino da spec (pasta)
     mode: create
     ```
2. Aguardar terminar.
3. Coletar YAML retornado:
   - `status: ok` → atualizar manifesto: `status: proposto` → `implementado`, adicionar `props_implementadas: [...]`; checkar em `## Status > Componentes`: `[ ] {Comp}` → `[x] {Comp}`
   - `status: parcial` → atualizar manifesto + guardar pra handoff
   - `status: bloqueio` → **PARAR Batch 0**. Reportar `bloqueios` ao usuário. Não disparar próximos componentes (cascata: dependentes vão quebrar). Aguardar decisão humana antes de seguir.

Edits ao manifesto são **sequenciais** (single-writer). Anti-corrida by design.

### Passo 3 — Batches 1-N (Sections paralelo)

Implementa todas as seções consumindo components shared (já prontos do Batch 0) + constantes da camada de dados (Passo 1).

#### 3.1 — Plano de paralelismo

Do manifesto, ler "Plano de execução" — batches definidos pelo `/build-prep`. Estrutura típica:

```
Batch 1 (paralelo, max 3): Balance, Statement, Reports
Serial (último): Topbar
```

**Regras invioláveis:**
- Máximo **3 section-builders em paralelo** por batch
- Seções marcadas `Paralelizável: não (serial)` no inventário **sempre serial e por último** (shell/navegação depende das outras seções)
- Seções já implementadas (arquivo `src/views/{page}/{Nome}.vue` existe) **pular** (idempotência)

#### 3.2 — Despachar section-builders por batch

Pra cada batch:

1. Pra cada seção do batch, lançar 1 Task tool em paralelo (mesma mensagem) com:
   - **subagent_type:** `section-builder` se disponível, senão `generalPurpose` **com AGENT.md INTEIRO inline**
   - **description:** `"build {SecaoNome}"`
   - **prompt:** conteúdo completo de `.claude/agents/section-builder/AGENT.md` + bloco YAML:
     ```yaml
     manifesto_path: docs/build-manifest-{page}.md
     page: {page}
     secao_nome: {Nome}
     node_id: "{node-id}"
     output_path: src/views/{page}/{Nome}.vue
     componentes_specs:        # subset das specs do manifesto que esta seção reusa
       - {Comp1}
       - {Comp2}
     fonte_dados: literal | data:{nome} | estado-local
     dados_contrato:           # do ## Plano de dados; null se literal / estado-local puro
       data: src/data/{dominio}.ts   # ou null
     referencia_visual:        # do inventário (Passo 4 do /build-prep)
       tipo: figma | pencil
       screenshot_path: docs/{figma|pencil}/{page}-{secao_kebab}.webp
       screenshot_format: webp | pdf
     ```
2. **AGUARDAR** todos os subagentes do batch terminarem (Task tool é síncrono).
3. Coletar os YAMLs retornados.

#### 3.3 — Handler de status por seção

Pra cada YAML retornado:

| Status | Ação do orquestrador |
|--------|---------------------|
| `ok` | Contabilizar sucesso. Continuar batch. |
| `parcial_visual` | Continuar batch normal. Agregar `assets_faltantes` no handoff (Passo 7). NÃO é blocker. |
| `bloqueio` (input inválido / ícone / componente shared faltando) | Reportar a seção ao humano com `bloqueios`. Continuar com as outras seções — regra de aborto abaixo. **Sem retry automático de seção bloqueada.** |

**Regra de aborto (mecânica):** com `N` seções no batch e `B` retornos `bloqueio`, abortar somente se **`B > N/2`** (1 de 3 continua, 2 de 4 continua, 2 de 3 aborta, 3 de 4 aborta).

**Semântica de abortar (determinística, sem retry):**
1. **NÃO** despachar os batches restantes nem a serial final.
2. **PULAR o Passo 5** — check/build de página pela metade não agrega sinal.
3. Ir direto pro **Passo 7 (handoff)** com marcador `abortado_em_batch_{k}` + causa por seção bloqueada.
4. **Passo 8** imprime o resumo incompleto + prompt copiável de retomada. Retomar é barato: re-rodar `/build-page {page}` é idempotente (pula seções com `.vue` existente e components `[x]`).

#### 3.4 — Evolução de componente mid-build

Se uma section-builder retornou `componentes_evolucao_pedida: [{nome, motivo, props_novas}]`:

**Semântica precisa (limites fixos — anti ping-pong):**

1. **Detecção é por batch inteiro.** O batch é despachado numa única mensagem e aguardado em bloco — evolução só aparece quando TODAS as seções do batch retornaram. "Pausar o batch" significa **não despachar o PRÓXIMO batch** até resolver; os resultados das demais seções do batch atual **ficam valendo** (não re-rodam).
2. **Dedupe antes de despachar:** se 2+ seções do mesmo batch pedem evolução do MESMO componente, agregar os pedidos num único `update` (uma chamada, todas as props).
3. Re-disparar `component-builder` em modo `update` (1×1, serial) pra cada componente agregado:
   ```yaml
   componente_nome: {Comp}
   spec_anchor: "## Componentes compartilhados — specs / ### {Comp}"
   output_path: src/components/{dominio}/{kebab}/
   mode: update
   evolucao_pedida:
     - prop: variant
       motivo: "Balance pediu variant 'compact' não prevista na spec"
       default: 'default'
   ```
4. Coletar retorno. Atualizar manifesto com `props_adicionadas`.
5. **Re-rodar só a(s) seção(ões) solicitante(s)** (não o batch inteiro) com input ajustado.
6. **Máximo 1 ciclo de evolução por seção:** se a seção re-rodada retornar `componentes_evolucao_pedida` de novo, tratar como `bloqueio` (entra na regra do Passo 3.3 e no handoff) — **NÃO** disparar segundo `update`. Loop de evolução é proibido.
7. Despachar o próximo batch.

#### 3.5 — Serial final

Após todos os batches paralelos, rodar serial: seções com `Paralelizável: não (serial)` no inventário (1 por vez), na ordem do inventário.

### Passo 4 — Integração da página

1. `Read src/pages/{Page}.vue` (stub criado pelo /build-prep).
2. Editar pra:
   - **Descomentar e completar imports** de todas as seções implementadas, na ordem do inventário, via aliases (`@views/...`).
   - **Compor no `<template>`** na mesma ordem (R7):

     ```vue
     <script setup lang="ts">
     import Balance from '@views/{page}/Balance.vue'
     import Statement from '@views/{page}/Statement.vue'
     import Topbar from '@views/{page}/Topbar.vue'
     </script>

     <template>
       <Topbar />
       <Balance />
       <Statement />
     </template>
     ```

   - Views que precisam de dado de domínio importam as constantes de `src/data/{dominio}.ts` por dentro (R8, via `@data`). A página não importa dado direto, e não faz fetch.
3. Conferir via `Grep`/`Read` que a rota lazy em `src/routers/` aponta pra `@pages/{Page}.vue` (prep já registra; se faltar, adicionar no padrão R9).
4. Conferir via `Glob` que cada seção do inventário tem arquivo `.vue` em `src/views/{page}/`.
5. Se alguma seção do inventário não tem arquivo correspondente, listar ao usuário — não auto-completar.

### Passo 5 — Validação automatizada (única vez)

```bash
bun check
bun run build
```

Se erros:
- **Erro localizado em 1 seção** → re-disparar `section-builder` daquela seção com bloco extra `correcao_solicitada` no input contendo o output do erro.
- **Erro localizado em 1 componente** → re-disparar `component-builder` em modo `update` pra esse componente.
- **Erro localizado em arquivo de `src/data/`** → o orquestrador corrige o arquivo da camada de dados (contrato R8); não reabrir Batch 0/sections só por typo de tipo no mock.
- **Erro global** (config, import path quebrado, alias) → reportar ao usuário, NÃO tentar fix automático em arquivo compartilhado.

Repetir até build limpo OU **2 tentativas** (se persistir, reportar).

### Passo 6 — Code review (opcional, não bloqueante)

Lançar 1 Task tool com:
- **subagent_type:** `review`
- **description:** `"review {page}"`
- **prompt:** `"Revise os arquivos novos em src/views/{page}/, src/components/ (novos do Batch 0), src/data/ desta página, e src/pages/{Page}.vue contra .claude/RULES.md. Use git diff. Escopo: código Vue/TS, boas práticas e acessibilidade — fidelidade visual NÃO é do review. Dados estáticos (sem http real). Pages/views só importam dado de @data — sem fetch, sem estado global. Reporte BLOCKERS e MAJORs."`

Coletar resultado. Review **não bloqueia entrega** por default — só BLOCKERS reais (R1/R5/R6/R8/R13) param. Listar findings ao usuário e oferecer corrigir; se usuário pular, segue pra handoff.

### Passo 7 — Handoff obrigatório (`docs/build-handoff-{page}.md`)

**SEMPRE** criar ou sobrescrever `docs/build-handoff-{page}.md` no fim. Objetivo: nenhum `parcial_visual`, `desvios_do_manifesto`, `duvidas`, finding de review ou intervenção sua some no chat.

Conteúdo mínimo:

1. **Cabeçalho**: página `{page}`, data ISO, caminho do manifesto.
2. **Tabela de dados (Passo 1)**: `arquivo`, `tipo` (dado estático), `status` (criado|estendido|já existia|pulado), `nota` (`camada dinâmica pendente (skill futura)` / `—`).
3. **Tabela de components (Batch 0)**: `componente`, `status`, `mode_efetivo`, `props_implementadas|adicionadas`, `desvios_da_spec`, `bloqueios`.
4. **Tabela de sections (Batches 1-N)**: `secao`, `status`, `assets_faltantes`, `desvios_do_manifesto`, `componentes_evolucao_pedida`, `bloqueios`, `notas`.
5. **Code review**: BLOCKERS / MAJOR / MINOR / INFO (resumo); indicar se foram corrigidos ou ainda abertos.
6. **Intervenções do orquestrador** (honestidade): alterações fora do escopo `.vue` de seções/components (ex.: `src/assets/index.css`, ícone global, rota em `src/routers/`).
7. **Análise e sugestões de correção (obrigatório):**
   - **Causas raiz** agrupadas (asset não extraído no `/build-prep`, ícone fora do manifesto, copy placeholder, mock incompleto, etc.)
   - **Backlog priorizado P0/P1/P2** com ação sugerida em uma linha
   - Separar o que o humano decide (copy, regras de negócio, wiring HTTP) do que é técnico
8. **Bloco `PROMPT COPIÁVEL`**: texto único que o usuário pode colar num novo turno pra resolver pendências (paths exatos, bullets acionáveis).

> Escrever este arquivo **não** viola o contrato "não implementar seções": é entrega de orquestração (agregar + analisar + sugerir).

### Passo 8 — Resumo final ao usuário

````markdown
## /build-page concluído — {page}

### Dados (Passo 1)
- ✓ src/data/wallet.ts (dado estático, criado)

### Components (Batch 0)
- ✓ BalanceCard (src/components/wallet/balance-card/, X arquivos)
- ✓ …

### Seções (Batches 1-N) — N/N
- ✓ Balance (src/views/{page}/Balance.vue, 120 linhas)
- ✓ Statement (...)
- ⚠ Reports (parcial_visual — asset faltante)

### Validação
- ✓ bun check: 0 erros
- ✓ bun run build: ok
- Code review: 0 blockers, 1 major (R8), 3 minor

### Pendências do usuário
- [Reports] Imagem precisa de versão maior pra desktop
- [wallet.ts] Trocar dado estático por camada dinâmica quando a skill existir
- [Balance] Texto do CTA ficou como placeholder — definir copy real

### Handoff persistido
- Ver **`docs/build-handoff-{page}.md`** — tabelas + análise priorizada + prompt copiável.

### Próximos passos
1. Resolver pendências (lista acima) ou colar o prompt do handoff num novo turno
2. Substituir as constantes estáticas de `src/data/` por uma camada dinâmica quando a skill existir
3. (opcional) Validação visual manual — comandos prontos abaixo
4. (opcional) Se design tinha animações: aplicar skill de animação por seção

### Validação visual (OPCIONAL — manual, sem loop)
Dev server (`bun dev`, porta default do Vite **5173** salvo config local) precisa estar no ar. Preencher `<SELETOR-DA-SECAO>` com um seletor CSS estável da seção renderizada:

```bash
node scripts/visual-test.mjs --route {rota} --component "<SELETOR-DA-SECAO>" \
  --name {secao_kebab} --figma-node "{node-id}" --viewports desktop --tolerance 1 \
  --preview-url http://localhost:5173
```

### Métricas
- Tempo total: ~Nmin
- Arquivos de dados (criados|estendidos): N
- Components implementados: N
- Section-builders lançados: N
- subagent_type_usado: section-builder|component-builder|generalPurpose
- Tokens consumidos (aprox): Nk parent + Mk subagentes
````

**Como preencher o bloco "Validação visual":** gerar **1 comando por seção** a partir do inventário do manifesto (`{rota}` da página, `{secao_kebab}` e `{node-id}` por seção). Quando `referencia_visual.tipo: pencil`, trocar `--figma-node "{node-id}"` por `--baseline tests/visual/baselines/{page}-{secao_kebab}.png` (baseline capturado antes via MCP — ver `.claude/skills/visual-test/SKILL.md` se existir). O bloco é **sugestão copiável** — o orquestrador NUNCA executa esses comandos (decisão do dono: validação visual é manual e opcional). Se o script `scripts/visual-test.mjs` não existir no repo, omitir o bloco e só listar as rotas/seções pra checagem manual no browser.

---

## Restrições críticas

- **NÃO** implementar seções nem componentes shared diretamente — sempre via subagente
- **APENAS** `section-builder`/`component-builder` ou `generalPurpose` (com AGENT.md INTEIRO inline) como `subagent_type` pra UI. Qualquer outro tipo requer aprovação explícita no gate de pré-requisito
- **NÃO** implementar HTTP real nesta fase — só dado estático com o tipo do manifesto
- **NÃO** inventar exports, tipos ou arquivos fora de `## Plano de dados`
- **NÃO** deixar page/view acessar dado fora de `src/data/{dominio}.ts` — sem fetch, sem estado global
- **NÃO** ler arquivos `.vue` em `src/views/` ou `src/components/` durante a execução (só pra resolver bloqueios pontuais via re-disparo de subagente)
- **NÃO** acumular código no contexto — subagentes retornam só YAML
- **NÃO** disparar mais de 3 section-builders em paralelo
- **NÃO** disparar component-builder em paralelo — sempre serial (1×1)
- **NÃO** rodar seções `serial` fora da serial final
- **NÃO** rodar `bun check` / `bun run build` no meio do pipeline — apenas Passo 5 (uma vez, max 2 retries)
- **NÃO** auto-corrigir blockers do code review — perguntar ao usuário
- **NÃO** consolidar o manifesto no fim — atualizar **a cada subagente que retorna**, sequencial, single-writer
- **SEMPRE** lê manifesto como fonte de verdade — se manifesto está desatualizado, mandar usuário re-rodar `/build-prep`
- Paths e aliases conforme R3 / R7 / R8

## Idempotência

- Re-rodar `/build-page {page}` deve **pular** ou **estender aditivamente** conforme `acao` do manifesto; pular components já implementados (pasta destino existe + manifesto marca `[x]`) e seções já implementadas (arquivo `.vue` existe)
- Pra forçar reimplementação: usuário deleta o arquivo E desmarca a linha do checklist primeiro

## Anti-padrões / sintomas de atalho proibidos

Se você se pegar dizendo qualquer uma dessas frases internas, **PARE** — é violação:

- "Acho que vou só ajustar essa linha rapidinho aqui no Vue" → **NÃO**. Devolve pro subagente com `correcao_solicitada`.
- "Vou ler todos os SFCs gerados pra garantir consistência" → **NÃO**. Code review faz isso. Seu contexto não aguenta.
- "O manifesto tá meio errado, deixa eu ajustar e seguir" → **NÃO**. Para, mostra pro usuário, pede re-prep ou edição manual.
- "Vou paralelizar 2 component-builders pra ganhar tempo" → **NÃO**. Race condition se A é importado por B no mesmo batch. Sempre serial.
- "Vou rodar check depois de cada seção pra pegar erros cedo" → **NÃO**. Custa tempo e fragmenta o feedback. Single run no Passo 5.
- "Vou usar `generalPurpose` sem o AGENT.md inteiro inline pra economizar tokens" → **NÃO**. Sem AGENT.md inline vira fallback silencioso (proibido).
- "Vou só implementar uma seção rápida no fio principal pra ganhar tempo" → **NÃO**. Sem subagente = sem build. Aborta e pergunta.
- "Vou já plugar axios/http direto na view pra ficar 'pronto'" → **NÃO**. Esta fase é dado estático. HTTP fica pra skill futura.

### Auto-checagem antes do resumo final

Antes de imprimir o resumo final, validar:
- `docs/build-handoff-{page}.md` existe com tabelas (incluindo dados de `src/data/`) + análise priorizada + prompt copiável
- Cada arquivo do plano de dados foi criado, estendido ou skip explícito
- Cada componente shared do manifesto tem `Task component-builder` registrado em métricas (ou skip explícito)
- Cada seção do inventário tem `Task section-builder` registrado em métricas (ou skip)
- `git diff --stat` mostra apenas arquivos esperados — desvios declarados no handoff
- `Grep` em `src/views/{page}/` e `src/pages/{Page}.vue` por `axios` ou `fetch(` → se achar, listar no handoff como BLOCKER R8 (nada de HTTP real nesta fase)
- `Grep` em seções com `fonte_dados: data:*` por import fora de `@data`/`@/data` para o dado esperado → se achar, listar no handoff como BLOCKER R8
- **Gate anti-TODO (mecânico, sem retry):** `Grep` por `<!-- TODO` **e** `{/* TODO` **e** `// TODO` em `src/views/{page}/`, nos `src/components/` novos do Batch 0, e nos arquivos de `src/data/` tocados. Cruzar com os `assets_faltantes` agregados dos YAMLs:
  - TODO **declarado** por algum subagente → pendência normal (já está no handoff).
  - TODO **não declarado** → **"pendência HARD não reportada"**: listar com `arquivo:linha` em destaque no handoff (Passo 7) e no resumo (Passo 8). **NÃO re-disparar subagente, NÃO tentar corrigir** — é gate de relatório; quem decide é o humano.
  - Comentário `// DADOS ESTÁTICOS —` em `src/data/` **não** conta como TODO não declarado.

## Referências

- Manifesto: `docs/build-manifest-{page}.md`
- Fase anterior: `.claude/commands/build-prep.md`
- Subagente sections: `.claude/agents/section-builder/AGENT.md`
- Subagente components: `.claude/agents/component-builder/AGENT.md`
- Code review: `.claude/agents/code-reviewer/AGENT.md`
- Regras universais: `.claude/RULES.md`
- Workflow Figma técnico (refer.): `.claude/skills/figma/SKILL.md`
- Handoff pós-build: `docs/build-handoff-{page}.md` (Passo 7)
