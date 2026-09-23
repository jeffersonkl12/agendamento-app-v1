# Build Handoff — Cadastro

> Página: `cadastro` · Gerado em 2026-09-23 · Manifesto: `docs/build-manifest-cadastro.md`

## Dados (Passo 1)

| Arquivo | Tipo | Status | Nota |
| --- | --- | --- | --- |
| — | — | pulado | Manifesto não propõe `src/data/`; todo conteúdo é `literal` ou `estado-local` (vee-validate) |

## Components (Batch 0)

| Componente | Status | mode_efetivo | Props | Desvios da spec | Bloqueios |
| --- | --- | --- | --- | --- | --- |
| GoogleButton | ok | create | `class?: HTMLAttributes['class']`, `label: string` (obrigatório) | nenhum | nenhum |
| GoogleButton (fix pós-review) | ok | update | `class?: HTMLAttributes['class']` (prop `label` removida) | Troca `label` prop → `<slot />`, pedida pelo code review (R5) | nenhum |

## Sections (Batches 1-N)

| Seção | Status | Assets faltantes | Desvios do manifesto | Evolução pedida | Bloqueios | Notas |
| --- | --- | --- | --- | --- | --- | --- |
| CadastroForm | ok | nenhum | Borda de erro (`aria-invalid:border-error`) aplicada aos 4 campos via `FIELD_CLASS` compartilhado (o manifesto só citava o campo "Confirmar senha"); cada campo só fica vermelho quando a própria validação falha, então o comportamento visual bate com o design | nenhuma | nenhum | Fiel ao screenshot 2x; handlers `onSubmit`/`onGoogleSignIn` placeholders (Decisão 5) |
| CadastroForm (fix pós-review) | ok | — | Ajustado consumo do GoogleButton de prop `label` para slot | — | nenhum | 1 linha alterada |
| LoginForm (fix pós-review, fora do inventário desta página) | ok | — | Migrado para `GoogleButton`; link "Criar conta" corrigido de `/TODO` para `/cadastro` | — | nenhum | Ver "Intervenções do orquestrador" abaixo |

## Code review

**Veredicto inicial:** MUDANÇAS NECESSÁRIAS — 0 BLOCKERS, 3 MAJOR, todos corrigidos nesta execução.

| # | Severidade | Achado | Status |
| --- | --- | --- | --- |
| M1 | MAJOR | `LoginForm.vue` mantinha o botão Google inline em vez de consumir o `GoogleButton` recém-extraído (violação de R6 — extração só se justifica com 2 consumidores reais) | ✅ Corrigido |
| M2 | MAJOR | `GoogleButton` recebia o texto via prop `label` em vez de `<slot />` (R5, anatomia item 6) | ✅ Corrigido |
| M3 | MAJOR | `LoginForm.vue` apontava "Criar conta" para `/TODO` mesmo com `/cadastro` já registrada | ✅ Corrigido |

**Pontos levantados no review, não corrigidos nesta execução (MINOR / a verificar):**

- Possível perda do anel de foco (`focus-visible:ring`) em campo inválido + focado, por causa de `aria-invalid:ring-0` no `FIELD_CLASS`. Precisa teste manual no browser (Tab até o campo "Confirmar senha" em estado de erro).
- Login e Cadastro estilizam erro de campo de forma diferente (Login não tem `aria-invalid:border-error`/mensagem de erro estilizada) — os dois formulários deveriam convergir, idealmente editando `@components/ui/input` / `@components/ui/form` direto em vez de repetir constantes por view.
- `FIELD_CLASS` duplicado entre `LoginForm.vue` e `CadastroForm.vue` — candidato a virar parte do próprio `Input`/`FormControl` do kit.
- `rounded-[12px]` (campos) convive com `rounded-xl` = 14px (botões) na mesma tela — candidato a token de radius dedicado.
- `font-heading text-metric` empilha família de fonte sobre o text-style (mesmo padrão do Login) — candidato a text-style próprio.
- Schema `password` aceita `min(1)` — política mínima de senha ainda não definida (Decisão do manifesto: "a definir").
- Logo "SB" (iniciais) não tem `aria-hidden`, leitor de tela pode ler "S B" antes do `<h1>`.

## Intervenções do orquestrador (honestidade)

Fora do escopo mecânico "1 seção / 1 componente por subagente", o orquestrador:

1. Registrou a rota `/cadastro` em `src/routers/index.ts` (Passo 9 do `/build-prep`, antes desta fase).
2. Despachou 2 `section-builder` extras **fora do inventário desta página** para aplicar as correções M1/M3 do code review em `src/views/login/LoginForm.vue` — arquivo de uma página já implementada anteriormente (`/build-page login`), não parte do inventário de `cadastro`. Decisão do usuário, explicitamente aprovada via pergunta antes de disparar.
3. Rodou `bun run build` duas vezes (Passo 5 padrão + 1 rodada extra pós-fix, dentro do limite de 2 tentativas) — ambas limpas.
4. Removeu `src/views/cadastro/.gitkeep` (artefato do stub do `/build-prep`, sem função após `CadastroForm.vue` existir).

Nenhuma edição em `src/assets/index.css`, `src/libs/utils.ts` ou ícone global.

**Observação sem ação:** `dist/` está sob controle de versão neste repositório (pré-existente) e mudou como efeito colateral de rodar `bun run build` para validação — fora do escopo desta página, não revertido nem investigado.

## Análise e sugestões de correção

### Causas raiz

- **Extração de componente sem migração do consumidor original** é o padrão que gerou 2 dos 3 MAJORs (M1 encontrado pelo review; M2 é anatomia do componente novo). O manifesto já sinalizava a extração (Decisão 6), mas o Batch 0 só cria o componente novo — migrar o consumidor antigo (`LoginForm.vue`) não está no escopo mecânico do `component-builder`/`section-builder` e exigiu decisão humana explícita nesta execução.
- **Estilo de erro de formulário não padronizado no kit** — cada view resolve o estado de erro (borda, cor, ring) por conta própria, gerando divergência entre Login e Cadastro e duplicação de `FIELD_CLASS`.

### Backlog priorizado

**P0 (bloqueia confiança de a11y):**
- [ ] Testar manualmente o foco no campo "Confirmar senha" em estado de erro (Tab) — confirmar se `aria-invalid:ring-0` remove o indicador visual de foco; se sim, trocar por `aria-invalid:ring-error/20`.

**P1 (consistência / dívida técnica):**
- [ ] Levar a estilização de erro (`aria-invalid:border-error`, `FormMessage` vermelho) para dentro de `@components/ui/input` / `@components/ui/form`, removendo a duplicação de `FIELD_CLASS` entre `LoginForm.vue` e `CadastroForm.vue`.
- [ ] Adicionar `aria-hidden="true"` no bloco do Logo Badge ("SB") em ambas as telas.
- [ ] Definir e aplicar uma política mínima de senha (hoje `min(1)` no schema zod do Cadastro) — decisão de produto, não técnica.

**P2 (polimento de design system):**
- [ ] Avaliar token de `radius` para substituir `rounded-[12px]` arbitrário nos campos (convive hoje com `rounded-xl` nos botões).
- [ ] Avaliar text-style próprio para `font-heading text-metric` (título das telas de auth), evitando empilhar família de fonte sobre o text-style.

**Decisão do humano (não técnica):**
- Copy/UX do erro "As senhas não coincidem." — hoje só aparece depois que todos os campos passam na validação base (comportamento padrão do `zod` v3 com `.refine` no objeto). Trocar para feedback imediato exigiria `superRefine` — avaliar se vale a complexidade.

## PROMPT COPIÁVEL

```
Pendências da página /cadastro (ver docs/build-handoff-cadastro.md):

1. [P0 - a11y] Testar manualmente o foco no campo "Confirmar senha" de
   src/views/cadastro/CadastroForm.vue em estado de erro (Tab até o campo).
   Se o anel de foco sumir por causa de `aria-invalid:ring-0` no FIELD_CLASS,
   trocar por `aria-invalid:ring-error/20`.

2. [P1] Unificar a estilização de erro de formulário (borda vermelha, FormMessage)
   entre src/views/login/LoginForm.vue e src/views/cadastro/CadastroForm.vue,
   idealmente movendo para dentro de src/components/ui/input/ e
   src/components/ui/form/ em vez de duplicar FIELD_CLASS em cada view.

3. [P1] Adicionar aria-hidden="true" no bloco do Logo Badge ("SB") em
   LoginForm.vue e CadastroForm.vue (decorativo, leitor de tela lê "S B" hoje).

4. [P1] Definir política mínima de senha (hoje password: z.string().min(1) em
   CadastroForm.vue) e aplicar no schema zod.

5. [P2] Avaliar token de radius para rounded-[12px] dos campos de formulário
   (Login + Cadastro), hoje arbitrário e inconsistente com rounded-xl dos botões.
```
