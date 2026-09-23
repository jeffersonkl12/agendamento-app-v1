# Build Handoff — Perfil

> Gerado por /build-page em 2026-09-23
> Manifesto: docs/build-manifest-perfil.md
> Status geral: **concluído sem blockers** (2 MAJORs do code review corrigidos durante o build)

## Dados (Passo 1)

| Arquivo | Tipo | Status | Nota |
| --- | --- | --- | --- |
| `src/data/plano.ts` | dado estático | criado | camada dinâmica pendente (skill futura) |
| `src/data/business.ts` | dado estático | já existia (estendido = sem export novo, `business.name` já cobria o caso) | — |

## Components (Batch 0)

Nenhum. O manifesto não propôs nenhum componente compartilhado (`ui/avatar` e `ui/button` do kit cobriram tudo; `NameRow` e `PlanCard` ficaram inline em 1 uso cada, conforme R6).

## Seções (Batches 1-N)

| Seção | Status | Assets faltantes | Desvios do manifesto | Evolução de componente pedida | Bloqueios | Notas |
| --- | --- | --- | --- | --- | --- | --- |
| ProfileHeader | ok | — | — | — | — | Nome vem de `business.name`; botão "Editar" sem handler (aguarda decisão de produto); avatar/hint sem interação de upload real |
| Plan | ok | — | Manifesto pedia `font-display` (classe inexistente); section-builder usou `font-heading` (token real do projeto para essa fonte), mesmo padrão de `src/views/home/Overview.vue` | — | — | Padding/raio do card estimados a partir do screenshot @2x (sem acesso a tools MCP do Pencil no subagente) — ver pendências abaixo |

## Validação

- `bun run build`: ✓ limpo (vue-tsc + vite build), antes e depois dos fixes do review
- `bun check`: reporta ruído pré-existente do repo inteiro (776 erros antes de qualquer mudança desta página — config `biome.json` com `indentStyle: tab` / `quoteStyle: double`, já documentada como pendência em `RULES.md` R14). Escopo isolado aos arquivos desta página (`bunx biome check` só neles) mostra apenas o mesmo ruído de formatação + 1 warning de nome de componente de palavra única (`Plan.vue`, `Perfil.vue`) — mesmo padrão já presente em `Home.vue`/`Agenda.vue`. Não é regressão desta página.

## Code review (Passo 6)

- **BLOCKERS: 0**
- **MAJOR: 2 — ambos corrigidos nesta sessão**
  - [M1] `src/pages/Perfil.vue` — botão "Sair da conta" usava `variant="ghost"` e herdava `hover:text-foreground` do kit (texto sumia no hover). Corrigido para `variant="destructive"` + `bg-error-bg hover:bg-error-bg/80`.
  - [M2] `src/views/perfil/Plan.vue` — "Plano Essencial" usava `text-white` (paleta crua do Tailwind) em vez de `text-primary-foreground` (token do tema pareado com `bg-primary`). Corrigido; manifesto atualizado para refletir o mapeamento correto de `$white`.
- **MINOR: 3 — abertos, não bloqueiam entrega**
  1. `ProfileHeader.vue`: "Toque para definir uma foto" é um `<p>` que promete interação inexistente. Quando o fluxo de upload de foto existir, avatar + hint devem virar `<button>` ou `<label>` de `<input type="file">`.
  2. Handlers inconsistentes: `logout()` é um stub nomeado com `// TODO`; o botão "Editar" não tem handler nenhum. Padronizar quando a lógica real (modal de edição, logout) for definida.
  3. `Plan.vue` tem o mesmo nome (`Plan`) da interface `Plan` de `@data/plano` — colisão de nome se a view algum dia importar o tipo. Não bloqueia (mesmo padrão de nome-único já existe em `Agenda.vue`).
- **INFO:** rota lazy com `meta.title` (R9) ok; `text-metric-xs` registrado nos dois lugares (R2) ok; `plano.ts` segue o contrato R8 ok; a11y de base ok (`h1` sr-only único, `h2` por seção, `aria-labelledby`, `aria-label` em botão só-ícone-equivalente).

## Intervenções do orquestrador (honestidade)

- `src/routers/index.ts`: descomentou a rota `/perfil` (stub do `/build-prep` já continha a linha comentada).
- `src/pages/Perfil.vue`: compôs as 2 seções + escreveu o botão "Sair da conta" inline (conforme Decisão 4 do manifesto — ação única de página, não é seção) + `<h1 class="sr-only">`.
- Aplicou diretamente as 2 correções MAJOR do code review (M1, M2) nos arquivos `.vue` gerados pelos subagentes, após confirmação do usuário — não voltou a disparar `section-builder` porque eram trocas de 1-2 classes já com o código exato do reviewer, sem ambiguidade de design.
- Atualizou `docs/build-manifest-perfil.md` (tabela "Reusados" e spec `PlanCard`) para refletir o mapeamento final `$white → text-primary-foreground`, mantendo o manifesto como fonte de verdade coerente com o código entregue.

## Análise e sugestões de correção

**Causas raiz:**
- Nenhum asset faltante (design sem ícones/imagens, confirmado no `/build-prep`).
- Medidas finas de padding/raio do `PlanCard` e do `NameRow` foram estimadas a partir do screenshot @2x pelos `section-builder`s, porque o subagente Pencil não tem acesso às tools MCP do Pencil (`execute`) — só ao screenshot exportado e ao texto literal já transcrito no manifesto. Isso é uma limitação estrutural do fluxo atual (Figma tem `get_design_context` disponível pro subagente; Pencil não), não um erro desta página.

**Backlog priorizado:**

| Prioridade | Item | Ação sugerida | Quem decide |
| --- | --- | --- | --- |
| P1 | Fluxo de upload de foto (avatar) | Definir UX real (câmera/galeria/crop) e trocar `<p>`/`Avatar` por `<button>` ou `<label>` acionável | Humano (produto) |
| P1 | Handler de "Editar" (Name Row) | Definir se abre modal, navega pra outra tela, ou inline-edit | Humano (produto) |
| P1 | Handler de "Sair da conta" | Ligar ao fluxo real de logout quando a camada dinâmica (auth) existir | Humano (produto) + técnico |
| P2 | Confirmar padding/raio exatos de `PlanCard`/`NameRow` no Pencil (node `Cqxo6` / `JWg4o`) | Reabrir o `.pen` e conferir valores numéricos; ajustar se o screenshot @2x levou a arredondamento errado | Técnico (rápido) |
| P2 | Renomear `Plan.vue` para evitar colisão com `interface Plan` | Cosmético; só relevante se a view vier a importar o tipo `Plan` diretamente | Técnico (opcional) |

## PROMPT COPIÁVEL

```
Contexto: página Perfil (src/pages/Perfil.vue, src/views/perfil/ProfileHeader.vue, src/views/perfil/Plan.vue) já implementada e com build limpo. Pendências abertas do docs/build-handoff-perfil.md:

1. src/views/perfil/ProfileHeader.vue — avatar + "Toque para definir uma foto" (linhas do bloco `Avatar Section`) precisam virar interação real de upload de foto (câmera/galeria). Trocar `<p>` por `<button>` ou `<label>` de `<input type="file">` conforme a UX definida.
2. src/views/perfil/ProfileHeader.vue — botão "Editar" (Name Row) precisa de handler real: definir se abre modal, navega, ou faz inline-edit do nome do negócio.
3. src/pages/Perfil.vue — função `logout()` está vazia com // TODO; ligar ao fluxo real de logout quando a camada dinâmica (auth/service) existir.
4. (opcional, técnico) Conferir no Pencil (template/design.pen, nodes Cqxo6 e JWg4o) os valores exatos de padding/border-radius do PlanCard e do NameRow — os atuais (p-5/rounded-2xl e p-3.5/rounded-2xl) foram estimados a partir do screenshot @2x.

Regras do projeto: .claude/RULES.md. Decisão de arquitetura mobile-first (sem max-*): ver docs/build-manifest-perfil.md.
```
