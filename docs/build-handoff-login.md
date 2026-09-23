# Build Handoff — Login

> Gerado por /build-page em 2026-09-23
> Manifesto: docs/build-manifest-login.md

## Dados (Passo 1)

Nenhum arquivo em `src/data/` — plano de dados do manifesto estava vazio (tela 100% `literal` + `estado-local`). Passo pulado, conforme esperado.

## Components (Batch 0)

Nenhum componente compartilhado proposto no manifesto (só `GoogleButton` inline-only, 1 uso). Batch 0 pulado.

## Sections (Batches 1-N)

| Seção | Status | Assets faltantes | Desvios do manifesto | Evolução de componente pedida | Bloqueios |
|---|---|---|---|---|---|
| LoginForm | ok | nenhum | 3 (ver abaixo) | nenhuma | nenhum |

**Desvios reportados pelo `section-builder`:**
1. Placeholders dos campos: o manifesto previa usar a tipografia default do `Input` do kit; na prática o `Input` vem com `text-xs`/`md:text-xs` embutido (12px), e o design pede 14px. Corrigido na instância com `text-paragraph md:text-paragraph`.
2. Bordas de 1.5px (botão Google e campos) viraram `border-[1.5px]` — arbitrário de dimensão, mesma categoria de exceção do `rounded-[12px]` já previsto no manifesto.
3. Altura dos campos: `h-11.25` (45px exato do Pencil, via spacing dinâmico do Tailwind v4 — `calc(var(--spacing) * 11.25)`) em vez de deixar a altura decorrer do padding vertical.

Nenhum é regressão — são ajustes de precisão em cima do que o manifesto já sinalizava como zona cinzenta (radius/border sem token).

## Code review

Rodado com `subagent_type: review`. Resultado: **0 BLOCKERS, 2 MAJOR, 4 MINOR**.

### MAJOR — corrigidos pelo orquestrador
- **M1** `/login` não tinha `<main>` (R13, landmark). Fica fora do `AppLayout` (que é o único lugar com `<main>` hoje). Corrigido: `src/pages/Login.vue` agora envolve `<LoginForm />` em `<main>`. *Não* criei `AuthLayout.vue` ainda — só 1 consumidor (Login) por enquanto; quando "1b · Cadastro" e recuperação de senha existirem (3 consumidores), reavaliar extração conforme R6.
- **M2** Links "Esqueci minha senha" e "Criar conta" usavam `RouterLink to="#"` — resolve pra rota atual com hash vazio, clique não faz nada visível. Corrigido: `to="/TODO"` nos dois, em `src/views/login/LoginForm.vue`. Cai em rota inexistente até as telas de recuperação/cadastro existirem (gera warning "No match found" no console, esperado).

### MINOR — não corrigidos, para decisão do usuário
- **m1** `rounded-[12px]` nos campos vs. `rounded-xl` (14px) nos botões — inconsistência de raio na mesma tela. Reflete o que o Pencil realmente define (confirmado na spec), mas fica sem token. Se o produto crescer com mais telas de raio "12px", vale promover a um `--radius-*` novo.
- **m2** `border-[1.5px]` repete 3x (2 campos + botão Google). Se o design usa 1.5px como padrão consistente (não só nesta tela), vale um utilitário/token em vez de arbitrário repetido.
- **m3** Placeholder faz o papel de label visível (rótulo só em `sr-only`) — quem enxerga perde a referência ao digitar (WCAG 3.3.2). Decisão de design a confirmar; troca fácil por label visível ou floating label se preciso.
- **m4** `IconGoogle.vue` ficou solto em `src/components/icons/`, sem pasta própria/`index.ts`/`data-slot` — R10 não detalha a estrutura pra ícones inline (ambiguidade da regra), e este é o primeiro ícone do projeto. Vale fixar a convenção agora.

## Intervenções do orquestrador (fora do escopo `.vue` de seção)

1. **Bug próprio corrigido:** `src/components/icons/IconGoogle.vue` (escrito por mim no `/build-prep`, não pelo subagente) tinha `defineProps<...>()` sem capturar o retorno e usava `:class="class"` no template — `class` é palavra reservada, quebrava o build com `TS1005`. Corrigido para `const props = defineProps...` + `:class="props.class"`.
2. **Fixes de review aplicados diretamente** (não redisparei o `section-builder` por serem correções de 1 linha, de baixo risco): M1 e M2 acima.
3. **`bun check` não foi corrigido.** Falha em 808 arquivos por divergência pré-existente entre `biome.json` (tabs + aspas duplas) e o padrão documentado no `RULES.md` (2 espaços + aspas simples) — o próprio `RULES.md` já marca isso como "Ajuste pendente" na seção R14. Confirmei que é pré-existente rodando `bunx biome check` em arquivos que não toquei (`src/pages/Home.vue`, `src/data/business.ts`) — falham do mesmo jeito. Não mexi em `biome.json` (config compartilhada, fora do escopo desta página).
4. **Validação visual manual feita:** subi `bun dev` (porta 5175, 5173/5174 já ocupadas por outro processo) e comparei `/login` renderizado contra `docs/pencil/login-overview.webp` via MCP do Pencil — fiel ao design (cores, tipografia, ícone, espaçamento). Parei o dev server ao final.

## Análise e sugestões de correção

**Causas raiz:**
- Nenhuma relacionada a asset faltante ou ícone fora do manifesto — extração no `/build-prep` cobriu 100% do necessário (0 ícones/imagens faltando).
- A única causa raiz real é a divergência de config do Biome, que é anterior a esta página e afeta o repo inteiro.

**Backlog priorizado:**

| Prioridade | Item | Ação sugerida |
|---|---|---|
| P0 | `bun check` falha em 808 arquivos (repo inteiro) | Decidir o padrão real (`biome.json` atual = tabs/aspas duplas vs. `RULES.md` documentado = espaços/aspas simples) e rodar `bun format` uma vez no repo inteiro. Decisão do usuário — está fora do escopo de uma página. |
| P1 | Rotas `/TODO` em "Esqueci minha senha" e "Criar conta" | Construir as telas de recuperação de senha e "1b · Cadastro" (Pencil já tem o node `oVxhA` pra Cadastro) — aí sim promover `GoogleButton` pra componente compartilhado (2º consumidor) e considerar `AuthLayout.vue` (3 consumidores: Login, Cadastro, Recuperação). |
| P2 | m1–m4 do review (radius, border, label visível, pasta do IconGoogle) | Decisão de produto/design, não bloqueiam entrega. |
| P2 | Botão "Entrar"/"Continuar com Google" sem feedback nenhum (decisão 5 do manifesto: sem camada de auth ainda) | Quando a skill de dados dinâmicos existir, plugar auth real. Até lá, opcional: toast do sonner avisando "indisponível no protótipo". |

**O que é decisão do humano vs. técnico:**
- Humano: se 1.5px de borda e 12px de raio são intencionais em todo o produto (vira token) ou só uma imprecisão pontual do Pencil; se o label deve ficar visível; padrão de formatação real do projeto (Biome).
- Técnico (posso resolver quando pedido): `AuthLayout.vue`, promoção do `GoogleButton`, wiring de auth quando a skill existir.

---

## PROMPT COPIÁVEL

```
Preciso resolver as pendências da página Login:

1. bun check está falhando em ~808 arquivos por divergência entre biome.json
   (tabs + aspas duplas) e o padrão documentado em .claude/RULES.md R14
   (2 espaços + aspas simples). Decida qual é o padrão real do projeto,
   ajuste biome.json se necessário, e rode `bun format` no repo inteiro.

2. Em src/views/login/LoginForm.vue, os links "Esqueci minha senha" e
   "Criar conta" apontam pra to="/TODO" — construir as telas de destino
   (recuperação de senha; Cadastro já tem node oVxhA no Pencil) e depois
   atualizar os RouterLink.

3. Quando a tela de Cadastro existir e repetir o botão "Continuar com
   Google", promover o GoogleButton (hoje inline em LoginForm.vue) pra
   um componente compartilhado em src/components/shared/google-button/,
   conforme R6 (2º consumidor). Nesse momento também avaliar criar
   src/layouts/AuthLayout.vue (Login + Cadastro + Recuperação = 3
   consumidores de <main> fora do AppLayout).

4. Minors do code review em docs/build-handoff-login.md (radius 12px vs
   14px inconsistente, border-[1.5px] repetido 3x, label do form só
   sr-only, IconGoogle.vue sem pasta/index.ts) — revisar e decidir se
   viram token/ajuste ou ficam como estão.
```
