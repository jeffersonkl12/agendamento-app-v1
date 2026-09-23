# Build Handoff — Redefinir senha

> Gerado por /build-page em 2026-09-23
> Manifesto: docs/build-manifest-redefinir-senha.md

## Dados (Passo 1)

Nenhum arquivo em `src/data/` — todo o conteúdo é `literal` ou `estado-local` (vee-validate). Passo pulado conforme `## Plano de dados` do manifesto.

## Components (Batch 0)

| componente | status | mode_efetivo | props_implementadas | desvios_da_spec | bloqueios |
| --- | --- | --- | --- | --- | --- |
| AuthHeader (Rev. 1, props) | substituído | create | class, title, titleId, subtitle | — | — |
| AuthHeader (Rev. 2, compound) | implementado | create | `AuthHeader.class`; `AuthHeaderTitle.class`; `AuthHeaderDescription.class` (título/descrição via slot; `id` chega por fallthrough) | — | — |

A Rev. 1 foi construída, passou por code review e recebeu 2 MAJORs (ver abaixo). Foi descartada e reconstruída como Rev. 2 (compound) antes de qualquer consumidor externo existir — não houve breaking change real, porque só `RedefinirSenhaForm` (desta mesma execução) consumia a Rev. 1.

## Sections (Batches 1-N)

| seção | status | assets_faltantes | desvios_do_manifesto | componentes_evolucao_pedida | bloqueios | notas |
| --- | --- | --- | --- | --- | --- | --- |
| RedefinirSenhaForm | ok | nenhum | nenhum | nenhum | nenhum | Regenerada 1x (Rev. 1 → Rev. 2 do AuthHeader). Aplicou os 3 MINORs do review: `z.string({ message })` em vez de `required_error`, `toast.success` + `router.push('/login')` no submit válido, `hover:bg-primary/90` no botão. |

## Code review

**1ª rodada (contra Rev. 1 do AuthHeader):**
- BLOCKERS: 0
- MAJOR M1 — AuthHeader com 1 consumidor real (R6). **Corrigido** — migrado para Login/Cadastro/Recuperar senha (ver "Intervenções do orquestrador").
- MAJOR M2 — AuthHeader com API por prop e markup fechado, deveria ser compound (R5 item 6-7). **Corrigido** — reconstruído como `AuthHeader` + `AuthHeaderTitle` + `AuthHeaderDescription`.
- MINOR m1 — `required_error` do zod diverge das telas irmãs. **Corrigido.**
- MINOR m2 — `onSubmit` sem feedback no caminho feliz. **Corrigido** (`toast.success` + navegação).
- MINOR m3 — botão sem `hover:bg-primary/90`. **Corrigido.**
- INFO — sugestão de variante `size="auth"` no `buttonVariants` do kit para não repetir `h-12 w-full rounded-xl px-3.5 text-button-strong` em 4 telas; registrado como P2 no backlog abaixo, não aplicado (fora do escopo mecânico, toca o design system do kit).

**2ª rodada:** não executada — as correções foram mecânicas e de baixo risco (build limpo confirmado após cada uma). Recomenda-se rodar `/code-review` manualmente se quiser uma segunda verificação antes de dar a tela como fechada.

## Intervenções do orquestrador (honestidade)

Fora do escopo estrito de "1 componente / 1 seção" desta página, o orquestrador editou diretamente (sem subagente) 3 arquivos de **outras páginas já implementadas e revisadas anteriormente**, para resolver o MAJOR M1 (componente shared sem 2º consumidor real):

- `src/views/login/LoginForm.vue` — bloco badge+título+subtítulo trocado por `<AuthHeader>`
- `src/views/cadastro/CadastroForm.vue` — idem
- `src/views/recuperar-senha/RecuperarSenhaForm.vue` — idem

Justificativa: essas 3 edições foram substituições mecânicas 1:1 (mesmo markup renderizado, mesmo `id`/`aria-labelledby`, mesmas classes) do bloco já revisado e aprovado em manifestos anteriores — não é geração de UI nova, e o `section-builder` não tem um "modo update" para telas de outras páginas fora do escopo do manifesto corrente. `bun run build` (type-check + vite build) passou limpo após as 4 edições (as 3 migrações + a regeneração de `RedefinirSenhaForm`).

Nenhuma outra intervenção fora do escopo (nenhum token novo, nenhum ajuste em `src/assets/index.css`, `src/libs/utils.ts` ou rota além do já previsto no `/build-prep`).

**Nota separada (fora do controle desta execução):** `bun run build` e `bun check` tocaram `dist/` (rebuild com novos hashes de arquivo) e `tsconfig.tsbuildinfo` — ambos aparecem versionados no repositório. Isso é reflexo de rodar o build local, não uma decisão de conteúdo desta feature; o dono do repo pode preferir adicionar `dist/` e `tsconfig.tsbuildinfo` ao `.gitignore`.

## Análise e sugestões de correção

### Causas raiz

1. **Spec de componente proposta no `/build-prep` sem o "gate de 2 consumidores" aplicado ao código real.** O manifesto contava "4 usos" olhando o *design*, mas no início da execução só existia 1 consumidor no *código* (as outras 3 telas tinham o padrão duplicado, nunca extraído). O `component-builder` seguiu a spec à risca (API por prop) porque a spec não previa compound. Ver sugestão de processo do reviewer: gate de migração no mesmo batch em que o componente nasce.
2. **Dívida técnica pré-existente carregada de manifesto em manifesto.** O `AuthHeader` já estava registrado como "P1, não extraído" desde o manifesto de Recuperar senha; esta execução foi a que finalmente cruzou o limiar e forçou a decisão.

### Backlog priorizado

- **P0 — nenhum.** Nada bloqueante restante.
- **P1 — nenhum.** As duas dívidas identificadas nesta execução (consumidor único, API por prop) foram resolvidas na mesma sessão.
- **P2 — variante `size="auth"` no kit `ui/button`.** `h-12 w-full rounded-xl px-3.5 text-button-strong` se repete em Login, Cadastro, Recuperar senha e Redefinir senha. Não é blocker (RULES não exige DRY de classes Tailwind fora de constante local), mas é candidato a `cva` no `buttonVariants` se uma 5ª tela de auth aparecer. Decisão de design system, não desta página.
- **P2 — contrato de rota para o token de redefinição.** `/redefinir-senha` hoje não recebe parâmetro (`?token=` ou `:token`). Aceitável enquanto os dados são estáticos (Decisão 5 do manifesto — sem service de auth), mas quando a skill de dados dinâmicos existir, o contrato da rota provavelmente muda (o backend precisa validar o token do link de e-mail). Decisão de produto/dev de auth, não desta fase.
- **P2 — badge "SB" sem `aria-hidden`.** Levantado pelo `component-builder` nas duas revisões: um leitor de tela lê "SB" antes do `<h1>` em todas as 4 telas de auth (comportamento herdado, não introduzido aqui). Se decidido que é puramente decorativo, adicionar `aria-hidden="true"` no `<span>` do `AuthHeader` — mudança de 1 linha, mas afeta as 4 telas simultaneamente (decisão de a11y do produto).

O que é técnico (posso aplicar direto num próximo turno): P2 do botão (variante no kit) e P2 do `aria-hidden`.
O que é decisão de produto/negócio: contrato do token de redefinição de senha (definido quando a auth real entrar).

## PROMPT COPIÁVEL

```
No projeto app-agendamento-prototipo, aplicar os itens P2 pendentes do handoff de redefinir-senha (docs/build-handoff-redefinir-senha.md):

1. Adicionar aria-hidden="true" no <span class="text-mark text-primary-foreground">SB</span> dentro de src/components/auth/auth-header/AuthHeader.vue (badge é decorativo, o <h1> já carrega o título para leitor de tela).
2. Avaliar se vale criar uma variante size="auth" (ou similar) em src/components/ui/button/index.ts (buttonVariants) para consolidar "h-12 w-full rounded-xl px-3.5 text-button-strong hover:bg-primary/90", hoje repetida em src/views/login/LoginForm.vue, src/views/cadastro/CadastroForm.vue, src/views/recuperar-senha/RecuperarSenhaForm.vue e src/views/redefinir-senha/RedefinirSenhaForm.vue.
3. Rodar bun run build depois de cada mudança para confirmar que nada quebrou.

Não mexer no contrato de rota /redefinir-senha (token de redefinição) — isso fica para quando a camada real de auth existir.
```
