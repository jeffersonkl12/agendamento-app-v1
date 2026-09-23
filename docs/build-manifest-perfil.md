# Build Manifest — Perfil

> Gerado por /build-prep em 2026-09-23
> Fonte: pencil — node `arrCC` ("6 · Perfil"), arquivo `template/design.pen`
> Para implementar: `/build-page perfil`

## Identificação
- page: perfil
- página: src/pages/Perfil.vue
- seções: src/views/perfil/
- rota: /perfil

## Decisões de arquitetura (específicas deste produto, fora do RULES.md genérico)

1. **Mobile-first, não desktop-first.** O frame "6 · Perfil" tem 375px de largura fixa, sem artboard desktop — mesma decisão já registrada em `docs/build-manifest-home.md` e na memória [[mobile-first-override]]. Não aplicar `max-*`/R12 nesta página.
2. **Status Bar e Nav Bar fora do inventário.** "Status Bar" é mockup de chrome do iOS. "Nav Bar" é o componente compartilhado já implementado em `src/components/shared/nav-bar/`, consumido via `src/layouts/AppLayout.vue` — o título "Perfil" vem de `route.meta.title`, não de um heading duplicado na página.
3. **Dark mode pendente** — mesma pendência das páginas anteriores, ver [[dark-mode-pending]]. Nenhum token novo desta página tem variante `.dark`.
4. **"Sair da conta" fica inline na página, não é seção.** Mesmo padrão do botão "Salvar configuração" em `docs/build-manifest-configurar-agendamentos.md` (Decisão 7): ação única de página, sem estrutura própria repetida, não justifica `src/views/perfil/`.
5. **Sem side-effect inventado nos botões.** "Editar" e "Sair da conta" ficam fiéis ao visual (abrem modal/disparam ação, conforme o `section-builder` decidir na Fase 2) — nenhuma navegação ou lógica foi assumida aqui.

## Frame raiz
- node-id: arrCC ("6 · Perfil")
- Screenshot: docs/pencil/perfil-overview.webp (375×616, mobile)

## Tokens

### Adicionados (`src/assets/index.css` + `TEXT_STYLES` em `src/libs/utils.ts`)

Nenhuma cor nova — `GetVariables()` do Pencil devolveu só cores já mapeadas 1:1 no catálogo atual (`primary`, `primary-soft`, `bg`, `text-primary`, `text-secondary`, `white`, `error`, `error-bg`, `font-display`, `font-ui`); nada fora do que já existe em `:root`/`@theme inline`.

Text-style novo:

| Classe | Tamanho/Peso/Altura | Uso |
| --- | --- | --- |
| `text-metric-xs` | 1.25rem / 400 / 1.2 | "Plano Essencial" (Plan Name, `font-display`) |

Sem `line-height` explícita no Pencil para esse nó; `1.2` escolhido por consistência com a família `font-display` já no catálogo (`text-display`, `text-metric`, `text-metric-sm`, todas 1.2). `text-title` (20px) não serve: mesmo tamanho mas peso 300, enquanto este nó é peso 400 (`fontWeight: "normal"`).

### Reusados

| Token | Valor | Uso nesta página |
| --- | --- | --- |
| `--background` (`$bg`) | `#FAF6F5` | fundo da tela |
| `--foreground` (`$text-primary`) | `#2B2225` | Name ("Studio Bella"), Plan Label ("Seu plano") |
| `--muted-foreground` (`$text-secondary`) | `#8B7B7D` | Subtitle, Sub ("Nome do seu negócio") |
| `--card` (`$white`) | `#FFFFFF` | fundo do Name Row |
| `--primary` (`$primary`) | `#7A4B5C` | texto do Avatar Circle/Hint/Edit Btn, fundo do Plan Card |
| `--primary-soft` (`$primary-soft`) | `#EBDCE0` | fundo Avatar Circle/Edit Btn, texto Renewal/Plan Price sobre `--primary` |
| `--error` (`$error`) | `#B5484B` | texto "Sair da conta" |
| `--error-bg` (`$error-bg`) | `#F6DEDE` | fundo do botão "Sair da conta" |
| `--primary-foreground` (`$white`) | `#FFFFFF` | "Plano Essencial" sobre fundo `--primary` — corrigido no code review pós-build (M2): `$white` num texto sobre `--primary` mapeia pro par de token do tema (`text-primary-foreground`), não pra paleta crua do Tailwind (`text-white`), senão o contraste quebra quando o `.dark` for desenhado. Mesmo padrão do Ticket Card do Home (`src/views/home/Overview.vue`). |

Text-styles reusados (match exato size/peso/altura já no catálogo):

| Classe | Uso |
| --- | --- |
| `text-caption-md` | Subtitle ("Seus dados e assinatura"), Plan Price ("R$ 49,90/mês") |
| `text-label-lg` | Placeholder do Avatar ("Sua foto") |
| `text-label-strong-lg` | Hint ("Toque para definir uma foto"), Edit Btn ("Editar") |
| `text-heading-sm` | Name ("Studio Bella") |
| `text-label` | Sub ("Nome do seu negócio") |
| `text-tag` | Plan Label ("Seu plano") |
| `text-label-strong` | Renewal ("Renova em 12 de outubro") |
| `text-button-strong` | Logout Label ("Sair da conta") |

## Ícones
Nenhum ícone no design desta tela — `arrCC` não tem nenhum node `icon`/`path`/`vector` nem grupo de vetores (confirmado por varredura completa da árvore: só `frame`, `ref` e `text`).
- Total extraído: 0

## Imagens
Nenhuma — nenhum node com `fill.type: "image"` em `arrCC`.

## Componentes do kit reusados
- `@components/ui/avatar` → Avatar Circle (placeholder de foto, "Sua foto")
- `@components/ui/button` → Edit Btn ("Editar", ProfileHeader) e Logout Btn ("Sair da conta", inline na página — Decisão 4)

Decisão final de variant/classes exatas é do `section-builder` (Fase 2); aqui só ficam os candidatos com maior aderência estrutural ao design.

## Componentes do projeto reusados
- `@components/shared/nav-bar` → via `src/layouts/AppLayout.vue`, nenhuma mudança necessária

## Componentes compartilhados — specs
Nenhuma. O kit `ui/avatar` e `ui/button` já cobre as duas estruturas repetíveis desta página (regra 1 do Passo 7 vence antes das regras 4-6); nenhuma estrutura própria do produto passa de 1 uso nesta tela.

## Estruturas inline-only

### NameRow
- usos_contados: 1
- inline_na_secao: ProfileHeader
- motivo: "Card branco com nome do negócio + botão Editar, aparece só nesta seção."
- recomendacao: inline-na-secao
- node_id: JWg4o
- screenshot: docs/pencil/perfil-profile-header-name-row.webp
- tokens_usados: bg-card, text-heading-sm, text-foreground, text-label, text-muted-foreground

### PlanCard
- usos_contados: 1
- inline_na_secao: Plan
- motivo: "Card de plano com fundo primary, aparece só na seção Plan. Estrutura visualmente parecida com o Ticket Card do Home, mas domínio diferente (assinatura vs carteira) e sem componente compartilhado extraído de lá — não há match de manifesto anterior (regra 3 do Passo 7)."
- recomendacao: inline-na-secao
- node_id: Cqxo6
- screenshot: docs/pencil/perfil-plan.webp
- tokens_usados: bg-primary, text-primary-foreground, text-primary-soft, text-metric-xs, text-label-strong, text-caption-md

Fora do inventário (chrome compartilhado ou ação única de página, sem seção própria):

| Nome | node-id | Arquivo | Reusa | Dados |
|------|---------|---------|-------|-------|
| NavBar (via layout) | F47csJ (instância nesta tela) | src/layouts/AppLayout.vue | NavBar (shared, já implementado) | route.meta.title = 'Perfil' (literal) |
| Logout Btn (inline na página) | DZ7KV | src/pages/Perfil.vue | ui/button | literal ("Sair da conta") — ver Decisão 4 |

## Plano de dados

### Dados propostos
- src/data/plano.ts — acao: criar
  - consumido_por: [Plan]
  - exports: `plan: Plan`
  - tipos: `Plan { name: string, price: string, renewalLabel: string }`
  - valores: `{ name: 'Plano Essencial', price: 'R$ 49,90/mês', renewalLabel: 'Renova em 12 de outubro' }`
- src/data/business.ts — acao: estender (checado: domínio já existe, `Business.name` cobre o Name Row; nenhum export novo necessário)
  - consumido_por: [ProfileHeader]

Texto literal (não vai para `src/data/`): Subtitle "Seus dados e assinatura", Placeholder "Sua foto", Hint "Toque para definir uma foto", Sub "Nome do seu negócio", Edit Btn "Editar", Plan Label "Seu plano", Logout Btn "Sair da conta".

Sem `estado-local` nesta página — nenhuma interação (filtro, paginação, seleção, open/closed) identificada no design; "Editar" e "Sair da conta" são ações sem estado visual próprio no Pencil.

## Inventário de seções

| # | Nome | node-id | Arquivo | Reusa | Dados | Paralelizável | Screenshot | Formato |
|---|------|---------|---------|-------|-------|---------------|------------|---------|
| 1 | ProfileHeader | UcPqn, xb8Fo, JWg4o | src/views/perfil/ProfileHeader.vue | ui/avatar, ui/button | literal (subtitle, hint) + data:business (`business.name`) | sim | docs/pencil/perfil-profile-header-subtitle.webp, docs/pencil/perfil-profile-header-avatar.webp, docs/pencil/perfil-profile-header-name-row.webp | webp |
| 2 | Plan | DwrOF | src/views/perfil/Plan.vue | — | literal (label "Seu plano") + data:plano (`plan`) | sim | docs/pencil/perfil-plan.webp | webp |

## Plano de execução (Fase 2)
1. Sem Batch 0 — nenhum componente compartilhado novo nesta página.
2. Batch paralelo (máx 3): ProfileHeader, Plan
3. Serial no fim: compor `src/pages/Perfil.vue` com as 2 seções + o botão "Sair da conta" inline
4. `bun check` + `bun run build` uma única vez no fim

## Critério de aceite por seção
- Fiel aos screenshots de `docs/pencil/perfil-*.webp`
- Zero valor arbitrário em cor, tipografia e espaçamento; dimensão só quando vem do design (R1, R2)
- Base mobile 375px, sem `max-*` (override do R12, ver Decisão 1 e [[mobile-first-override]])
- Avatar via `@components/ui/avatar` (`AvatarFallback` com o texto "Sua foto", não iniciais — este não é o mesmo avatar do NavBar)
- Botões via `@components/ui/button`; "Editar" e "Sair da conta" fiéis visualmente, sem navegação ou side-effect inventado (Decisão 5)
- Tag semântica correta, `<h1>` único na página. Como em `src/pages/Agenda.vue`, o título visível já vem do NavBar via `route.meta.title` — a página precisa de um `<h1 class="sr-only">Perfil</h1>` visualmente oculto para acessibilidade (R13)
- `RouterLink` só para navegação interna real — não há nenhuma nesta página

## Stubs criados
- src/pages/Perfil.vue
- src/views/perfil/ (pasta vazia)
- rota em src/routers/ (`/perfil`, lazy, comentada até o `/build-page`)

## Status

### Componentes (Batch 0)
- Nenhum.

### Seções (Batches 1-N)
- [ ] ProfileHeader
- [ ] Plan
- [ ] bun check + bun run build
- [ ] review
