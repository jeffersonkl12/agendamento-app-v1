# Build Handoff — Agenda

> Página: `agenda` · Data: 2026-09-22 · Manifesto: `docs/build-manifest-agenda.md`

## Dados (Passo 1)

| Arquivo | Tipo | Status | Nota |
| --- | --- | --- | --- |
| `src/data/agendamentos.ts` | dado estático | estendido | `Appointment` ganhou campo `date` (aditivo); novo export `appointments` (superset de `upcomingAppointments`, que segue intocado pro Home). Camada dinâmica pendente (skill futura). |

## Components (Batch 0)

| Componente | Status | Modo | Props implementadas | Desvios da spec | Bloqueios |
| --- | --- | --- | --- | --- | --- |
| `SegmentedControl` | ok | create | `modelValue`, `options`, `ariaLabel`, `class` | Não usou `reactiveOmit`/`useForwardProps` apesar de `envolve_primitiva: sim` — API fechada em vez de repassar todo `ToggleGroupRootProps` (justificativa do subagente: evitar vazar `type`/`multiple`/`disabled` do reka que quebrariam o `type="single"` fixo). Ver M3 abaixo — o review discorda dessa leitura da R5. | nenhum |

## Sections (Batches 1-N)

| Seção | Status | Assets faltantes | Desvios do manifesto | Evolução pedida | Bloqueios | Notas |
| --- | --- | --- | --- | --- | --- | --- |
| `CalendarPicker` | ok | nenhum | Dia 20 tratado como "hoje" hardcoded (`bg-primary-soft`) — leitura não confirmada no Pencil, decisão do orquestrador documentada no código. Medidas de célula/botão (44×38, 32×32) estimadas do screenshot @2x. | nenhuma | nenhum | Grade computada por `Date` nativo (sem hardcode de dias); dias do mês anterior mostrados com número e clicáveis, dias do mês seguinte ficam vazios (fiel ao design, assimétrico de propósito). Corrigido pós-review (M2): `aria-label` do dia agora inclui "com agendamento" quando há dot. |
| `DayAppointments` | ok | nenhum | Estado vazio ("Nenhum agendamento neste dia") é decisão de UX do subagente — o design não cobre esse caso (os modais de dia vazio ficaram fora de escopo). | nenhuma | nenhum | `selectedDate` chega como prop só-leitura; lista filtrada de `appointments` por data ISO. Formatação do cabeçalho corrige timezone (`parseLocalDate` em vez de `new Date(iso)`, que cairia um dia antes em UTC-3). |

## Code review

**Veredicto:** mudanças necessárias — 0 BLOCKER, 3 MAJOR, 5 MINOR, 4 INFO.

| # | Severidade | Resumo | Status |
| --- | --- | --- | --- |
| M1 | MAJOR | `Agenda.vue` sem `<h1>` — título só existe como `<div>` dentro do `NavBar` (R13) | **Corrigido** — `<h1 class="sr-only">Agenda</h1>` adicionado em `Agenda.vue`, sem tocar `NavBar`/Home |
| M2 | MAJOR | Dot "tem agendamento" só visual (`aria-hidden`), leitor de tela não sabe quais dias têm agendamento (R13) | **Corrigido** — `aria-label` do dia agora inclui "com agendamento" quando o dot está presente |
| M3 | MAJOR | `SegmentedControl` foge da anatomia R5 (sem `<slot />`, sem repasse de props da primitiva) e o Home (`Overview.vue`) continua com implementação inline própria — hoje há 2 implementações do mesmo padrão, não 1 | **Aberto, por decisão do usuário** — corrigir direito exige migrar `src/views/home/Overview.vue`, fora do escopo desta rodada (ver backlog P1 abaixo) |
| minor×5 | MINOR | "Lista" selecionável sem efeito (aria-pressed mente); tipos frouxos em `viewMode`/`VIEW_MODE_OPTIONS`; `day`/`date` redundantes em `agendamentos.ts`; sem roving focus na grade (35 botões em Tab); horário sem `<time>` semântico | Não corrigidos — ver backlog P2 |
| info×4 | INFO | Timezone do `parseLocalDate`, normalização de dia em `createDay`, `selectedDate` elevado corretamente via `defineModel`, tokens/text-styles novos registrados nos dois lugares (R2) | Sem ação necessária |

## Intervenções do orquestrador

- `src/assets/index.css` — 2 tokens novos (`--marker`, `--muted-foreground-soft`) + 4 text-styles novos (`text-heading-lg`, `text-overline-sm`, `text-tag-lg`, `text-label-lg`), feito no `/build-prep` (Passo 3), não nesta fase.
- `src/libs/utils.ts` — `TEXT_STYLES` estendido com os mesmos 4 nomes (mesma fase do prep).
- `src/routers/index.ts` — rota filha `agenda` registrada (prep).
- `src/data/agendamentos.ts` — escrito pelo orquestrador (Passo 1 desta fase), não por subagente, conforme o workflow permite.
- `src/pages/Agenda.vue` — composto pelo orquestrador (Passo 4) + fix do M1 (`<h1 class="sr-only">`) pós-review.
- Removida pasta `dist/` gerada pelas rodadas de `bun run build` de verificação — não fazia parte do deliverable.

## Análise e sugestões de correção

**Causas raiz:**
- M1/M2: o padrão de a11y do Home (título vem de dentro da seção, `Header.vue` tem `<h1>` próprio) não se repete em toda página — cada página nova precisa garantir seu próprio `<h1>`, e isso não está explícito como checklist no `component-builder`/`section-builder`. Vale adicionar ao AGENT.md do `section-builder` ou a um passo do `/build-page`.
- M3: o `/build-prep` permitiu que a spec do `SegmentedControl` declarasse `slots: nenhum` (API 100% data-driven) sem checar contra a anatomia obrigatória da R5 (slot + compound + forwarding de primitiva). O reviewer sugere impedir isso na fonte (specs de componente shared não podem declarar "slots: nenhum" sem uma exceção registrada no `RULES.md`, não só no manifesto).

**Backlog priorizado:**

| Prioridade | Item | Ação sugerida | Quem decide |
| --- | --- | --- | --- |
| P0 | — | nenhum — build limpo, 0 blockers | — |
| P1 | M3 — SegmentedControl vs R5/R6 | Reescrever como compound (`SegmentedControl` + `SegmentedControlItem`, com `<slot />` e forwarding de `ToggleGroupRootProps`) e migrar `src/views/home/Overview.vue` pra consumi-lo. Toca Home — decisão de escopo do time. | Humano (técnico) |
| ~~P1~~ | ~~"Lista" sem conteúdo (Decisão 7 do manifesto)~~ | **Resolvido em 2026-09-22** — `/pencil` no node `pUk68`, nova seção `AppointmentsList.vue` + componente `AppointmentRow` (2º uso, extraído por R6). Ver addendum em `docs/build-manifest-agenda.md`. | — |
| P1 | 6 modais de interação fora de escopo (Decisão 5 do manifesto) | `/build-prep` dedicado pros frames `YCoRt`, `YOC4M`, `LB31A`, `e1huMW`, `jf1kD`, `zrG7S` — clique em dia abre bottom sheet, clique em agendamento abre detalhe, cancelamento com confirmação. | Humano (produto) |
| ~~P2~~ | ~~3 dias mock inventados (id 4/5/6 em `agendamentos.ts`)~~ | **Resolvido em 2026-09-22** — o node `pUk68` tinha o conteúdo real; os 3 registros foram corrigidos (nomes/serviços/horários/status certos, não mais mock). | — |
| P2 | Dia 20 como "hoje" hardcoded | Leitura não confirmada no Pencil — validar com design se é mesmo o indicador de "hoje" e, se sim, trocar o hardcode `'2026-09-20'` por lógica real de data atual (ou remover, se for só decoração do mockup). | Humano (produto/design) |
| P2 | 5 MINORs do review (tipos frouxos, `day`/`date` redundante, roving focus, `<time>` semântico, aria-pressed da "Lista") | Cosméticos/robustez — não bloqueiam entrega. | Técnico, sem pressa |
| P2 | `bun check` — ruído de formatter | Pré-existente em todo o repo (biome.json com tabs/aspas duplas, divergindo do padrão documentado na R14). Ajuste já sinalizado no `RULES.md` como pendente — não é desta página. | Técnico |

## PROMPT COPIÁVEL

```
Corrigir pendências P1 do handoff da página Agenda (docs/build-handoff-agenda.md):

1. Migrar o SegmentedControl (src/components/shared/segmented-control/) pra anatomia
   R5 completa: compound SegmentedControl + SegmentedControlItem, <slot />, forwarding
   de ToggleGroupRootProps via reactiveOmit/useForwardProps. Depois migrar
   src/views/home/Overview.vue pra consumir o componente shared em vez da
   implementação inline própria (mesmo hack de "undefined ao reclicar" hoje duplicado
   nos dois lugares).

2. Rodar /build-prep dedicado aos 6 frames de interação da Agenda que ficaram fora
   desta rodada: YCoRt (Agendamentos do Dia — Com Agendamentos), YOC4M (Vazio ·
   Disponível), LB31A (Vazio · Indisponível), e1huMW (Detalhe — Confirmado), jf1kD
   (Detalhe — Aguardando Bot), zrG7S (Confirmar Cancelamento). Objetivo: tocar um dia
   do calendário ou um agendamento abre os bottom sheets/dialogs correspondentes.

(Item "Lista" resolvido em 2026-09-22 — ver addendum em docs/build-manifest-agenda.md.)

Ver docs/build-manifest-agenda.md pras decisões de arquitetura já tomadas (mobile-first,
dark mode pendente, escopo do node xgGyp).
```
