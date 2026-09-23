# Build Handoff — configurar-agendamentos

> Gerado por `/build-page` em 2026-09-23
> Manifesto: `docs/build-manifest-configurar-agendamentos.md`

## Dados (Passo 1)

| arquivo | tipo | status | nota |
| --- | --- | --- | --- |
| `src/data/configuracao.ts` | dado estático | já existia | exports `weekDays`, `scheduleSettings` batem com o manifesto; camada dinâmica pendente (skill futura) |
| `src/data/servico.ts` | reuso | já existia | ServiceTemplate consome `service` + `serviceQuestions`; nenhuma extensão |

## Components (Batch 0)

| componente | status | mode_efetivo | props | desvios | bloqueios |
| --- | --- | --- | --- | --- | --- |
| — | pulado | — | — | manifesto: nenhuma spec compartilhada (kit cobre) | — |

## Seções (Batches 1-N)

| secao | status | assets_faltantes | desvios_do_manifesto | componentes_evolucao_pedida | bloqueios | notas |
| --- | --- | --- | --- | --- | --- | --- |
| Availability | ok | [] | [] | [] | [] | ToggleGroup multiple; activeDays local; dúvida sobre hover do chip ativo |
| ScheduleHours | ok | [] | [] | [] | [] | Card + Editar sem modal; TODO declarado (modal n15E3H) |
| ServiceTemplate | ok | [] | [] | [] | [] | Card + Escolher sem modal; TODO declarado (modal Qs7i2) |

## Code review

- BLOCKERS: 0
- MAJOR: 0
- MINOR (abertos): 4 — ver backlog P1 abaixo
- INFO: biome format global diverge do estilo do repo; mobile-first override só no manifesto

Review não bloqueia entrega. MINORs ficam para o humano decidir.

## Intervenções do orquestrador

- `src/pages/ConfigurarAgendamentos.vue` — composição das 3 seções + botão "Salvar configuração" (ui/button, Decisão 7)
- `src/routers/index.ts` — rota `/configurar-agendamentos` descomentada/ativada
- `docs/build-manifest-configurar-agendamentos.md` — checklist de seções marcado `[x]`
- `src/assets/index.css` / `src/libs/utils.ts` — text-styles `paragraph-strong` e `button-strong` já vinham do prep (não tocados nesta fase além do que o prep já tinha)

## Validação

| comando | resultado |
| --- | --- |
| `bun run build` (`vue-tsc -b` + `vite build`) | ✓ ok — chunk `ConfigurarAgendamentos-*.js` gerado |
| `bun check` (biome global) | ✗ pré-existente — 771 erros de format no repo inteiro (aspas/semicolons). Mesmo padrão em `Home.vue` / `servico.ts`. Não é regressão desta página |

## Causas raiz

1. **Modais fora do escopo do prep** — frames `n15E3H` e `Qs7i2` não entraram no inventário; botões ficam no-op por decisão explícita do manifesto.
2. **Persistência ainda estática** — `saveConfiguration` e estado dos dias não sobem para a page; correto até existir camada dinâmica.
3. **Biome vs estilo do projeto** — `biome.json` pede double quotes/semicolons; o código do produto usa single quotes sem `;` (R14 pendente).

## Backlog priorizado

### P0
- Nenhum.

### P1 (humano / próximo turno)
- [ ] a11y: `aria-describedby` em "Editar" / "Escolher" (review m1)
- [ ] a11y: área de toque dos text-buttons (review m2)
- [ ] Plural "pergunta(s)" em ServiceTemplate (review m3)
- [ ] `/build-prep` dos modais `n15E3H` e `Qs7i2` antes de ligar ações reais

### P2
- [ ] Padronizar TODOs dos handlers (review m4)
- [ ] Registrar override mobile-first no RULES.md (ou vault) para reviews futuros
- [ ] Alinhar `biome.json` ao estilo do projeto (R14)

## TODOs declarados (não são pendências HARD ocultas)

- `ScheduleHours.vue` — modal horário (`n15E3H`)
- `ServiceTemplate.vue` — modal escolher modelo (`Qs7i2`)
- `ConfigurarAgendamentos.vue` — persistir quando camada dinâmica existir

## PROMPT COPIÁVEL

```
Na página configurar-agendamentos, aplicar os MINORs do review (docs/build-handoff-configurar-agendamentos.md):

1. ScheduleHours.vue e ServiceTemplate.vue — aria-describedby nos botões "Editar"/"Escolher" apontando para o id do h2 da seção
2. Mesmos botões — aumentar hit area com py-2 -my-2 sem mudar o visual
3. ServiceTemplate.vue — plural correto: "pergunta" / "perguntas" conforme length
4. (opcional) Padronizar os // TODO dos handlers

Não inventar modais. Não plugar HTTP. Rodar bun run build ao final.
```
