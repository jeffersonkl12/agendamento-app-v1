# Build Manifest — ConfigurarAgendamentos

> Gerado por /build-prep em 2026-09-23
> Fonte: pencil — node dkSiG ("5 · Configurar agendamentos"), arquivo `template/design.pen`
> Para implementar: `/build-page configurar-agendamentos`

## Identificação
- page: configurar-agendamentos
- página: src/pages/ConfigurarAgendamentos.vue
- seções: src/views/configurar-agendamentos/
- rota: /configurar-agendamentos (nested em AppLayout, mesmo padrão do Home/Agenda/Modelo de Atendimento)

## Decisões de arquitetura (específicas deste produto)

1. **Mobile-first** — herda a decisão registrada em `docs/build-manifest-home.md` e na memória do projeto ([[mobile-first-override]]): base 375px, sem `max-*` do R12. A tela root (`dkSiG`) tem 375×584, abaixo dos 1000px que forçariam PDF — todos os screenshots saíram em WebP.
2. **Status Bar excluída** — mesmo mockup de chrome do iOS do Home/Agenda/Modelo de Atendimento, fora do inventário.
3. **Nav Bar via layout** — a instância `JEJ4C` desta tela usa o componente compartilhado já implementado em `src/components/shared/nav-bar/`. `route.meta.title = 'Configurar agendamentos'` alimenta o título; nada novo a fazer aqui.
4. **Dark mode pendente** — mesma decisão do Home/Agenda/Modelo de Atendimento ([[dark-mode-pending]]). Nenhum token de cor novo nesta página (tudo reusado do catálogo existente), então não há nova entrada a comentar em `.dark`.
5. **Escopo restrito ao node `dkSiG`, confirmado com o usuário em 2026-09-23.** O Pencil tem 2 frames irmãos ligados a este fluxo, fora do node pedido:
   - `n15E3H` — Modal · Configurar Agendamentos · Horário de Atendimento (abriria no tap de "Editar" da seção ScheduleHours)
   - `Qs7i2` — Modal · Configurar Agendamentos · Escolher Modelo (abriria no tap de "Escolher" da seção ServiceTemplate)

   Mesmo padrão de decisão do `docs/build-manifest-modelo-atendimento.md` (decisão 5/6 daquele manifesto): **não implementar agora**. Esta rodada cobre só o que está em `dkSiG` (dias da semana, horário/intervalo e modelo usado, exatamente como a screenshot mostra). Os 2 modais ficam registrados aqui como pendência — rodar um `/build-prep` dedicado a eles antes de dar ação real aos botões "Editar" e "Escolher".
6. **Botões sem ação nesta rodada.** Sem o reconhecimento dos 2 modais (fora de escopo, ver decisão 5), o `section-builder` deve renderizar "Editar" e "Escolher" como elementos visuais fiéis ao design, mas sem side-effect real (no máximo um `console.info`/TODO ou handler vazio) — não inventar um modal inline que o design não mostrou aqui.
7. **"Salvar configuração" não é seção própria.** É um único botão full-width, último filho do `Body` (`pezjb`), sem estado próprio de seção. Fica inline no template de `src/pages/ConfigurarAgendamentos.vue` (shell de página, R6/R7), não em `src/views/configurar-agendamentos/`. Mesmo raciocínio: extrair um arquivo inteiro para 1 botão sem 2º consumidor fragmentaria a leitura à toa.
8. **Nenhum componente novo em `src/components/`.** O padrão "card branco + linha (conteúdo à esquerda, ação de texto à direita)" de `ScheduleHours` e `ServiceTemplate` já é coberto pelo kit `@components/ui/card` — mesmo uso já presente em `src/views/modelo-atendimento/ServiceHeader.vue` (`<Card class="flex-row items-center justify-between gap-3 rounded-2xl p-3.5 ring-0">`). Regra 1 do Passo 7 (kit já cobre) vence antes de cogitar extração por repetição de estrutura (regra 4). Os chips de dia da semana mapeiam para `@components/ui/toggle-group` (`ToggleGroup` com `type="multiple"` + `ToggleGroupItem` em `v-for`), mais correto semanticamente que 7 frames coloridos manuais.
9. **Nenhum ícone ou imagem no design desta tela.** Confirmado por leitura completa da subárvore de `dkSiG`: só nodes `text`/`frame`, nenhum `icon` nem `fill.type: "image"`.

## Frame raiz
- node-id: dkSiG ("5 · Configurar agendamentos")
- Screenshot: docs/pencil/configurar-agendamentos-overview.webp (375×584, mobile, WebP)

## Tokens

### Adicionados (`src/assets/index.css` + `TEXT_STYLES` em `src/libs/utils.ts`)

Nenhuma cor nova — `GetVariables()` do Pencil não trouxe nada fora do catálogo já mapeado (`primary`, `surface`, `text-primary`, `text-secondary`, `white`), e os 3 valores literais lidos nos nodes desta tela (`#7A4B5C`, `#F1E9E4`, `#8B7B7D`, `#FFFFFF`, `#2B2225`) batem 1:1 com `--primary`, `--surface`, `--muted-foreground`, `--card`, `--foreground` já existentes.

Text-styles novos — valores exatos do Pencil, sem arredondar. Nenhum dos 2 tinha `line-height` explícito no Pencil; escolhido por consistência com a família de peso/tamanho mais próxima do catálogo (mesmo critério do Modelo de Atendimento):

| Classe | Tamanho/Peso/Altura | Uso |
| --- | --- | --- |
| `text-paragraph-strong` | 0.875rem / 600 / 1.4 | Valor do horário no card ScheduleHours ("09:00 às 18:00 · intervalo 30 min") — par de peso 600 para `text-paragraph` (400), análogo a `text-paragraph-light` (300) já existente |
| `text-button-strong` | 0.90625rem / 700 / 1.3 | Label do botão "Salvar configuração" |

### Reusados
`--primary` (chip ativo, ação "Editar"/"Escolher", Save Btn), `--primary-foreground` (texto em chip ativo e no Save Btn), `--surface` (chip inativo), `--muted-foreground`/`$text-secondary` (texto de chip inativo, Subtitle, Count "4 perguntas"), `--card` (fundo dos cards ScheduleHours/ServiceTemplate), `--foreground` (texto principal).

Text-styles reusados (match exato size/peso, mesmo critério do Modelo de Atendimento):
- `text-caption-md` (13px/400) → Subtitle ("Defina quando você está disponível")
- `text-tag` (13px/700) → labels de seção ("Dias da semana", "Horário e intervalo", "Modelo usado"), label de cada chip de dia, ações "Editar"/"Escolher" (mesmo padrão do `RouterLink`/`<button>` "Ver agenda →" em `src/views/home/UpcomingAppointments.vue`)
- `text-item-title` (14px/700) → nome do modelo no card ServiceTemplate ("Dia de Spa Relax")
- `text-label` (12px/400) → contagem de perguntas ("4 perguntas")

## Ícones
Nenhum ícone no design desta tela (ver Decisão 9).
- Total extraído: 0

## Imagens
Nenhuma — sem `fill.type: "image"` em nenhum node de `dkSiG`.

## Componentes do kit reusados
- `@components/ui/card` → linha de resumo de `ScheduleHours` e `ServiceTemplate` (mesmo padrão de `src/views/modelo-atendimento/ServiceHeader.vue`)
- `@components/ui/toggle-group` (`ToggleGroup` + `ToggleGroupItem`) → seletor multi-select dos 7 dias da semana em `Availability`, `type="multiple"`, `v-for` sobre `weekDays`
- `@components/ui/button` → "Salvar configuração" (full width, `bg-primary`), inline na página (Decisão 7)

Decisão final de variant/classes exatas é do `section-builder` (Fase 2); aqui só ficam os candidatos com maior aderência estrutural ao design.

## Componentes do projeto reusados
- `@components/shared/nav-bar` → via `src/layouts/AppLayout.vue`, nenhuma mudança necessária

## Componentes compartilhados — specs
Nenhuma. Ver Decisão 8 — o kit `ui/card` e `ui/toggle-group` já cobrem os dois padrões repetidos desta página (regra 1 do Passo 7 vence antes da regra 4).

## Estruturas inline-only

### DayChip
- usos_contados: 7 (todos dentro da MESMA seção — Seg a Dom)
- inline_na_secao: Availability
- motivo: "7 usos, mas todos dentro da MESMA seção — resolve com v-for sobre array de dados (data:configuracao) via ToggleGroupItem, não com componente novo (R6)."
- recomendacao: v-for
- node_id: "nBWy0, vRTuY, gN9nN, vqy1p, nylIC, rEsvv, rY32I"
- screenshot: docs/pencil/configurar-agendamentos-days.webp
- tokens_usados: text-tag, bg-primary + text-primary-foreground (ativo: Seg/Qua/Sex), bg-surface + text-muted-foreground (inativo: Ter/Qui/Sáb/Dom)

### ScheduleHoursRow
- usos_contados: 1
- inline_na_secao: ScheduleHours
- motivo: "Aparece só nesta seção, 1 instância. Mantido inline conforme R6 — estrutura vem do kit ui/card (ver Decisão 8)."
- recomendacao: inline-na-secao
- node_id: "MBGRN"
- screenshot: docs/pencil/configurar-agendamentos-schedule.webp
- tokens_usados: bg-card, text-paragraph-strong, text-tag

### ServiceTemplateRow
- usos_contados: 1
- inline_na_secao: ServiceTemplate
- motivo: "Aparece só nesta seção, 1 instância. Mantido inline conforme R6 — estrutura vem do kit ui/card (ver Decisão 8)."
- recomendacao: inline-na-secao
- node_id: "wixO5"
- screenshot: docs/pencil/configurar-agendamentos-template.webp
- tokens_usados: bg-card, text-item-title, text-label, text-tag

## Plano de dados

Domínio novo para disponibilidade semanal e horário — nenhum arquivo em `src/data/` cobre isso (checado: `agendamentos.ts`, `business.ts`, `home.ts`, `servico.ts`, e os manifests `docs/build-manifest-*.md` anteriores — nenhum propõe esse domínio).

O card "Modelo usado" (ServiceTemplate) mostra nome + contagem de perguntas do **mesmo** serviço já modelado em `src/data/servico.ts` (`service.name` = "Dia de Spa Relax", `serviceQuestions.length` = 4) — reuso direto, sem exports novos.

### Dados propostos
```yaml
dados_propostos:
  - arquivo: src/data/configuracao.ts
    acao: criar
    consumido_por: [Availability, ScheduleHours]
    exports:
      - weekDays: WeekDayAvailability[]
      - scheduleSettings: ScheduleSettings
    tipos:
      - "WeekDayAvailability { id: string, label: string, active: boolean }"
      - "ScheduleSettings { startTime: string, endTime: string, intervalMinutes: number }"
  - reuso: src/data/servico.ts
    acao: nenhuma (reuso direto dos exports existentes)
    consumido_por: [ServiceTemplate]
    exports_usados: [service, serviceQuestions]
```

O texto do card ScheduleHours ("09:00 às 18:00 · intervalo 30 min") é literal composto no template a partir de `scheduleSettings.startTime`/`endTime`/`intervalMinutes` — mesmo padrão usado em `QuestionsList.vue` para compor `typeLabel + ' · ' + (required ? 'Obrigatória' : 'Opcional')`.

## Copy literal (lido direto dos campos `content` dos nodes Pencil, não do screenshot)

- Availability: Subtitle = "Defina quando você está disponível" · Days Label = "Dias da semana" · labels dos chips = "Seg"/"Ter"/"Qua"/"Qui"/"Sex"/"Sáb"/"Dom" (já em `weekDays[].label` de `src/data/configuracao.ts`)
- ScheduleHours: Sched Label = "Horário e intervalo" · Action = "Editar"
- ServiceTemplate: Templ Label = "Modelo usado" · Action = "Escolher"
- Save Btn (inline na página): "Salvar configuração"

## Inventário de seções

| # | Nome | node-id | Arquivo | Reusa | Dados | Paralelizável | Screenshot | Formato |
|---|------|---------|---------|-------|-------|---------------|------------|---------|
| 1 | Availability | jInhu, VI53r | src/views/configurar-agendamentos/Availability.vue | ui/toggle-group | literal (subtitle) + data:configuracao (`weekDays`) | sim | docs/pencil/configurar-agendamentos-subtitle.webp, configurar-agendamentos-days.webp | webp |
| 2 | ScheduleHours | RuAWe | src/views/configurar-agendamentos/ScheduleHours.vue | ui/card | literal (label "Horário e intervalo", "Editar") + data:configuracao (`scheduleSettings`) | sim | docs/pencil/configurar-agendamentos-schedule.webp | webp |
| 3 | ServiceTemplate | pWq24 | src/views/configurar-agendamentos/ServiceTemplate.vue | ui/card | literal (label "Modelo usado", "Escolher") + data:servico (`service`, `serviceQuestions`) | sim | docs/pencil/configurar-agendamentos-template.webp | webp |

Fora do inventário (chrome compartilhado ou shell de página, sem seção própria):

| Nome | node-id | Arquivo | Reusa | Dados |
|------|---------|---------|-------|-------|
| NavBar (via layout) | JEJ4C (instância nesta tela) | src/layouts/AppLayout.vue | NavBar (shared, já implementado) | route.meta.title = 'Configurar agendamentos' (literal) |
| Save Btn (inline na página) | pezjb | src/pages/ConfigurarAgendamentos.vue | ui/button | literal ("Salvar configuração") — ver Decisão 7 |

## Plano de execução (Fase 2)
1. Sem Batch 0 — nenhum componente compartilhado novo nesta página.
2. Batch paralelo (máx 3): Availability, ScheduleHours, ServiceTemplate
3. Serial no fim: compor `src/pages/ConfigurarAgendamentos.vue` com as 3 seções + o botão "Salvar configuração" inline
4. `bun check` + `bun run build` uma única vez no fim

## Critério de aceite por seção
- Fiel ao screenshot da seção
- Zero valor arbitrário em cor, tipografia e espaçamento; dimensão só quando vem do design (R1, R2)
- Componente com pasta, index.ts, prop `class`, `cn(..., props.class)`, `data-slot` e `<slot />`, se algum vier a ser extraído (R5) — não é o caso previsto aqui (ver Estruturas inline-only)
- Chips de dia da semana via `ToggleGroup`/`ToggleGroupItem` (R6, Decisão 8), não `<div>`/`<button>` manuais
- Base mobile 375px, sem `max-*` (override do R12, ver Decisão 1 e [[mobile-first-override]])
- Tag semântica correta, `<h1>` único na página. Como em `src/pages/Agenda.vue` (`<h1 class="sr-only">`), o título visível já vem do NavBar via `route.meta.title` — a página precisa de um `<h1 class="sr-only">Configurar agendamentos</h1>` visualmente oculto para acessibilidade, não um heading visível duplicado. `RouterLink` só para navegação interna real — "Editar"/"Escolher" são `<button>` (abrem modal, não navegam) (R13)
- Botões "Editar" / "Escolher" fiéis visualmente, sem side-effect inventado (Decisão 6)

## Stubs criados
- src/pages/ConfigurarAgendamentos.vue
- src/views/configurar-agendamentos/
- rota em src/routers/ (`/configurar-agendamentos`, lazy, comentada até o `/build-page`)

## Status

### Componentes (Batch 0)
- Nenhum

### Seções (Batches 1-N)
- [x] Availability
- [x] ScheduleHours
- [x] ServiceTemplate
- [x] bun check + bun run build
- [x] review

> Nota: `bun run build` passou. `bun check` (biome global) falha por format pré-existente no repo — ver handoff.

## Auditoria

- [x] Tokens de cor novos existem nos três lugares de index.css (:root, .dark, @theme inline) — N/A, nenhuma cor nova (Decisão/Tokens)
- [x] Text-styles novos existem em index.css E em TEXT_STYLES de src/libs/utils.ts (contagem `@utility text-` = 29 = contagem de entradas do array = 29)
- [x] Ícones: nenhum no design — nada a extrair (Decisão 9)
- [x] Imagens: nenhuma no design — nada a baixar (Decisão 9)
- [x] Overview capturado (docs/pencil/configurar-agendamentos-overview.webp)
- [x] Cada seção do inventário tem screenshot (6 arquivos webp, 375×584 total, bem abaixo de 1000px)
- [x] Nenhuma spec de componente compartilhado nesta página (kit já cobre os padrões repetidos — Decisão 8) — N/A
- [x] Nenhum componente com spec_confidence baixa — N/A (sem specs)
- [x] Kit `ui/` consultado antes de qualquer proposta de componente (card, toggle-group, button listados)
- [x] Cada seção tem fonte de dados declarada (`literal` | `data:configuracao` | `data:servico`)
- [x] Toda seção com dado estático aponta para `src/data/configuracao.ts` (novo, domínio checado via Glob + manifests anteriores — sem match) ou reusa `src/data/servico.ts` direto
- [x] Stubs criados e rota registrada (comentada, ativa no `/build-page`)
