# Build Handoff — modelo-atendimento

> Gerado por /build-page em 2026-09-23
> Manifesto: `docs/build-manifest-modelo-atendimento.md`

## 1. Dados (Passo 1)

| Arquivo | Tipo | Status | Nota |
| --- | --- | --- | --- |
| `src/data/servico.ts` | dado estático | criado | camada dinâmica pendente (skill futura) |

## 2. Componentes shared (Batch 0)

Nenhum — o manifesto não propôs componente compartilhado novo para esta página (ver `## Componentes compartilhados — specs` = vazio).

## 3. Seções (Batches 1-N)

| Seção | Status | Assets faltantes | Desvios do manifesto | Evolução de componente pedida | Bloqueios | Notas |
| --- | --- | --- | --- | --- | --- | --- |
| ServiceHeader | ok | — | Subtitle (`qrkb5`) movido pra esta seção em correção pós-dispatch (ver §6) | — | — | `<h1>` da página é `service.name`; preço é `ref` local iniciado em `service.price` |
| QuestionsList | ok | — | Subtitle removido desta seção em correção pós-dispatch (ver §6) | — | — | Perguntas via `v-for` sobre `serviceQuestions` (R6 — 4 usos na mesma seção, sem componente novo); glifos (`◉ ✓ Aa #`) são texto literal com `aria-hidden` |

Ambas paralelizáveis, batch único, sem seção serial (NavBar via layout, fora do inventário).

## 4. Code review

**Veredicto do subagente `review`: aprovado com ressalvas — 0 BLOCKER, 1 MAJOR, 5 MINOR, 4 INFO.**

| Severidade | Item | Status |
| --- | --- | --- |
| MAJOR | [M1] Input de preço sem `step="0.01"` — `type="number"` default `step=1` rejeita centavos, `inputmode="decimal"` convida a digitar o que o campo rejeita | **corrigido** (adicionado `step="0.01"` em `ServiceHeader.vue`) |
| MINOR | [m4] `organizeImports` do Biome falhando em `ModeloAtendimento.vue` (import fora de ordem alfabética) | **corrigido** (reordenado import) |
| MINOR | [m1] `aria-labelledby="service-name"` na `<section>` de ServiceHeader nomeia a região só pelo nome do serviço, mas ela também contém o card de preço | aberto — decisão de a11y, ver backlog |
| MINOR | [m2] IDs fixos (`service-name`, `service-price-title`, `service-price-note`, `questions-list-title`) quebram se a view montar 2x (relevante quando os modais pendentes reaproveitarem o markup) | aberto — trocar por `useId()` quando os modais entrarem em escopo |
| MINOR | [m3] `Button variant="outline"` em "+ Adicionar pergunta": hover do kit (`hover:bg-muted hover:text-foreground`) não foi sobrescrito, só o estado base (`bg-transparent`/`text-primary`) | aberto — decisão visual, ver backlog |
| MINOR | [m5] Botões "Editar nome" / "+ Adicionar pergunta" focáveis e anunciados como acionáveis sem fazer nada (aceito pela Decisão 6, mas custo de a11y real) | aberto — considerar `aria-disabled="true"` até os modais existirem |
| INFO | Hierarquia de headings, `aria-hidden` nos glifos, registro dos text-styles novos, `md:text-paragraph` no Input — tudo conferido, sem ação necessária | — |
| INFO | Nomenclatura mista PT/EN entre arquivos de `src/data/` (`servico.ts`/`agendamentos.ts` vs `business.ts`/`home.ts`) | aberto — decisão de convenção, ver backlog |

## 5. `bun check` / `bun run build`

- `bun run build` (`vue-tsc -b && vite build`): **limpo**, 0 erros de tipo, bundle gerado (`ModeloAtendimento-*.js`, 7.06 kB gzip 2.57 kB).
- `bun check` (Biome): **767 erros pré-existentes**, nenhum introduzido por esta página além do `organizeImports` (já corrigido). Os 767 são a divergência documentada em R14 (`biome.json` configurado com `tab`/aspas duplas, repo escrito em `space`/aspas simples) — afeta o repo inteiro (inclusive `Agenda.vue`, `vite.config.ts`, arquivos de `.claude/` e `.obsidian/`), não é regressão desta rodada.

## 6. Intervenções do orquestrador (honestidade)

1. **Correção de agrupamento de seção (antes do build):** o manifesto original (Fase 1) colocou o node `qrkb5` ("Subtitle") dentro de `QuestionsList`. Os dois `section-builder` reportaram, independentemente, que no screenshot ele aparece ANTES do Name Row/Price Card — ou seja, é o primeiro elemento da página, não faz parte do bloco de perguntas. Movi `qrkb5` para `ServiceHeader` no manifesto (Decisão 9) e re-despachei os 2 `section-builder` em modo correção (1 ciclo cada) para mover o `<p>` de um arquivo pro outro. Ambos retornaram `ok`.
2. **Incidente de formatação (`biome --write` acidental):** ao tentar corrigir 1 erro de lint (`organizeImports`) com `npx biome check --write` nos 5 arquivos tocados, o comando reformatou TODOS pro estilo configurado em `biome.json` (tabs, aspas duplas, `;`) — que diverge do estilo real do resto do repo (2 espaços, aspas simples, sem `;`, conforme R14). Isso incluiu `src/routers/index.ts`, que já existia antes desta rodada. Revertido via `git checkout` (routers/index.ts) e reescrita manual (demais arquivos) pro estilo correto, reaplicando as mudanças de conteúdo por cima. Nenhum arquivo ficou no estado incorreto na entrega final — mas é o tipo de erro que se repete enquanto o `biome.json` não for ajustado (ver backlog P1).
3. **Fixes pós-review aplicados diretamente pelo orquestrador (não por subagente):** `step="0.01"` no Input de preço e reordenação de import em `ModeloAtendimento.vue`. Ambos triviais, mecânicos, sem ambiguidade de design — optei por aplicar direto em vez de reabrir um ciclo de subagente para 1 linha cada.

## 7. Análise e backlog priorizado

**Causas raiz:**
- O manifesto da Fase 1 (`/build-prep`) não verificou a ordem visual exata do subtítulo contra o overview antes de decidir o agrupamento de seções — presumiu que "texto sobre perguntas" pertence à seção de perguntas, mas o design o posiciona no topo da página. Os dois section-builders pegaram isso de forma independente e consistente, o que valida o processo de dupla verificação, mas o ideal é o build-prep confirmar ordem com o screenshot ANTES de gerar o inventário.
- `biome.json` desalinhado do padrão real do repo (R14, "ajuste pendente") continua sendo uma fonte de risco: qualquer `--write` automatizado (por mim ou por uma ferramenta) reformata pro padrão errado. Isso já era conhecido antes desta rodada, mas esta foi a primeira vez que bateu de fato durante um `/build-page`.

**Backlog:**

| Prioridade | Item | Ação sugerida |
| --- | --- | --- |
| P0 | — | Nenhum P0 — build e types limpos, sem blocker de review |
| P1 | `biome.json` com `indentStyle: tab` / `quoteStyle: double`, divergindo do padrão real do repo | Ajustar `biome.json` para `space`/`indentWidth: 2`/`single` (já documentado como pendência em R14) — decisão técnica, não muda comportamento do app |
| P1 | [m1] `aria-labelledby` da section de ServiceHeader nomeia a região só pelo nome do serviço | Decisão técnica de a11y — remover `aria-labelledby` da `<section>` (o `<h1>` já basta) ou trocar por um label mais abrangente |
| P2 | [m2] IDs fixos (`service-name`, `service-price-title`, etc.) | Trocar por `useId()` — só relevante quando os modais pendentes (Decisão 5) reaproveitarem este markup e a view puder montar 2x |
| P2 | [m3] Hover do Button "+ Adicionar pergunta" não sobrescreve `hover:bg-muted`/`hover:text-foreground` do kit | Decisão visual — humano decide se o hover atual é aceitável ou se precisa `hover:text-primary hover:bg-primary-soft/40` |
| P2 | [m5] Botões "Editar nome"/"+ Adicionar pergunta" focáveis sem ação | Considerar `aria-disabled="true"` até os 6 modais pendentes (Decisão 5) entrarem em escopo — decisão de produto/a11y |
| P2 | Nomenclatura mista PT/EN em `src/data/*.ts` | Decisão de convenção do projeto (`servico.ts` vs. um padrão único) — vale bater antes da próxima página |
| P2 | Modais pendentes: "Nova Pergunta" (4 variantes), "Editar Pergunta", "Excluir Pergunta" | Rodar `/build-prep` dedicado a esses 6 nodes (H5XmZp, xOfgO, slvWh, hclJG, Qdac5, CWmUo) quando o usuário quiser dar ação real aos botões |

O que é decisão humana (copy, regra de negócio, prioridade dos modais) está separado do que é técnico (a11y, `biome.json`) na tabela acima.

## 8. PROMPT COPIÁVEL

```
Quero resolver as pendências do build de modelo-atendimento:

1. Ajustar .claude/RULES.md R14 + biome.json: trocar formatter.indentStyle de "tab" pra "space" (indentWidth: 2) e javascript.formatter.quoteStyle de "double" pra "single", pra bun check parar de reportar os ~767 erros de formatação pré-existentes.
2. Em src/views/modelo-atendimento/ServiceHeader.vue: remover ou ajustar o aria-labelledby="service-name" da <section> (ela também contém o price card, não só o nome).
3. Decidir se o hover de "+ Adicionar pergunta" (src/views/modelo-atendimento/QuestionsList.vue) deve ficar como está (herda hover:bg-muted/hover:text-foreground do kit) ou ganhar hover:text-primary hover:bg-primary-soft/40 explícito.
4. Decidir se "Editar nome" e "+ Adicionar pergunta" (sem ação real ainda) devem ganhar aria-disabled="true" até os modais existirem.
5. Quando quiser dar ação real aos botões: rodar /build-prep pra reconhecer os 6 modais pendentes (Nova Pergunta × 4 variantes, Editar Pergunta, Excluir Pergunta — node-ids H5XmZp, xOfgO, slvWh, hclJG, Qdac5, CWmUo, irmãos de E5dfj no Pencil).
```
