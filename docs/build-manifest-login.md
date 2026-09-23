# Build Manifest — Login

> Gerado por /build-prep em 2026-09-23
> Fonte: pencil — node kBseT ("1 · Login"), arquivo `template/design.pen`
> Para implementar: `/build-page login`

## Identificação
- page: login
- página: src/pages/Login.vue
- seções: src/views/login/
- rota: /login

## Decisões de arquitetura (específicas deste produto, fora do RULES.md genérico)

1. **Mobile-first, não desktop-first.** Mesma decisão registrada no manifesto do Home: as telas do Pencil têm 375px fixos, sem artboard desktop. Código sai mobile-first, sem `max-*` do R12.
2. **Status Bar excluída da implementação.** Mesmo frame reusável mockup de chrome iOS já excluído nas páginas anteriores. Não entra no inventário.
3. **Fora do `AppLayout`.** Login é pré-autenticação: não usa `NavBar`/`AvatarMenu`/`NavMenu`. Registrada como rota top-level (`/login`), irmã da rota `/` que usa `AppLayout`, não como filha dela — confirmado com o usuário no gate do Passo 4.
4. **Dark mode pendente.** Mesma decisão do Home: nenhum valor de tema escuro no Pencil. Os 2 tokens de texto novos desta página (`text-mark`, `text-tag-sm`) não têm cor embutida — a cor vem sempre de um token de cor separado (`text-foreground`, `text-primary`, etc.), já resolvido em `.dark`. Nenhum token de cor novo nesta página.
5. **"Continuar com Google" sem serviço real.** O projeto não tem camada de auth (service/store) ainda — R8 não cobre isso, e não é conteúdo de `src/data/`. O botão e o formulário nascem como UI/validação client-side apenas; a ação de submit fica com um handler local placeholder até a skill de dados dinâmicos existir.
6. **Ícone do Google mantido com cores literais.** As 4 paths (`#4285F4`, `#34A853`, `#FBBC05`, `#EA4335`) são a marca oficial do Google — vieram como vetor nativo do Pencil (`type: "path"`, não ícone de fonte/imagem), copiadas literalmente. R10 pede `fill="currentColor"` para ícone de marca, mas isso vale para marcas monocromáticas que herdam a cor do texto; uma marca multicolor teria a identidade quebrada com `currentColor`. Mantido com os 4 `fill` explícitos, documentado como exceção.

## Frame raiz
- node-id: kBseT ("1 · Login")
- Screenshot: docs/pencil/login-overview.webp (375×647, mobile)

## Tokens

### Adicionados (`src/assets/index.css` + `TEXT_STYLES` em `src/libs/utils.ts`)

Nenhum token de cor novo — os 6 usados na tela já existiam no catálogo (ver Reusados). Apenas 2 text-styles novos, sem equivalente exato no catálogo:

| Classe | Tamanho/Peso/Altura | Uso |
| --- | --- | --- |
| `text-mark` | 1.375rem (22px) / 700 / 1.2 | Iniciais "SB" no Logo Badge |
| `text-tag-sm` | 0.78125rem (12.5px) / 700 / 1.2 | Link "Esqueci minha senha" |

Ambos já registrados em `index.css` (`@utility`) e em `TEXT_STYLES` (`src/libs/utils.ts`).

### Reusados

Cores — todas as 6 cores do node já existiam no catálogo (nenhuma nova):

| Token reusado | Valor | Uso no Login |
| --- | --- | --- |
| `bg-primary` / `text-primary` | `#7A4B5C` | Logo Badge, botão Entrar, link "Esqueci minha senha", link "Criar conta" |
| `text-primary-foreground` | `#FFFFFF` | Texto sobre `bg-primary` (iniciais "SB", label "Entrar") |
| `bg-card` | `#FFFFFF` | Fundo do botão Google e dos campos (Pencil usa `$white` — mapeado para `card`, já branco no tema) |
| `text-foreground` | `#2B2225` | Título, label "Continuar com Google" |
| `text-muted-foreground` | `#8B7B7D` | Subtítulo, placeholders dos campos, "Não tem conta?" |
| `text-muted-foreground-soft` | `#B5A7A2` | "ou" (divisor) |
| `border-border-subtle` | `#E5DAD5` | Borda do botão Google, borda dos campos, linhas do divisor |

Text-styles reusados (CSS idêntico ao que o design pede, sem aproximação):

| Classe | Uso |
| --- | --- |
| `font-heading text-metric` | Título "Bem-vindo de volta" (1.5rem/400/1.2 — idêntico ao 24px/400 do design; reusa `text-metric` em vez de criar 3º nome pro mesmo CSS, ver R2) |
| `text-caption-lg` | Subtítulo "Entre para gerenciar seus agendamentos" (0.84375rem/400 = 13.5px exato) |
| `text-button-strong` | Label "Continuar com Google" e "Entrar" (0.90625rem/700 = 14.5px exato) |
| `text-label` | "ou" (0.75rem/400 = 12px exato) |
| `text-caption-md` | "Não tem conta?" (0.8125rem/400 = 13px exato) |
| `text-tag` | "Criar conta" (0.8125rem/700 = 13px exato) |
| — | Placeholders dos campos ("E-mail ou usuário", "Senha") não precisam de text-style próprio — usar a tipografia default do `@components/ui/input`, cor já vem de `placeholder:text-muted-foreground` embutido no componente |

## Ícones
- Local: `src/assets/icons/{page}/` — nenhum arquivo SVG extraído (o único ícone da tela é vetor nativo do Pencil, copiado direto como paths)
- Total: 1
- Google (4 paths, marca oficial) → `src/components/icons/IconGoogle.vue` — usado em: LoginForm (botão "Continuar com Google")

## Imagens
Nenhuma — não há image-fill em nenhum node do Login.

## Componentes do kit reusados
- `@components/ui/button` → botão "Continuar com Google" e botão "Entrar" (customização de largura/borda/raio via `class`, sem novo componente — só 1 uso de cada até a tela de Cadastro existir)
- `@components/ui/input` → campos "E-mail ou usuário" e "Senha" (radius do design é 12px; o `Input` do kit nasce `rounded-none` — override via `class="rounded-[12px]"` na instância, sem editar o arquivo-fonte)
- `@components/ui/form` (+ `vee-validate` + `zod`) → estrutura do formulário, conforme R13. Schema mínimo: `identifier` (string, obrigatório — aceita e-mail ou usuário) e `password` (string, obrigatório)
- `@components/ui/separator` → as duas linhas do "Divider Row" ao redor do "ou" (troca as duas `rectangle` do Pencil por `Separator` horizontal, mesma função)

**Não existe no kit:** nada faltando — todas as peças têm match direto.

## Componentes do projeto reusados
Nenhum — Login não usa `NavBar`/`AvatarMenu` (fora do `AppLayout`, ver Decisão 3).

## Componentes compartilhados — specs
Nenhuma proposta. Google Button e Enter Button têm `usos_contados: 1` cada (só aparecem em Login); ficam inline na seção via `@components/ui/button`, conforme R6. Quando a tela "1b · Cadastro" for construída e repetir o botão Google, reavaliar extração de um `GoogleButton` (2º consumidor).

## Estruturas inline-only

### GoogleButton
- usos_contados: 1
- inline_na_secao: LoginForm
- motivo: "Só aparece no Login por enquanto. Tela de Cadastro (node oVxhA) repete o padrão mas ainda não foi construída — reavaliar extração quando ela existir (regra dos 2 usos, R6)."
- node_id: "wQCSC"
- tokens_usados: bg-card, border-border-subtle, text-foreground, text-button-strong

## Plano de dados

Nenhum dado estático para `src/data/`. Todo o conteúdo da tela é `literal` (títulos, labels, placeholders, microcopy) ou `estado-local` (valores dos campos, gerenciados pelo `vee-validate`). Sem service/store de auth nesta fase (Decisão 5).

## Inventário de seções

| # | Nome | node-id | Arquivo | Reusa | Dados | Paralelizável | Screenshot | Formato |
|---|------|---------|---------|-------|-------|---------------|------------|---------|
| 1 | LoginForm | wJOt6 | src/views/login/LoginForm.vue | ui/button, ui/input, ui/form, ui/separator, IconGoogle | literal + estado-local | não (seção única) | docs/pencil/login-form.webp | webp |

## Plano de execução (Fase 2)
1. Batch 0: nenhum componente compartilhado a criar (nenhuma spec proposta)
2. Serial único: LoginForm (seção única, sem paralelismo a ganhar)

## Critério de aceite por seção
- Fiel ao screenshot docs/pencil/login-form.webp (e overview docs/pencil/login-overview.webp para o conjunto com Status Bar, que não entra no código)
- Zero valor arbitrário em cor e tipografia; `rounded-[12px]` nos campos é a única dimensão arbitrária, justificada (raio do design sem token equivalente)
- Formulário com `vee-validate` + `zod` via `@components/ui/form`, label/erro associados por `FormItem` (R13)
- `IconGoogle.vue` com `aria-hidden="true"` (decorativo, o texto "Continuar com Google" já descreve a ação)
- Botão "Entrar" do tipo `submit`; links "Esqueci minha senha" e "Criar conta" como `RouterLink` (mesmo que as rotas de destino ainda não existam — usar `to="#"` com TODO até as telas de recuperação/cadastro serem construídas, nunca `<a href="#">` nem `<div @click>`)
- Mobile-first (sem `max-*`), 375px de referência

## Stubs criados
- src/pages/Login.vue
- src/views/login/ (pasta vazia)
- rota `/login` em src/routers/index.ts (top-level, fora do `AppLayout`)

## Status

### Componentes (Batch 0)
- (nenhum)

### Seções (Batches 1-N)
- [x] LoginForm
- [x] bun check + bun run build (build ok; `bun check` falha por divergência pré-existente do biome.json, ver handoff)
- [x] review (0 blockers, 2 majors corrigidos, 4 minors no handoff)
