# Build Manifest — Agenda

> Gerado por /build-prep em 2026-09-22
> Fonte: pencil — node xgGyp ("3 · Agenda"), arquivo `template/design.pen`
> Para implementar: `/build-page agenda`

## Identificação
- page: agenda
- página: src/pages/Agenda.vue
- seções: src/views/agenda/
- rota: /agenda (nested em AppLayout, mesmo padrão do Home)

## Decisões de arquitetura (específicas deste produto)

1. **Mobile-first** — herda a decisão registrada em `docs/build-manifest-home.md` e na memória do projeto ([[mobile-first-override]]): base 375px, sem `max-*` do R12. A tela root (`xgGyp`) tem 375×616, bem abaixo dos 1000px que forçariam PDF — todos os screenshots saíram em WebP.
2. **Status Bar excluída** — mesmo mockup de chrome do iOS do Home, fora do inventário.
3. **Nav Bar via layout** — a instância `nerQW` desta tela usa o componente compartilhado já implementado em `src/components/shared/nav-bar/` (Batch 0 do Home). `route.meta.title = 'Agenda'` alimenta o título; nada novo a fazer aqui.
4. **Dark mode pendente** — mesma decisão do Home ([[dark-mode-pending]]). Os 2 tokens novos desta página (`--marker`, `--muted-foreground-soft`) só têm valor em `:root`/`@theme inline`; `.dark` ganhou entrada no comentário de pendência existente.
5. **Escopo restrito ao node `xgGyp`, confirmado com o usuário em 2026-09-22.** O Pencil tem 6 frames irmãos claramente ligados a este fluxo, fora do node pedido:
   - `YCoRt` — Modal · Agenda · Agendamentos do Dia (Com Agendamentos)
   - `YOC4M` — Modal · Agenda · Agendamentos do Dia (Vazio · Disponível)
   - `LB31A` — Modal · Agenda · Agendamentos do Dia (Vazio · Indisponível)
   - `e1huMW` — Modal · Agenda · Detalhe do Agendamento (Confirmado)
   - `jf1kD` — Modal · Agenda · Detalhe do Agendamento (Aguardando Bot)
   - `zrG7S` — Modal · Agenda · Confirmar Cancelamento

   Isso sugere que tocar num dia do calendário ou num agendamento deveria abrir esses bottom sheets/dialogs. **Decisão do usuário: não implementar agora.** Esta rodada cobre só o que está em `xgGyp` (calendário + painel inline do dia selecionado, exatamente como a screenshot mostra). Os 6 modais ficam registrados aqui como pendência — rodar um `/build-prep` dedicado a eles (ou a um "Agenda — Interações", reaproveitando este manifesto como base) antes de implementar clique-em-dia e clique-em-agendamento.
6. **Existe também `pUk68` ("3b · Agenda (Lista)")** — a tela cheia para quando o segmented control está em "Lista" (grouped list por data, todo o mês). Também fora do node pedido. O segmented control desta rodada implementa só a troca visual do valor selecionado (estado local); o conteúdo da aba "Lista" não é renderizado ainda — ver item 7.
7. **Segmented Control "Lista" sem conteúdo nesta rodada.** Sem o reconhecimento de `pUk68` (fora de escopo, ver decisão 5/6), o `section-builder` deve implementar a troca de valor do controle (estado local, igual ao padrão do Home) mas manter "Calendário" como única view renderizada — não inventar o conteúdo da "Lista". Sinalizar no componente com um TODO ou renderização condicional vazia até o `/build-prep` da Lista rodar.
8. **`SegmentedControl` vira componente compartilhado.** O Home (`docs/build-manifest-home.md`) já tinha 1 uso deste padrão (Este mês/Total), marcado `inline-na-secao` por ser o primeiro manifesto do projeto. Esta é a 2ª ocorrência da mesma estrutura visual (trilho `surface` + pill `primary` ativo, mesmos tokens) → regra 6 do Passo 7 (soma cross-página) força extração. Spec nova em `src/components/shared/segmented-control/` (ver seção de specs). **Recomendação, fora do escopo deste build-prep:** migrar `src/views/home/Overview.vue` para consumir o novo componente compartilhado num review futuro — não fiz a migração aqui para não tocar em código do Home fora do pedido do usuário.

## Frame raiz
- node-id: xgGyp ("3 · Agenda")
- Screenshot: docs/pencil/agenda-overview.webp (375×616, mobile, WebP)

## Tokens

### Adicionados (`src/assets/index.css` + `TEXT_STYLES` em `src/libs/utils.ts`)

Cores — `:root` e `@theme inline` (dark pendente, ver Decisão 4):

| Token | Valor | Uso |
| --- | --- | --- |
| `--marker` *(novo)* | `#D98E4A` | dot indicador de "dia com agendamento" na grade do calendário — cor própria, não é `--warning` (#B5772F) |
| `--muted-foreground-soft` *(novo)* | `#B5A7A2` | texto dos cabeçalhos de dia da semana (Seg/Ter/Qua...) — mais claro que `--muted-foreground` (#8B7B7D) |

Text-styles novos (`@utility text-*` + `TEXT_STYLES`) — valores exatos do Pencil, sem arredondar:

| Classe | Tamanho/Peso/Altura | Uso |
| --- | --- | --- |
| `text-heading-lg` | 1.125rem / 400 / 1.3 | "Setembro 2026" (Month Label) — combinar com `font-heading` |
| `text-overline-sm` | 0.65625rem / 700 / 1.3 | Cabeçalhos de dia da semana |
| `text-tag-lg` | 0.84375rem / 700 / 1.2 | Número do dia na grade do calendário |
| `text-label-lg` | 0.78125rem / 400 / 1.4 | Serviço no Appt Row ("Limpeza de pele") |

Nenhuma `line-height` veio explícita no Pencil para esses 4 nós — valores escolhidos por consistência com o catálogo (mesmo padrão do Home), sinalizado aqui em vez de forjar precisão que a fonte não declarou.

### Reusados
`--primary`, `--primary-foreground`, `--primary-soft`, `--surface`, `--foreground`, `--muted-foreground`, `--success`/`--success-bg`, `--card`, `font-sans` (Manrope), `font-heading` (Libre Caslon Display) — nenhum valor novo, todos já existem do Home. `text-tag` (segmented control labels, 13px/700 ≈ 13px do design — match exato), `text-item-title` (Day Label e Client/Time do Appt Row, 14px/700 — match exato), `text-overline` (Status Pill label, 11px/700 — match exato).

`GetVariables()` do Pencil devolveu só cores já mapeadas 1:1 no catálogo atual (`primary`, `primary-soft`, `bg`, `surface`, `text-primary`, `text-secondary`, `success(-bg)`, `warning(-bg)`, `error(-bg)`, `white`, `font-display`, `font-ui`) — nada novo veio daí; os 2 tokens novos (`marker`, `muted-foreground-soft`) são valores lidos direto nos nós, sem variável nomeada no arquivo Pencil.

## Ícones
- Nenhum ícone no design desta tela. As setas "‹"/"›" de navegação de mês (`wzM6P`/`Y1GTX`) são texto literal (`content: "‹"`, `content: "›"`), não nós de ícone — mesma convenção já usada no Home para "Ver agenda →". Botões precisam `aria-label` (ícone-only visual).
- Total extraído: 0

## Imagens
Nenhuma — não há `fill.type: "image"` em nenhum node de `xgGyp`.

## Componentes do kit reusados
- `@components/ui/toggle-group` (ToggleGroup + ToggleGroupItem) → base do novo `SegmentedControl` compartilhado (ver specs)
- `@components/ui/card` → Appt Row
- `@components/ui/badge` → Status Pill do Appt Row (`variant="success"` já existe no kit desde o review do Home)

## Componentes do projeto reusados
- `@components/shared/nav-bar` → via `src/layouts/AppLayout.vue`, nenhuma mudança necessária

## Componentes compartilhados — specs

### SegmentedControl

- destino: src/components/shared/segmented-control/
- arquivos: SegmentedControl.vue, index.ts
- node_id: "n26QC" (Agenda) / "XA78J" (Home, 1ª ocorrência)
- screenshot: docs/pencil/agenda-segmented-control.webp
- usos_contados: 2
- aparições:
  - Home / Overview (1 instância — "Este mês" / "Total")
  - Agenda / CalendarPicker (1 instância — "Calendário" / "Lista")
- compound: não
- envolve_primitiva: sim — `ToggleGroup` + `ToggleGroupItem` (reka-ui via kit), forwarding de `type="single"` fixo internamente
- precisa_cva: não (mapa de classes fixo, 2 estados via `data-[state=on]`)
- props:
  - class?: HTMLAttributes['class'] — sempre presente, repassado ao `ToggleGroup`
  - modelValue: string — valor selecionado (v-model)
  - options: { value: string, label: string }[] — itens do controle, 2 no design, mas não travar em 2
  - ariaLabel?: string — rótulo acessível do grupo (ex. "Período", "Modo de visualização")
- emits:
  - update:modelValue: [value: string]
- data_slot: segmented-control
- slots: nenhum — data-driven via `options` (mesmo padrão do `ToggleGroupItem` v-for que já existia inline no Home)
- tokens_usados: bg-surface, bg-primary, text-primary-foreground, text-muted-foreground, text-tag
- depende_de: []
- exemplo_uso: |
  <SegmentedControl
    :model-value="period"
    :options="[{ value: 'month', label: 'Este mês' }, { value: 'total', label: 'Total' }]"
    aria-label="Período"
    @update:model-value="selectPeriod"
  />
- spec_confidence: alta
- spec_source: component_set (estrutura idêntica confirmada em 2 nodes de 2 páginas — `n26QC` e `XA78J` — mesmos tokens, mesmo raio, mesmo padding)
- responsivo: mobile 375px fixo, `width: fill_container` do pai, altura 44px
- a11y: `ToggleGroup` já expõe `aria-pressed`/`data-state` nativamente; exigir `aria-label` do consumidor (via prop) já que o rótulo visual muda por página
- status: implementado
- props_implementadas: [modelValue, options, ariaLabel, class]
- emits_implementados: [update:modelValue]
- revisao: |
  Não usou reactiveOmit/useForwardProps apesar de envolve_primitiva: sim — API fechada
  (modelValue/options/ariaLabel/class) em vez de repassar todo ToggleGroupRootProps,
  pra não vazar props do reka (type/multiple/disabled) que quebrariam o type="single" fixo.
  index.ts também exporta o tipo SegmentedControlOption.

## Estruturas inline-only

### CalendarGrid (Month Header + Weekday Headers + Month Grid)
- usos_contados: 1
- inline_na_secao: CalendarPicker
- motivo: única instância; lógica de geração de mês (dias, semanas, dia da semana do 1º dia) deve ser calculada (Date nativo ou date-fns), não hardcoded — grade seguinte muda a cada navegação de mês
- recomendacao: inline-na-secao, com a matriz de semanas computada em `computed()`
- node_id: "mBCyQ" (header), "N3RQ3" (weekday headers), "dUDjX" (grid)
- screenshot: docs/pencil/agenda-month-header.webp, docs/pencil/agenda-weekday-headers.webp, docs/pencil/agenda-month-grid.webp
- tokens_usados: bg-surface (botões prev/next), text-primary (setas), font-heading text-heading-lg (mês), text-muted-foreground-soft text-overline-sm (dias da semana), bg-primary/text-primary-foreground (dia selecionado), bg-primary-soft (dia "hoje", sem dot), text-tag-lg (número do dia), bg-marker (dot de dia com agendamento — branco quando o dia também está selecionado, ver nota abaixo)
- nota_de_leitura: dia 21 (selecionado) tem fill `bg-primary`, número branco, dot branco (contraste sobre o primary). Dia 20 tem fill `bg-primary-soft`, sem dot, sem indicação clara no design do que representa — provavelmente "hoje"; **não confirmado no Pencil** (nenhum node/variável identifica isso como "today"), section-builder deve tratar como decorativo/estático por ora ou perguntar. Dias 2, 9, 23, 25 têm dot laranja (`bg-marker`) = têm agendamento.

### DayHeader + AppointmentRow (Day Label + Appt Row)
- usos_contados: 1 (Appt Row) — mas repete via `v-for` quando o dia selecionado tem mais de 1 agendamento (ex. dia 23, que tem 2 no dado existente do Home)
- inline_na_secao: DayAppointments
- motivo: única instância visível no design (só o dia 21 está selecionado); repetição dentro da seção resolve com `v-for` (R6)
- recomendacao: v-for sobre `appointments.filter(a => a.date === selectedDate)`
- node_id: "F6oLo" (Day Label), "vu7qv" (Appt Row)
- screenshot: docs/pencil/agenda-day-label.webp, docs/pencil/agenda-appt-row.webp
- tokens_usados: text-item-title (Day Label, Client), text-label-lg (Service), text-overline (Status Pill label), bg-card, badge variant success/warning/error (já existente do kit)
- diferença do AppointmentCard do Home: layout horizontal (hora à esquerda em coluna fixa de 44px, sem o "dia" repetido — já está no Day Label acima da lista), não o card com dia+hora empilhados do Home. **Não são o mesmo componente** — não force reuso; a regra 3 do Passo 7 (match em manifesto anterior) não se aplica porque a estrutura visual é diferente.

## Plano de dados

### Dados propostos

```yaml
dados_propostos:
  - arquivo: src/data/agendamentos.ts
    acao: estender
    consumido_por: [CalendarPicker (dots do mês), DayAppointments (lista do dia selecionado)]
    exports_novos:
      - appointments: Appointment[]
    tipos_alterados:
      - Appointment ganha campo novo `date: string` (ISO, "YYYY-MM-DD") — aditivo, não quebra `upcomingAppointments` existente (Home só lê clientName/day/time/service/statusLabel/statusVariant, não itera todos os campos)
    valores_mock:
      - as 3 entradas já existentes (id 1, 2, 3) recebem `date`: '2026-09-21', '2026-09-23', '2026-09-23' respectivamente — batendo com "Segunda-feira, 21 de setembro" do Day Label e com as colunas do calendário (21=Seg, 23=Qua)
      - 3 entradas NOVAS e INVENTADAS (id 4, 5, 6) para os dias 2, 9 e 25 — a grade mostra dot nesses dias mas o design não revela conteúdo (só o dia 21 está selecionado na screenshot). Client/service/status são mock ilustrativo, sem base no design, mesmo padrão da Decisão 4 do manifesto do Home ("total" stats). Sinalizar isso no comentário do arquivo de dados, igual ao "Aguardando bot" do Home.
        - id 4: date '2026-09-02' (quarta), horário e cliente a definir no /build-page
        - id 5: date '2026-09-09' (quarta), idem
        - id 6: date '2026-09-25' (sexta), idem
    nota: 'appointments é a lista completa do mês (superset de upcomingAppointments, que continua existindo intocado para o Home). Sem camada de agrupamento por data no arquivo de dados — CalendarPicker e DayAppointments derivam o agrupamento com .filter()/.some() na própria view (R8: sem service/composable de domínio ainda).'
```

Glob em `src/data/` + `docs/build-manifest-home.md` confirmaram: mesmo domínio (`agendamentos`) já existe → estender, não duplicar (regra do Passo 8.2).

## Inventário de seções

| # | Nome | node-id | Arquivo | Reusa | Dados | Paralelizável | Screenshot | Formato |
|---|------|---------|---------|-------|-------|---------------|------------|---------|
| 1 | CalendarPicker | n26QC, mBCyQ, N3RQ3, dUDjX | src/views/agenda/CalendarPicker.vue | SegmentedControl (shared, Batch 0) | literal (labels, meses) + data:agendamentos (dots) + estado-local (mês exibido, segmento, dia selecionado) | não* | docs/pencil/agenda-segmented-control.webp, agenda-month-header.webp, agenda-weekday-headers.webp, agenda-month-grid.webp | webp |
| 2 | DayAppointments | F6oLo, vu7qv | src/views/agenda/DayAppointments.vue | ui/card, ui/badge | literal (título vazio-estado, se houver) + data:agendamentos (lista do dia) | não* | docs/pencil/agenda-day-label.webp, agenda-appt-row.webp | webp |

\* Não paralelizável: `DayAppointments` depende do `selectedDate` que `CalendarPicker` expõe — ambas vivem em `src/pages/Agenda.vue`, que precisa decidir onde mora o estado compartilhado (provavelmente elevar `selectedDate` pro `Agenda.vue` e passar como prop/evento, já que R8 não tem store de domínio ainda). Sinalizar essa decisão de composição pro `/build-page`.

Fora do inventário (chrome compartilhado, sem mudança):
| Nome | node-id | Arquivo | Reusa | Dados |
|------|---------|---------|-------|-------|
| NavBar (via layout) | nerQW (instância nesta tela) | src/layouts/AppLayout.vue | NavBar (shared, já implementado) | route.meta.title = 'Agenda' (literal) |

## Plano de execução (Fase 2)
1. Batch 0 serial: SegmentedControl (`src/components/shared/segmented-control/`)
2. Serial (dependência de estado): CalendarPicker → DayAppointments, compostas em `src/pages/Agenda.vue` com `selectedDate` elevado à página (ver nota de dependência acima)

## Critério de aceite por seção
- Fiel aos screenshots (docs/pencil/agenda-*.webp)
- Zero valor arbitrário em cor, tipografia e espaçamento; dimensão só quando vem do design (R1, R2)
- Componente com pasta, index.ts, prop `class`, `cn(..., props.class)`, `data-slot` e `<slot />` quando aplicável (R5)
- **Mobile-first** (herdado do Home) — base é o viewport 375px, sem `max-*`
- Tag semântica correta, `<h1>` não se aplica aqui (Header já é do Home) — Day Label pode ser `<h2>` de seção; `RouterLink` não se aplica (sem navegação interna nesta tela)
- Setas de navegação de mês (`‹`/`›`) são texto literal com `aria-label` no botão ("Mês anterior"/"Próximo mês")
- Grade do calendário: dias fora do mês corrente (ex. 31 de agosto, células vazias do fim) aparecem no design sem estilo diferenciado — implementar fiel ao Pencil (sem inventar "muted" pra dias adjacentes que o design não define)
- `statusVariant` decide a cor do Badge, nunca hardcoded no componente (mesma regra do Home)

## Addendum — Lista (node pUk68, adicionado em 2026-09-22)

Resolve as Decisões 6/7 (aba "Lista" sem conteúdo). Reconhecimento feito via `/pencil` direto (fluxo ad-hoc de 1 seção, não o orquestrador `/build-prep`+`/build-page`), já que era só uma seção nova numa página que já existia.

- node-id: pUk68 ("3b · Agenda (Lista)"), 375×766 — WebP (abaixo de 1000px)
- Screenshot: docs/pencil/agenda-lista-overview.webp, docs/pencil/agenda-lista-grouped-list.webp
- Nova seção: `src/views/agenda/AppointmentsList.vue` — lista de agendamentos agrupada por data (`Grouped List` do Pencil), reusando `text-label-strong`/`text-muted-foreground` pro cabeçalho de data (12px/700 — match exato, nenhum token novo) e o `AppointmentRow` (ver abaixo) por item.
- **Novo componente compartilhado `AppointmentRow`** (`src/components/agenda/appointment-row/`): o node "Appt" de `pUk68` é estruturalmente idêntico ao "Appt Row" de `xgGyp` (mesmo fill/cornerRadius/gap/padding, mesmos tokens). 2º uso real dentro da mesma página → extraído por R6, com `DayAppointments.vue` refatorado pra consumir o mesmo componente em vez de repetir o markup. Props `appointment: Appointment` + `class`; sem `<slot />` — decisão registrada no próprio arquivo (dado totalmente especificado, sem conteúdo projetável).
- **`SegmentedControl` subiu de `CalendarPicker.vue` pra `src/pages/Agenda.vue`**: o toggle Calendário/Lista decide qual seção a página renderiza (`v-if`), então não faz sentido morar dentro da seção que ele esconde. `viewMode` é `ref` local da página agora, não mais estado interno do `CalendarPicker` — `CalendarPicker.vue` ficou só com a grade + navegação de mês.
- **Dado corrigido em `src/data/agendamentos.ts`:** os ids 4-6 (dias 2, 9, 25), que o `/build-prep` original tinha marcado como mock inventado (sem acesso ao node `pUk68` na hora), agora têm conteúdo literal real lido do Pencil — Juliana Prado/Massagem relaxante, Renata Dias/Day spa completo (Aguardando bot, não Confirmado como o mock chutou), Fernanda Reis/Manicure e pedicure às 09:30 (não 13:00 como o mock chutou).
- Critério de aceite: mesmo da seção original (R1/R2, mobile-first, `statusVariant` decide cor do badge) + fidelidade aos 2 screenshots novos.

## Stubs criados
- src/pages/Agenda.vue
- src/views/agenda/ (pasta vazia)
- src/routers/index.ts — rota filha `agenda` adicionada em `AppLayout` (`{ path: 'agenda', component: () => import('@pages/Agenda.vue'), meta: { title: 'Agenda' } }`)

## Status

### Componentes (Batch 0)
- [x] SegmentedControl
- [x] AppointmentRow (addendum Lista — 2º uso real, extraído por R6)

### Seções (Batches 1-N)
- [x] CalendarPicker
- [x] DayAppointments
- [x] AppointmentsList (addendum Lista, node pUk68)
- [x] review (0 blockers, 3 majors — M1/M2 corrigidos, M3 pendente — ver docs/build-handoff-agenda.md)
- [x] bun run build (limpo, inclusive após o addendum Lista). bun check: só ruído pré-existente do biome.json (R14, ajuste pendente documentado) + organizeImports cosméticos

## Auditoria

- [x] Tokens de cor novos existem em `:root` e `@theme inline` (`.dark` pendente por decisão documentada — comentário atualizado)
- [x] Text-styles novos existem em `index.css` (4x `@utility text-`) E em `TEXT_STYLES` de `src/libs/utils.ts` (4 entradas novas — contagem bate)
- [x] Ícones: 0 a extrair — setas de navegação são texto literal, não ícone
- [x] Imagens: 0 image-fills no design, 0 arquivos esperados
- [x] Overview capturado (WebP — 375×616, abaixo de 1000px, PDF não necessário)
- [x] Cada seção do inventário tem screenshot (todas ≤1000px, todas em webp)
- [x] Spec do SegmentedControl tem props, data_slot, exemplo_uso e spec_confidence (alta)
- [x] Nenhum componente com confidence baixa — checkpoint humano não se aplica
- [x] Kit `ui/` consultado antes de propor componente novo (toggle-group, card, badge reusados diretamente; SegmentedControl é wrapper, não substitui nada do kit)
- [x] Cada seção tem fonte de dados declarada (`literal` | `data:{nome}` | `estado-local`)
- [x] Toda seção com dado estático aponta para `src/data/agendamentos.ts` (estender); Glob + manifesto anterior (Home) confirmaram mesmo domínio, sem duplicar
- [x] Stubs criados e rota registrada
- [x] Inventário confirmado pelo usuário (AskUserQuestion, 2026-09-22) — recorte de 2 seções e exclusão dos 6 modais de interação
