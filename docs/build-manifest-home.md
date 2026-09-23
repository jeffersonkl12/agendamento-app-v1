# Build Manifest — Home

> Gerado por /build-prep em 2026-09-22
> Fonte: pencil — node mbZu2 ("2 · Início"), arquivo `template/design.pen`
> Para implementar: `/build-page home`

## Identificação
- page: home
- página: src/pages/Home.vue
- seções: src/views/home/
- rota: /

## Decisões de arquitetura (específicas deste produto, fora do RULES.md genérico)

1. **Mobile-first, não desktop-first.** Todas as 5 telas do fluxo no Pencil (`1 · Login`, `2 · Início`, `3 · Agenda`, `1b · Cadastro`, `3b · Agenda (Lista)`) têm exatamente 375px de largura — não existe artboard desktop. O R12 do RULES.md (desktop-first com `max-*`) assume um SaaS de tela grande, premissa que não se aplica aqui. Decisão do usuário: tratar este produto como mobile-first; breakpoints, quando necessários, sobem a partir da base mobile (`min-*`/`sm:`/`md:` normais do Tailwind, não `max-*`). **Isso vale para as próximas páginas também** — não é uma exceção só do Home. Não editei o RULES.md (ele documenta o template genérico, não este produto); se quiser, isso pode virar uma nota no CLAUDE.md do projeto.
2. **Status Bar excluída da implementação.** O frame reusável "Status Bar" (relógio + ícones de sinal/bateria) é mockup de chrome do iOS, não UI do app. Não entra no inventário nem em nenhum component spec.
3. **Dark mode pendente.** O arquivo Pencil não define nenhum valor de tema escuro. Os tokens novos (`--primary-soft`, `--surface`, `--success(-bg)`, `--warning(-bg)`, `--error(-bg)`, e as cores base primary/background/etc. atualizadas) só têm valor em `:root` e `@theme inline`; `.dark` ficou com um comentário marcando a pendência. Não inventei paleta escura sem referência de design.
4. **Texto "Aguardando bot" mantido literal.** O node de status do 3º agendamento (Beatriz Lima) tem `content: "Aguardando bot"` no Pencil — parece truncado, mas por regra o texto vem do campo `content`, nunca da inferência. Mantido literal nos dados mockados; ajustar no Pencil quando o texto certo for definido.

## Frame raiz
- node-id: mbZu2 ("2 · Início")
- Screenshot: docs/pencil/home-overview.pdf (375×755, mobile)

## Tokens

### Adicionados (`src/assets/index.css` + `TEXT_STYLES` em `src/libs/utils.ts`)

Cores — `:root` e `@theme inline` (dark pendente, ver Decisão 3):

| Token | Valor | Uso |
| --- | --- | --- |
| `--background` | `#FAF6F5` | fundo da tela (substituiu o branco genérico do template) |
| `--foreground` | `#2B2225` | texto principal |
| `--card` | `#FFFFFF` | fundo dos cards |
| `--primary` | `#7A4B5C` | cor de marca (tabs ativa, ticket card, avatar) |
| `--primary-foreground` | `#FFFFFF` | texto sobre `--primary` |
| `--secondary` / `--muted` | `var(--surface)` | trilho do segmented control, fundos neutros |
| `--secondary-foreground` / `--muted-foreground` | `#8B7B7D` | texto secundário |
| `--accent` | `var(--primary-soft)` | ênfase leve |
| `--destructive` | `var(--error)` | erro (alias, ver abaixo) |
| `--border` / `--input` | `var(--primary-soft)` | bordas sutis |
| `--ring` | `var(--primary)` | foco |
| `--primary-soft` *(novo)* | `#EBDCE0` | texto secundário sobre `--primary` (ticket card) |
| `--surface` *(novo)* | `#F1E9E4` | mesmo valor de secondary/muted, nome nativo do design |
| `--success` / `--success-bg` *(novos)* | `#4F7A5B` / `#E3EEE5` | badge "Confirmado" |
| `--warning` / `--warning-bg` *(novos)* | `#B5772F` / `#F7E7D3` | badge "Aguardando bot" |
| `--error` / `--error-bg` *(novos)* | `#B5484B` / `#F6DEDE` | não usado no Home ainda; registrado porque faz parte da paleta global do arquivo Pencil (usos futuros de status "cancelado") |

Fontes — `@theme inline`:

| Token | Valor | Uso |
| --- | --- | --- |
| `--font-sans` | `'Manrope'` | substituiu `'JetBrains Mono Variable'` (placeholder do template) — corpo, labels |
| `--font-heading` | `'Libre Caslon Display'` | saudação e valores numéricos (métricas) |

Google Fonts import em `index.css` trocado de Inter (não usado em lugar nenhum) para Manrope + Libre Caslon Display.

### Text-styles novos (`@utility text-*` + `TEXT_STYLES`)

| Classe | Tamanho/Peso/Altura | Uso |
| --- | --- | --- |
| `text-display` | 1.625rem / 400 / 1.2 | Saudação ("Olá, Studio Bella") — combinar com `font-heading` |
| `text-metric` | 1.5rem / 400 / 1.2 | Valores dos cards de estatística — combinar com `font-heading` |
| `text-metric-sm` | 1.375rem / 400 / 1.2 | Valor do Ticket Card — combinar com `font-heading` |
| `text-subheading` | 1rem / 700 / 1.3 | Título de seção ("Próximos agendamentos") |
| `text-heading-sm` | 0.9375rem / 700 / 1.3 | Título do Nav Bar, horário do agendamento |
| `text-item-title` | 0.875rem / 700 / 1.3 | Nome do cliente |
| `text-tag` | 0.8125rem / 700 / 1.2 | Labels do segmented control, iniciais do avatar, link "Ver agenda →" |
| `text-label-strong` | 0.75rem / 700 / 1.3 | Labels dos stat cards ("Faturamento", "Agendamentos", "Ticket médio") |
| `text-overline` | 0.6875rem / 700 / 1.3 | Dia do agendamento, texto do status pill |

Nenhuma `line-height` veio explícita no Pencil para esses nós (usa o default da fonte); os valores acima são uma escolha consistente com o catálogo existente, não uma leitura direta do design — sinalizado aqui em vez de forjar precisão que a fonte não declarou.

### Reusados
Nenhum token do catálogo anterior do template reaproveitado como está — o template tinha apenas placeholders (paleta azul genérica do shadcn), todos substituídos pela paleta real da marca.

## Ícones
- Local: nenhum arquivo extraído — o único ícone do design ("menu", biblioteca lucide no Pencil) tem equivalente direto no kit do projeto: `PhList` de `@phosphor-icons/vue` (R10 proíbe segunda biblioteca de ícone). Usado no botão de menu do Nav Bar.
- Total extraído: 0

## Imagens
Nenhuma — não há image-fill em nenhum node do Home.

## Componentes do kit reusados
- `@components/ui/toggle-group` (ToggleGroup type="single" + ToggleGroupItem) → Segmented Control (Overview)
  - trocado de `ui/tabs` pra `ui/toggle-group` no code review pós-build (M1): o controle filtra dado (só um valor selecionado, sem painéis) — é semanticamente um radio group, não abas com conteúdo por aba.
  - pill ativo via override `data-[state=on]:*`/`aria-pressed:*` na instância do `ToggleGroupItem` (bg-primary/text-primary-foreground) — não editou o arquivo-fonte do kit.
- `@components/ui/card` → Stats cards, Ticket Card, cards de agendamento (Overview, UpcomingAppointments)
- `@components/ui/badge` → Status Pill (UpcomingAppointments)
  - evolucao_pedida `[variant: 'success', variant: 'warning']` **atendida** no code review pós-build: `src/components/ui/badge/index.ts` ganhou `success`, `warning` e `error` no `badgeVariants` (cores só, forma/tamanho continuam por override de instância).

**Não existe no kit:** Avatar. O kit não tem pasta `avatar/`. Recomendação: não instalar via `shadcn-vue add avatar` (traz fallback de imagem que não é necessário aqui) — montar como círculo + texto inline dentro do `NavBar`, só com iniciais.

## Componentes compartilhados — specs

### NavBar
- destino: src/components/shared/nav-bar/
- arquivos: NavBar.vue, index.ts
- node_id: "YlGtF"
- screenshot: docs/pencil/home-topbar.webp
- usos_contados: 6
- aparições:
  - 2 · Início (1 instância — título "Início")
  - 3 · Agenda (2 instâncias — título "Agenda")
  - 4 · Modelo de atendimento (1 instância)
  - 5 · Configurar agendamentos (1 instância)
  - Perfil (1 instância)
- compound: não
- envolve_primitiva: não
- precisa_cva: não
- props:
  - class: HTMLAttributes['class'] — sempre presente
- emits:
  - menuClick: [] — disparado no clique do botão de menu
- data_slot: nav-bar
- slots:
  - default — título central (ex. "Início"); consumidor decide a tag/estilo do texto
  - actions — conteúdo à direita (ex. avatar com iniciais); NavBar não sabe o que é
- tokens_usados: bg-background, bg-surface (botão de menu), text-foreground, text-heading-sm
- depende_de: []
- exemplo_uso: |
  <NavBar @menu-click="abrirMenu">
    Início
    <template #actions>
      <span class="bg-primary text-primary-foreground text-tag flex size-8.5 items-center justify-center rounded-full" role="img" aria-label="Studio Bella">SB</span>
    </template>
  </NavBar>
- spec_confidence: alta
- spec_source: component_set (nó `reusable: true` no Pencil, 6 instâncias confirmadas via busca no documento)
- responsivo: mobile 375px fixo, altura 60px, `width: fill_container` do viewport
- a11y: botão de menu precisa `aria-label="Abrir menu"`; ícone `PhList` com `aria-hidden="true"`
- status: implementado
- props_implementadas: [class]
- emits_implementados: [menuClick]
- revisao: |
  API original (v1) usava props `title`/`avatarInitials` — trocada por slots (`default` + `actions`)
  após o code review do /build-page (M4): props de string fechavam a API pra evoluções futuras
  (outra ação à direita em outra página) e violavam R5.6 (markup fechado sem slot). Consumidor
  agora é src/layouts/AppLayout.vue, não mais uma seção por página.

## Estruturas inline-only

### SegmentedControl (Este mês / Total)
- usos_contados: 1
- inline_na_secao: Overview
- motivo: única instância nesta página; primeiro manifesto do projeto, sem histórico pra cruzar
- recomendacao: inline-na-secao, montado sobre `@components/ui/toggle-group` (trocado de `ui/tabs` no review pós-build, ver "Componentes do kit reusados")
- node_id: "XA78J"
- screenshot: docs/pencil/home-overview-segmented-control.webp
- tokens_usados: bg-surface, bg-primary, text-primary-foreground, text-muted-foreground, text-tag

### StatCard (Faturamento / Agendamentos)
- usos_contados: 2, mas dentro da mesma seção (Overview)
- inline_na_secao: Overview
- motivo: repetição dentro da seção — resolve com `v-for` sobre array, não vira componente (R6)
- recomendacao: v-for
- node_id: "v9qHWh" (padrão)
- screenshot: docs/pencil/home-overview-stats-row.webp
- tokens_usados: bg-card, text-label-strong, text-muted-foreground, text-metric, text-foreground, font-heading

### TicketCard
- usos_contados: 1
- inline_na_secao: Overview
- motivo: única instância
- recomendacao: inline-na-secao, sobre `@components/ui/card` com `bg-primary`
- node_id: "lfwKf"
- screenshot: docs/pencil/home-overview-ticket-card.webp
- tokens_usados: bg-primary, text-primary-soft, text-white, text-label-strong, text-metric-sm, text-caption

### SectionHead (Próximos agendamentos / Ver agenda →)
- usos_contados: 1
- inline_na_secao: UpcomingAppointments
- motivo: única instância nesta página; reavaliar quando a página Agenda for construída — o overview geral do app sugere um cabeçalho parecido lá
- recomendacao: inline-na-secao
- node_id: "S0BgBq"
- tokens_usados: text-subheading, text-tag

### AppointmentCard
- usos_contados: 3, mesma seção (UpcomingAppointments)
- inline_na_secao: UpcomingAppointments
- motivo: repetição dentro da seção — `v-for` sobre `@data/agendamentos` (R6)
- recomendacao: v-for
- node_id: "xn985" (padrão)
- screenshot: docs/pencil/home-appointments-list.webp
- tokens_usados: bg-card, text-overline, text-heading-sm, text-item-title, text-muted-foreground

## Plano de dados

### Dados propostos

Revisado no code review pós-build: `business` saiu de `home.ts` pra um arquivo próprio
(`src/data/business.ts`), porque é identidade do negócio consumida pelo **layout**
(`src/layouts/AppLayout.vue`, chrome de toda página), não um dado específico da Home. `stats`
também virou `Record<Period, Stats>` (era um objeto único, sem efeito real ao trocar de aba).

```yaml
dados_propostos:
  - arquivo: src/data/business.ts
    acao: criar
    consumido_por: [src/layouts/AppLayout.vue, Header]
    exports:
      - business: Business
    tipos:
      - Business { name: string, initials: string }
    valores_mock:
      - business: { name: 'Studio Bella', initials: 'SB' }
    nota: 'domínio app-wide (identidade do negócio no chrome), não fica sob home.ts'

  - arquivo: src/data/home.ts
    acao: criar
    consumido_por: [Overview]
    exports:
      - stats: Record<Period, Stats>
    tipos:
      - Period 'month' | 'total'
      - Stats { revenue: number, appointmentsCount: number, avgTicket: number }
    valores_mock:
      - stats.month: { revenue: 3240, appointmentsCount: 42, avgTicket: 77.14 }
      - stats.total: { revenue: 28960, appointmentsCount: 376, avgTicket: 77.02 }
    nota: 'valores de "total" são mock ilustrativo — o design só mostra o estado "Este mês"'

  - arquivo: src/data/agendamentos.ts
    acao: criar
    consumido_por: [UpcomingAppointments]
    exports:
      - upcomingAppointments: Appointment[]
    tipos:
      - Appointment { id: string, day: string, time: string, clientName: string, service: string, statusLabel: string, statusVariant: 'success' | 'warning' | 'error' }
    valores_mock:
      - { id: '1', day: 'SEG 21', time: '09:00', clientName: 'Mariana Alves', service: 'Limpeza de pele', statusLabel: 'Confirmado', statusVariant: 'success' }
      - { id: '2', day: 'QUA 23', time: '10:00', clientName: 'Carla Souza', service: 'Day spa completo', statusLabel: 'Confirmado', statusVariant: 'success' }
      - { id: '3', day: 'QUA 23', time: '14:30', clientName: 'Beatriz Lima', service: 'Massagem relaxante', statusLabel: 'Aguardando bot', statusVariant: 'warning' }
    nota: 'domínio pensado para ser estendido pela página Agenda (mesmo arquivo, novos exports) — não duplicar quando /build-prep rodar pra Agenda.'
```

`statusLabel` guarda o texto literal do design (inclusive o "Aguardando bot" truncado, ver Decisão 4) em vez de um enum traduzido — o componente só usa `statusVariant` pra escolher a cor do badge.

Nenhum Glob prévio em `src/data/` ou manifesto anterior — projeto novo, ambos os arquivos são `criar`.

## Inventário de seções

> `Topbar` deixou de ser uma seção da página no code review pós-build (M3): o NavBar é chrome
> compartilhado por todas as telas do app (6 instâncias confirmadas no Pencil), não conteúdo
> da Home. Virou `src/layouts/AppLayout.vue` (fora do escopo de `src/views/{page}/`), com o
> título vindo de `route.meta.title` por rota.

| # | Nome | node-id | Arquivo | Reusa | Dados | Paralelizável | Screenshot | Formato |
|---|------|---------|---------|-------|-------|---------------|------------|---------|
| 1 | Header | b22FF | src/views/home/Header.vue | — | literal + data:business (business.name) | sim | docs/pencil/home-header.webp | webp |
| 2 | Overview | XA78J, gO1I9, lfwKf | src/views/home/Overview.vue | ui/toggle-group, ui/card | literal (labels) + data:home (stats por período) + estado-local (segmento selecionado) | sim | docs/pencil/home-overview-segmented-control.webp, docs/pencil/home-overview-stats-row.webp, docs/pencil/home-overview-ticket-card.webp | webp |
| 3 | UpcomingAppointments | S0BgBq, WbWHl | src/views/home/UpcomingAppointments.vue | ui/card, ui/badge | literal (título/link) + data:agendamentos | sim | docs/pencil/home-appointments-list.webp | webp |

Fora do inventário de seções (chrome compartilhado):

| Nome | node-id | Arquivo | Reusa | Dados |
|------|---------|---------|-------|-------|
| NavBar (via layout) | UNws0 (instância na Home) | src/layouts/AppLayout.vue | NavBar (shared, Batch 0) | route.meta.title (literal por rota) + data:business (avatar) |

## Plano de execução (Fase 2)
1. Batch 0 serial: NavBar (`src/components/shared/nav-bar/`)
2. Batch paralelo (máx 3): Header, Overview, UpcomingAppointments
3. ~~Serial no fim: Topbar~~ — removido no code review pós-build (M3); virou `src/layouts/AppLayout.vue`, fora do fluxo de seções

## Critério de aceite por seção
- Fiel aos screenshots (docs/pencil/home-*.webp e home-overview.pdf)
- Zero valor arbitrário em cor, tipografia e espaçamento; dimensão só quando vem do design (R1, R2)
- Componente com pasta, index.ts, prop `class`, `cn(..., props.class)`, `data-slot` e `<slot />` quando aplicável (R5)
- Ícone via `@phosphor-icons/vue` (`PhList`), `aria-hidden` quando decorativo, `aria-label` no botão só-ícone (R10)
- **Mobile-first** (exceção ao R12 documentada acima) — base é o viewport 375px, sem `max-*`
- Tag semântica correta, `<h1>` único (Header/Greeting), `RouterLink` se houver navegação interna (R13)
- Status pill usa `statusVariant` pra cor, `statusLabel` pro texto — nunca hardcoded no componente

## Stubs criados
- src/pages/Home.vue
- src/views/home/ (pasta vazia)
- src/routers/index.ts (não existia — criado do zero; depois do review virou rota aninhada: `/` usa `@layouts/AppLayout.vue` como pai, `Home.vue` é filha com `meta: { title: 'Início' }`)
- src/main.ts atualizado (`app.use(router)`)
- src/App.vue atualizado (só `<RouterView />` — o `<main>` migrou pro layout)
- src/layouts/AppLayout.vue (criado no code review pós-build, M3 — não previsto no /build-prep original)

## Status

### Componentes (Batch 0)
- [x] NavBar (v1: props title/avatarInitials; v2 pós-review: slots default/actions)

### Seções (Batches 1-N)
- [x] Header
- [x] Overview
- [x] UpcomingAppointments
- [x] ~~Topbar~~ — removido, virou src/layouts/AppLayout.vue
- [x] review (1ª rodada — 0 blockers, 5 majors, correções aplicadas nesta seção)
- [x] bun run build (limpo — corrigido erro pré-existente em src/components/ui/chart/, alheio à Home, ver docs/build-handoff-home.md)
- [x] bun check (0 erros reais nos arquivos da Home; ruído de formatação pré-existente por divergência do biome.json com a R14, ver handoff P3)

## Auditoria

- [x] Tokens de cor novos existem em `:root` e `@theme inline` (`.dark` pendente por decisão documentada, não por omissão)
- [x] Text-styles novos existem em `index.css` (9x `@utility text-`) E em `TEXT_STYLES` de `src/libs/utils.ts` (9 entradas novas — contagem bate)
- [x] Ícones: 0 a extrair — único ícone do design mapeado para `PhList` do kit existente
- [x] Imagens: 0 image-fills no design, 0 arquivos esperados
- [x] Overview capturado em PDF (`docs/pencil/home-overview.pdf`)
- [x] Cada seção do inventário tem screenshot (todas ≤1000px, todas em webp)
- [x] Spec do NavBar tem props, data_slot, exemplo_uso e spec_confidence
- [x] Nenhum componente com confidence baixa (NavBar é alta) — checkpoint humano não se aplica
- [x] Kit `ui/` consultado antes de propor componente novo (tabs, card, badge reusados; avatar confirmado ausente)
- [x] Cada seção tem fonte de dados declarada (`literal` | `data:{nome}` | `estado-local`)
- [x] Toda seção com dado estático aponta para `src/data/home.ts` ou `src/data/agendamentos.ts`; Glob em `src/data/` confirmou projeto novo, sem manifesto anterior pra cruzar
- [x] Stubs criados e rota registrada (rota + bootstrap de router, já que o projeto não tinha nenhum)
