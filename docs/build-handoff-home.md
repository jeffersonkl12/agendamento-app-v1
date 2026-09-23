# Build Handoff — Home

> Gerado por /build-page em 2026-09-22
> Manifesto: docs/build-manifest-home.md

## Dados (Passo 1)

| Arquivo | Tipo | Status | Nota |
|---|---|---|---|
| src/data/business.ts | dado estático | criado (não previsto no manifesto original — extraído de `home.ts` no code review, M4/M3) | camada dinâmica pendente (skill futura) |
| src/data/home.ts | dado estático | criado, depois revisado (stats virou `Record<Period, Stats>`) | valores do período "Total" são mock ilustrativo, sem referência de design |
| src/data/agendamentos.ts | dado estático | criado | `statusLabel`/`statusVariant` misturam apresentação com o contrato de dados — ver P2 abaixo |

## Components (Batch 0)

| Componente | Status | mode_efetivo | Props/slots | Desvios da spec | Bloqueios |
|---|---|---|---|---|---|
| NavBar | implementado | create, depois update (redesign de API) | v1: `title`/`avatarInitials` (props). v2: slot default + slot `actions`, prop `class`, emit `menuClick` | v1 tinha medidas estimadas do screenshot (Pencil fora do tooling do subagente); v2 trocou props por slots (M4 do review) | nenhum |

## Sections (Batches 1-N)

| Seção | Status | Assets faltantes | Desvios do manifesto | Evolução de componente pedida | Bloqueios | Notas |
|---|---|---|---|---|---|---|
| Header | ok | — | import corrigido de `@data/home` pra `@data/business` após o split | — | — | único `<h1>` da página |
| Overview | ok | — | Tabs → ToggleGroup (M1); `stats` de objeto único pra `Record<Period,Stats>`; `px-5` removido (gutter migrou pro layout) | pediu ajuste no `TabsTrigger` do kit (peso de fonte) — resolvido na raiz, não precisou tocar o kit | — | segmented control agora filtra dado de verdade |
| UpcomingAppointments | ok | — | `Badge` por `class` manual → `variant` (após kit ganhar success/warning/error); `font-bold` removido; seta "→" com `aria-hidden` | — | — | `RouterLink to="/agenda"` aponta pra rota que ainda não existe (ver P1) |
| ~~Topbar~~ | removida | — | virou `src/layouts/AppLayout.vue` (M3 do review) — NavBar é chrome de app inteiro, não seção da Home | — | — | — |

## Code review

**1ª rodada (antes das correções):** 0 BLOCKERS, 5 MAJOR, ~4 MINOR relevantes.

| # | Achado | Severidade | Status |
|---|---|---|---|
| M1a | `TabsTrigger` do kit (`font-medium` hardcoded) vence `text-tag` no CSS gerado — confirmado no bundle compilado | MAJOR | **corrigido na raiz** — `src/libs/utils.ts` ganhou classGroup `text-style` em conflito com `font-size`/`font-weight`/`leading` |
| M1b | `Badge` sem variant success/warning, cor resolvida via `class` manual | MAJOR | **corrigido** — `src/components/ui/badge/index.ts` ganhou as 3 variants |
| M1 (Overview) | Segmented control mudava estado local sem efeito real; Tabs usado pra um filtro (não pra abas com painel) | MAJOR | **corrigido** — `stats` virou `Record<Period,Stats>`, Tabs → ToggleGroup |
| M2 | Nenhuma seção era dona do gutter horizontal da página | MAJOR | **corrigido** — gutter centralizado em `src/layouts/AppLayout.vue` (`<main class="... px-5 pb-6">`) |
| M3 | NavBar (chrome de app inteiro) dentro do `<main>` como seção da Home — landmark banner/main quebrado | MAJOR | **corrigido** — extraído `src/layouts/AppLayout.vue`, rota aninhada, `Topbar.vue` removido |
| M4 | NavBar com API fechada (`title`/`avatarInitials` como props de string), sem slot (R5.6) | MAJOR | **corrigido** — `component-builder` em modo update trocou por slots `default`/`actions` |
| M5 | `index.html` com `lang="en"` e `<title>my-vue-app</title>` | MINOR | **corrigido** |
| minor | Avatar "SB" sem nome acessível | MINOR | **corrigido** — `role="img" aria-label="Studio Bella"` no `AppLayout.vue` |
| minor | `RouterLink to="/agenda"` sem rota | MINOR | **não corrigido** — depende da página Agenda (ver P1) |
| minor | `statusVariant`/`statusLabel` no contrato de dados carregam apresentação, não domínio | MINOR | **não corrigido** — ver P2 |
| minor | `bun check`/`bun run build` bloqueados por config/dependência pré-existentes | MINOR | **corrigido** o build (`@unovis/vue` instalado, var não usada removida); `bun check` segue com ruído de formatação pré-existente (ver P3) |

**2ª rodada:** não rodada — as correções foram verificadas uma a uma (leitura dos arquivos finais + `bun run build` limpo). Se quiser uma passada de review completa pós-fix, é só pedir.

## Intervenções do orquestrador (fora do escopo `.vue` de seções/components)

- `src/libs/utils.ts` — novo classGroup `text-style` no `tailwind-merge` (causa raiz do M1a/M1b)
- `.claude/RULES.md` (R2) — texto atualizado pra descrever o novo mecanismo de registro dos text-styles
- `src/components/ui/badge/index.ts` — variants `success`/`warning`/`error` (edição de kit esperada pela R5)
- `src/components/ui/chart/ChartLegendContent.vue` — removida variável não usada (pré-existente, bloqueava `bun run build`)
- `package.json` / `bun.lock` — `@unovis/vue` instalado (dependência pré-existente faltante, usada por `src/components/ui/chart/`)
- `index.html` — `lang="pt-BR"`, `<title>Agenda</title>`
- `src/layouts/AppLayout.vue` — criado (não previsto no `/build-prep` original; nasceu do M3 do review)
- `src/routers/index.ts` — rota `/` virou pai com `AppLayout`, `Home.vue` como filha (`meta.title`)
- `src/App.vue` — `<main>` removido daqui (migrou pro layout)
- `src/data/business.ts` — criado, extraindo `business`/`Business` de `home.ts` (identidade do negócio é chrome de app inteiro, não dado da Home)

## Análise e sugestões de correção

### Causas raiz agrupadas
- **Text-style vs. classe do kit:** qualquer componente do kit com `font-*`/`text-*` hardcoded na base ia perder essa colisão pro text-style do projeto até o fix em `utils.ts`. Resolvido de forma estrutural — não deve se repetir em páginas futuras.
- **Chrome de app tratado como seção de página:** o `/build-prep` não modela layouts (só páginas/seções), então um componente com `reusable: true` no Pencil e 6 usos cross-page ficou preso dentro de uma página até o review pegar. Vale considerar, numa próxima revisão do `/build-prep`, detectar esse padrão (componente compartilhado com nó do tipo "chrome de topo/rodapé" presente em quase todas as telas) e já sugerir layout em vez de seção.
- **Config pré-existente do template:** `@unovis/vue` faltante e `biome.json` com tab/double-quote (R14) já eram dívidas do template antes desta página. A primeira foi resolvida; a segunda seguiu como está (ver P3).

### Backlog priorizado

| Prioridade | Item | Ação sugerida |
|---|---|---|
| P0 | — | nenhum — build limpo, 0 blockers |
| P1 | `RouterLink to="/agenda"` sem rota | Resolve sozinho quando a página Agenda for construída (`/build-prep pencil:xgGyp` + `/build-page agenda`) |
| P1 | Valores de "Total" em `src/data/home.ts` são mock inventado | Confirmar com o design (ou com o usuário) os números reais do período "Total" antes de qualquer decisão de produto baseada neles |
| P2 | `Appointment.statusVariant`/`statusLabel` no contrato de dados carregam vocabulário de UI | Quando a página Agenda reusar este domínio, considerar `status: 'confirmed' \| 'pending' \| 'cancelled'` + mapa `status → {label, variant}` na view, deixando `src/data/agendamentos.ts` livre de cor/rótulo |
| P2 | `day: 'SEG 21'` pré-formatado no dado | Mesma lógica — considerar guardar uma data real e formatar na view quando o domínio crescer |
| P3 | `biome.json` diverge do padrão da R14 (tab/double vs. space/single) | Decisão do humano — já documentado como pendente na própria R14; ruído crescente a cada página nova enquanto não for resolvido |
| P3 | Dark mode da paleta de marca | Decisão do humano — sem referência de design ainda (ver Decisão 3 do manifesto) |

Decisão do humano: valores de "Total" (P1), contrato de status (P2), `biome.json` (P3), dark mode (P3).
Técnico, sem decisão pendente: nada — os itens técnicos já foram resolvidos nesta rodada.

## PROMPT COPIÁVEL

```
Preciso resolver as pendências do build da página Home (app-agendamento):

1. src/data/home.ts: os valores de "stats.total" são mock inventado (revenue 28960,
   appointmentsCount 376, avgTicket 77.02) — não vêm do design. Preciso confirmar os
   números reais do período "Total" antes de usar em qualquer decisão de produto.

2. src/views/home/UpcomingAppointments.vue linha 13: <RouterLink to="/agenda"> aponta
   pra uma rota que não existe ainda. Só será resolvido quando a página Agenda for
   construída (/build-prep pencil:xgGyp seguido de /build-page agenda).

3. src/data/agendamentos.ts: Appointment.statusVariant/statusLabel misturam vocabulário
   de apresentação (cor do badge, texto exibido) com o contrato de dados. Quando a
   página Agenda for construída e reusar este domínio, avaliar separar em
   status: 'confirmed' | 'pending' | 'cancelled' + um mapa de apresentação na view.

4. biome.json está com indentStyle "tab" e quoteStyle "double", divergindo do padrão
   documentado na própria R14 do RULES.md (2 espaços, aspas simples). Isso gera ruído
   de formatação em toda página nova. Decidir se corrige o biome.json ou atualiza a R14
   pra refletir o padrão real.

5. Dark mode da paleta de marca (--primary-soft, --surface, --success/warning/error)
   ainda não tem valores — o Pencil não define tema escuro. Fica pendente até existir
   referência de design.
```
