# Build Manifest — ModeloAtendimento

> Gerado por /build-prep em 2026-09-22
> Fonte: pencil — node E5dfj ("4 · Modelo de atendimento"), arquivo `template/design.pen`
> Para implementar: `/build-page modelo-atendimento`

## Identificação
- page: modelo-atendimento
- página: src/pages/ModeloAtendimento.vue
- seções: src/views/modelo-atendimento/
- rota: /modelo-atendimento (nested em AppLayout, mesmo padrão do Home/Agenda)

## Decisões de arquitetura (específicas deste produto)

1. **Mobile-first** — herda a decisão registrada em `docs/build-manifest-home.md` e na memória do projeto ([[mobile-first-override]]): base 375px, sem `max-*` do R12. A tela root (`E5dfj`) tem 375×754, abaixo dos 1000px que forçariam PDF — todos os screenshots saíram em WebP.
2. **Status Bar excluída** — mesmo mockup de chrome do iOS do Home/Agenda, fora do inventário.
3. **Nav Bar via layout** — a instância `dLHIu` desta tela usa o componente compartilhado já implementado em `src/components/shared/nav-bar/` (Batch 0 do Home). `route.meta.title = 'Modelo de atendimento'` alimenta o título; nada novo a fazer aqui.
4. **Dark mode pendente** — mesma decisão do Home/Agenda ([[dark-mode-pending]]). Os 2 tokens de cor novos desta página (`--border-subtle`, `--border-strong`) só têm valor em `:root`/`@theme inline`; `.dark` ganhou entrada no comentário de pendência existente.
5. **Escopo restrito ao node `E5dfj`, confirmado com o usuário em 2026-09-22.** O Pencil tem 6 frames irmãos ligados a este fluxo, fora do node pedido:
   - `H5XmZp` — Modal · Modelo de Atendimento · Nova Pergunta (Texto Livre)
   - `xOfgO` — Modal · Modelo de Atendimento · Nova Pergunta (Escolha Única · Múltipla)
   - `slvWh` — Modal · Modelo de Atendimento · Nova Pergunta (Número)
   - `hclJG` — Modal · Modelo de Atendimento · Nova Pergunta (Sim ou Não)
   - `Qdac5` — Modal · Modelo de Atendimento · Editar Pergunta (Escolha Única)
   - `CWmUo` — Modal · Modelo de Atendimento · Excluir Pergunta

   Isso sugere que "Editar nome", "+ Adicionar pergunta" e um tap numa pergunta existente deveriam abrir esses bottom sheets/dialogs. **Decisão do usuário: não implementar agora.** Esta rodada cobre só o que está em `E5dfj` (nome do serviço, preço base e lista de perguntas, exatamente como a screenshot mostra). Os 6 modais ficam registrados aqui como pendência — rodar um `/build-prep` dedicado a eles (reaproveitando este manifesto como base) antes de dar ação real aos botões "Editar nome" e "+ Adicionar pergunta", e ao tap numa pergunta da lista.
6. **Botões sem ação nesta rodada.** Sem o reconhecimento dos 6 modais (fora de escopo, ver decisão 5), o `section-builder` deve renderizar "Editar nome" e "+ Adicionar pergunta" como elementos visuais fiéis ao design, mas sem side-effect real (no máximo um `console.info`/TODO ou handler vazio) — não inventar um modal inline que o design não mostrou aqui.
7. **Ícones do design são glifos de texto, não SVG.** Os símbolos `◉`, `✓`, `Aa` e `#` nos badges das perguntas são nodes `type: "text"` (`content` literal), não ícones do Pencil. R10 (SVG/Phosphor) não se aplica a eles — ver seção `## Ícones`.
9. **Correção pós-dispatch (2026-09-22, `/build-page`):** o Subtitle (`qrkb5`) foi originalmente agrupado em QuestionsList no prep, mas os dois `section-builder` (independentemente) reportaram `duvida` de que ele aparece ANTES do Name Row/Price Card no overview, não antes das Fields. Corrigido: Subtitle passou pra ServiceHeader (primeiro elemento, antes do Name Row). Inventário acima já reflete o agrupamento corrigido.
8. **Nenhum componente novo em `src/components/`.** `Name Row`, `Price Card` e a estrutura de cada "Field" (badge + título + meta) aparecem só nesta página; `Field` repete 4× dentro da mesma seção → resolve com `v-for` (R6). Sem 2º consumidor em nenhum caso, então tudo fica inline — ver `## Estruturas inline-only`.

## Frame raiz
- node-id: E5dfj ("4 · Modelo de atendimento")
- Screenshot: docs/pencil/modelo-atendimento-overview.webp (375×754, mobile, WebP)

## Tokens

### Adicionados (`src/assets/index.css` + `TEXT_STYLES` em `src/libs/utils.ts`)

Cores — `:root` e `@theme inline` (dark pendente, ver Decisão 4):

| Token | Valor | Uso |
| --- | --- | --- |
| `--border-subtle` *(novo)* | `#E5DAD5` | stroke do campo de preço (`Price Input`, `LfUWw`) — cor literal no Pencil, sem variável nomeada |
| `--border-strong` *(novo)* | `#C9B8B2` | stroke do botão "+ Adicionar pergunta" (`X4jOrF`) — cor literal no Pencil, sem variável nomeada |

Text-styles novos (`@utility text-*` + `TEXT_STYLES`) — valores exatos do Pencil, sem arredondar. Nenhum dos 4 tinha `line-height` explícito no Pencil; escolhido por consistência com a família de peso/tamanho mais próxima do catálogo (mesmo critério do Home/Agenda), sinalizado aqui em vez de forjar precisão que a fonte não declarou:

| Classe | Tamanho/Peso/Altura | Uso |
| --- | --- | --- |
| `text-caption-md` | 0.8125rem / 400 / 1.4 | Subtitle ("As perguntas que o bot vai enviar no WhatsApp") |
| `text-caption-lg` | 0.84375rem / 400 / 1.4 | Prefixo "R$" do campo de preço |
| `text-caption-xs` | 0.71875rem / 400 / 1.4 | Nota do Price Head ("Opcional. Cobrado sempre...") |
| `text-label-strong-lg` | 0.78125rem / 700 / 1.3 | Label do botão "Editar nome" |

### Reusados
`--primary`, `--primary-soft`, `--surface`, `--background` (`$bg`), `--foreground` (`$text-primary`), `--muted-foreground` (`$text-secondary`), `--card` (`$white`) — nenhum valor novo, todos já existem do Home/Agenda. `GetVariables()` do Pencil devolveu só cores já mapeadas 1:1 no catálogo atual (`primary`, `primary-soft`, `bg`, `surface`, `text-primary`, `text-secondary`, `success(-bg)`, `warning(-bg)`, `error(-bg)`, `white`, `font-display`, `font-ui`) — nada novo veio daí; os 2 tokens novos (`border-subtle`, `border-strong`) são valores lidos direto nos nós, sem variável nomeada no arquivo Pencil.

Text-styles reusados (match exato size/peso):
- `text-heading-sm` (15px/700) → nome do serviço ("Dia de Spa Relax")
- `text-item-title` (14px/700) → título do Price Head ("Valor base do atendimento"), título de cada Field, glifo de cada badge (`◉`/`✓`/`Aa`/`#`), label "+ Adicionar pergunta"
- `text-paragraph` (14px/400) → valor do preço ("10")
- `text-label` (12px/400) → meta de cada Field ("Escolha única · Obrigatória" etc.)

## Ícones
Nenhum ícone extraído. Os símbolos `◉`, `✓`, `Aa`, `#` dos badges de pergunta são `content` de nodes `type: "text"` (ver Decisão 7) — texto literal, não SVG. Confirmado por busca de `type: "icon"` e `fill.type: "image"` em toda a subárvore de `E5dfj`: nenhum resultado.
- Total extraído: 0

## Imagens
Nenhuma — não há `fill.type: "image"` em nenhum node de `E5dfj`.

## Componentes do kit reusados
- `@components/ui/card` → candidato para o container branco (`bg-card`, `rounded-2xl`) do Name Row, Price Card e de cada Field
- `@components/ui/item` (`Item` + `ItemMedia` variant `icon` + `ItemContent` + `ItemTitle` + `ItemDescription`) → candidato forte para a estrutura de cada Field (badge quadrado 34×34 + título + meta) — anatomia do kit já cobre exatamente esse padrão
- `@components/ui/button` → "Editar nome" (pill, `bg-primary-soft`/`text-primary`) e "+ Adicionar pergunta" (outline, `border-strong`)
- `@components/ui/input` ou `@components/ui/number-field` → campo de preço (`R$` + valor numérico) — `section-builder` decide qual se encaixa melhor no comportamento (preço é sempre numérico)

Decisão final de qual primitiva usar em cada caso é do `section-builder` (Fase 2); aqui só ficam os candidatos com maior aderência estrutural ao design.

## Componentes do projeto reusados
- `@components/shared/nav-bar` → via `src/layouts/AppLayout.vue`, nenhuma mudança necessária

## Componentes compartilhados — specs
Nenhuma. Ver `## Estruturas inline-only` — nada nesta página atinge o critério de extração da R6/Passo 7 (2 consumidores reais, ou 2+ usos cross-página).

## Estruturas inline-only

### NameRow
- usos_contados: 1
- inline_na_secao: ServiceHeader
- motivo: "Aparece só nesta página, 1 instância. Mantido inline conforme R6."
- recomendacao: inline-na-secao
- node_id: "h21cJU"
- screenshot: docs/pencil/modelo-atendimento-name-row.webp
- tokens_usados: bg-card, text-heading-sm, bg-primary-soft, text-label-strong-lg

### PriceCard
- usos_contados: 1
- inline_na_secao: ServiceHeader
- motivo: "Aparece só nesta página, 1 instância. Mantido inline conforme R6."
- recomendacao: inline-na-secao
- node_id: "uyfS7"
- screenshot: docs/pencil/modelo-atendimento-price-card.webp
- tokens_usados: bg-card, text-item-title, text-caption-xs, border-subtle, text-caption-lg, text-paragraph

### QuestionField
- usos_contados: 4 (todos dentro da mesma seção — Field 1 a Field 4)
- inline_na_secao: QuestionsList
- motivo: "4 usos, mas todos dentro da MESMA seção — repetição resolve com v-for sobre array de dados (data:servico), não com componente novo (R6)."
- recomendacao: v-for
- node_id: "Q0RylO, Vv8Mk, iYRuL, cihnO"
- screenshot: docs/pencil/modelo-atendimento-fields.webp
- tokens_usados: bg-card, bg-primary-soft, text-item-title (badge + título), text-label (meta)

## Plano de dados

Domínio novo — nenhum arquivo em `src/data/` cobre serviço/perguntas do bot (checado: `agendamentos.ts`, `business.ts`, `home.ts`, e os manifests `docs/build-manifest-agenda.md`/`docs/build-manifest-home.md` — nenhum propõe esse domínio).

### Dados propostos
```yaml
dados_propostos:
  - arquivo: src/data/servico.ts
    acao: criar
    consumido_por: [ServiceHeader, QuestionsList]
    exports:
      - service: Service
      - serviceQuestions: ServiceQuestion[]
    tipos:
      - "Service { name: string, price: number }"
      - "ServiceQuestion { id: string, icon: string, title: string, typeLabel: string, required: boolean }"
```

`ServiceQuestion.icon` guarda o glifo literal (`◉`/`✓`/`Aa`/`#`) lido do design — texto, não referência a componente de ícone (ver Decisão 7). `typeLabel` + `required` compõem a meta exibida ("Escolha única · Obrigatória" = `typeLabel + ' · ' + (required ? 'Obrigatória' : 'Opcional')`).

- local em ServiceHeader: estado local (`ref`) só se o `section-builder` decidir tornar "Editar nome" um campo editável de fato — sem modal de referência (Decisão 5/6), o padrão mínimo é renderizar os dados de `service` estaticamente.

## Inventário de seções

| # | Nome | node-id | Arquivo | Reusa | Dados | Paralelizável | Screenshot | Formato |
|---|------|---------|---------|-------|-------|---------------|------------|---------|
| 1 | ServiceHeader | qrkb5, h21cJU, uyfS7 | src/views/modelo-atendimento/ServiceHeader.vue | ui/card, ui/button, ui/input (candidatos) | literal (subtitle) + data:servico (`service`) | sim | docs/pencil/modelo-atendimento-subtitle.webp, modelo-atendimento-name-row.webp, modelo-atendimento-price-card.webp | webp |
| 2 | QuestionsList | YX8qT, X4jOrF | src/views/modelo-atendimento/QuestionsList.vue | ui/card, ui/item (candidato), ui/button | literal (label do botão) + data:servico (`serviceQuestions`) | sim | docs/pencil/modelo-atendimento-fields.webp, modelo-atendimento-add-field-btn.webp | webp |

Fora do inventário (chrome compartilhado, sem mudança):
| Nome | node-id | Arquivo | Reusa | Dados |
|------|---------|---------|-------|-------|
| NavBar (via layout) | dLHIu (instância nesta tela) | src/layouts/AppLayout.vue | NavBar (shared, já implementado) | route.meta.title = 'Modelo de atendimento' (literal) |

## Plano de execução (Fase 2)
1. Sem Batch 0 — nenhum componente compartilhado novo nesta página.
2. Batch paralelo (máx 3): ServiceHeader, QuestionsList
3. `bun check` + `bun run build` uma única vez no fim

## Critério de aceite por seção
- Fiel ao screenshot da seção
- Zero valor arbitrário em cor, tipografia e espaçamento; dimensão só quando vem do design (R1, R2)
- Componente com pasta, index.ts, prop `class`, `cn(..., props.class)`, `data-slot` e `<slot />`, se algum vier a ser extraído (R5) — não é o caso previsto aqui (ver Estruturas inline-only)
- Ícone/glifo tratado como texto literal, não inventar SVG (R10, Decisão 7)
- Base mobile 375px, sem `max-*` (override do R12, ver Decisão 1 e [[mobile-first-override]])
- Tag semântica correta, `<h1>` único na página (provavelmente no `ServiceHeader`, nome do serviço), `RouterLink` na navegação interna (R13)
- Botões "Editar nome" / "+ Adicionar pergunta" fiéis visualmente, sem side-effect inventado (Decisão 6)

## Stubs criados
- src/pages/ModeloAtendimento.vue
- src/views/modelo-atendimento/
- rota em src/routers/ (`/modelo-atendimento`, lazy, `meta.title: 'Modelo de atendimento'`)

## Status

### Componentes (Batch 0)
- Nenhum

### Seções (Batches 1-N)
- [x] ServiceHeader
- [x] QuestionsList
- [x] bun check + bun run build
- [x] review

## Auditoria

- [x] Tokens de cor novos existem nos três lugares de index.css (:root, .dark [comentário de pendência], @theme inline)
- [x] Text-styles novos existem em index.css E em TEXT_STYLES de src/libs/utils.ts (contagem `@utility text-` = 27 = contagem de entradas do array = 27)
- [x] Ícones: nenhum no design (glifos são texto) — nada a extrair
- [x] Imagens: nenhuma no design — nada a baixar
- [x] Overview capturado (docs/pencil/modelo-atendimento-overview.webp)
- [x] Cada seção do inventário tem screenshot (5 arquivos webp, 375×754 total, bem abaixo de 1000px)
- [x] Nenhuma spec de componente compartilhado nesta página (nada atingiu o critério de extração) — N/A
- [x] Nenhum componente com spec_confidence baixa — N/A (sem specs)
- [x] Kit `ui/` consultado antes de qualquer proposta de componente (card, item, button, input listados)
- [x] Cada seção tem fonte de dados declarada (`literal` | `data:servico` | inline)
- [x] Toda seção com dado estático aponta para `src/data/servico.ts` (novo, domínio checado via Glob + manifests anteriores — sem match)
- [x] Stubs criados e rota registrada
