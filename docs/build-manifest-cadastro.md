# Build Manifest — Cadastro

> Gerado por /build-prep em 2026-09-23
> Fonte: pencil — node oVxhA ("1b · Cadastro"), arquivo `design/pencil/design.pen`
> Para implementar: `/build-page cadastro`

## Identificação
- page: cadastro
- página: src/pages/Cadastro.vue
- seções: src/views/cadastro/
- rota: /cadastro

## Decisões de arquitetura (específicas deste produto, fora do RULES.md genérico)

1. **Mobile-first, não desktop-first.** Mesma decisão do Login/Home: tela do Pencil em 375px fixos, sem artboard desktop. Código sai mobile-first, sem `max-*` do R12. Ver [[mobile_first_override]].
2. **Status Bar excluída da implementação.** Mesmo frame reusável mockup de chrome iOS já excluído nas páginas anteriores. Não entra no inventário.
3. **Fora do `AppLayout`.** Cadastro é pré-autenticação, como Login: não usa `NavBar`/`AvatarMenu`/`NavMenu`. Registrada como rota top-level (`/cadastro`), irmã de `/login`, não filha do layout com `/`.
4. **Dark mode pendente.** Nenhum token novo nesta página (todos os 7 usados já existiam), então nada a decidir aqui — mas herda a mesma lacuna documentada no Login/Home. Ver [[dark_mode_pending]].
5. **Sem serviço real de auth.** Mesma decisão do Login (Decisão 5 do manifesto de login): formulário nasce com validação client-side (`vee-validate` + `zod`) e handlers `onSubmit`/`onGoogleSignIn` como placeholders locais, até a skill de dados dinâmicos existir.
6. **`GoogleButton` vira componente compartilhado (regra dos 2 usos, R6, soma cross-página).** O manifesto do Login já registrava `GoogleButton` como `inline-only` com `usos_contados: 1`, sinalizando reavaliação quando o node `oVxhA` (esta tela) fosse construído. Com Cadastro confirmando a 2ª aparição — estrutura idêntica (ícone Google + label, `bg-card`, `border-border-subtle`, `rounded-xl`, `text-button-strong text-foreground`, só o texto do label muda) — a extração é obrigatória agora. Ver spec abaixo. **Ação pendente fora do escopo desta fase:** `src/views/login/LoginForm.vue` usa o botão inline (linhas 44-52) e deveria migrar para `GoogleButton` no `/build-page`, já que o build-prep não edita seções já implementadas.
7. **Erro de confirmação de senha é validação de formulário, não componente.** O node "Mismatch Error" + a borda vermelha do "Confirm Field" no design representam o estado de erro do `zod.refine` comparando `password`/`confirmPassword`. Isso é resolvido por `FormMessage` dentro do `FormItem` do campo "Confirmar senha" (mesmo padrão R13 do Login) — não é um node separado inline nem um componente; é o comportamento nativo do `@components/ui/form` quando a validação falha.

## Frame raiz
- node-id: oVxhA ("1b · Cadastro")
- Screenshot: docs/pencil/cadastro-overview.webp (375×740, mobile)

## Tokens

### Adicionados
Nenhum. Todas as 7 cores e todos os 7 text-styles usados na tela já existiam no catálogo (ver Reusados) — nenhuma criação necessária.

### Reusados

Cores:

| Token reusado | Valor | Uso no Cadastro |
| --- | --- | --- |
| `bg-primary` / `text-primary` | `#7A4B5C` | Logo Badge, botão "Criar conta", link "Entrar" |
| `text-primary-foreground` | `#FFFFFF` | Iniciais "SB", label "Criar conta" |
| `bg-card` | `#FFFFFF` | Fundo do botão Google e dos 4 campos |
| `text-foreground` | `#2B2225` | Título, label "Cadastrar com Google" |
| `text-muted-foreground` | `#8B7B7D` | Subtítulo, placeholders dos campos, "Já tem conta?" |
| `text-muted-foreground-soft` | `#B5A7A2` | "ou" (divisor) |
| `border-border-subtle` | `#E5DAD5` | Borda do botão Google, borda dos campos (exceto erro), linhas do divisor |
| `text-error` / `border-error` (= `destructive`) | `#B5484B` | Texto "As senhas não coincidem." e borda do campo "Confirmar senha" em estado de erro |

Text-styles reusados (CSS idêntico ao que o design pede, sem aproximação — todos já usados no Login):

| Classe | Uso |
| --- | --- |
| `text-mark` | Iniciais "SB" no Logo Badge (1.375rem/700/1.2, igual ao Login) |
| `font-heading text-metric` | Título "Criar sua conta" (1.5rem/400/1.2, igual ao Login) |
| `text-caption-lg` | Subtítulo "Comece a organizar sua agenda em minutos" (0.84375rem/400 = 13.5px exato) |
| `text-button-strong` | Labels "Cadastrar com Google" e "Criar conta" (0.90625rem/700 = 14.5px exato) |
| `text-label` | "ou" (0.75rem/400 = 12px exato) **e** "As senhas não coincidem." (mesmo CSS: 12px/400 — reusar em vez de criar 3º nome, ver R2) |
| `text-caption-md` | "Já tem conta?" (0.8125rem/400 = 13px exato) |
| `text-tag` | "Entrar" (0.8125rem/700 = 13px exato) |
| — | Placeholders dos 4 campos ("Nome", "E-mail", "Senha", "Confirmar senha") sem text-style próprio, igual ao Login — tipografia default do `@components/ui/input` |

## Ícones
- Local: `src/assets/icons/{page}/` — nenhum arquivo novo
- Total: 0 novos. Reusa `src/components/icons/IconGoogle.vue` (mesmo ícone de marca do Login, 4 paths literais `#4285F4`/`#34A853`/`#FBBC05`/`#EA4335`, já extraído — ver exceção documentada na Decisão 6 do manifesto do Login)

## Imagens
Nenhuma — não há image-fill em nenhum node do Cadastro.

## Componentes do kit reusados
- `@components/ui/button` → botão "Criar conta" (via `GoogleButton` para o botão Google, ver spec)
- `@components/ui/input` → campos Nome, E-mail, Senha, Confirmar senha (mesma classe `FIELD_CLASS` do Login: `h-11.25 rounded-[12px] border-[1.5px] border-border-subtle bg-card px-3.5 text-paragraph text-foreground`; campo "Confirmar senha" precisa da variante de erro — `border-error`/`aria-invalid` quando o `zod.refine` falhar)
- `@components/ui/form` (+ `vee-validate` + `zod`) → estrutura do formulário (R13). Schema: `name` (string, obrigatório), `email` (string, formato e-mail, obrigatório), `password` (string, obrigatório, política mínima a definir), `confirmPassword` (string, obrigatório, `.refine` comparando com `password`, mensagem "As senhas não coincidem.")
- `@components/ui/separator` → as duas linhas do "Divider Row" ao redor do "ou"

**Não existe no kit:** nada faltando.

## Componentes do projeto reusados
Nenhum — Cadastro não usa `NavBar`/`AvatarMenu` (fora do `AppLayout`, ver Decisão 3).

## Componentes compartilhados — specs
> Consumidas pelo Batch 0 do /build-page. status vira "implementado" quando o arquivo é criado.

### GoogleButton
- destino: src/components/auth/google-button/
- arquivos: GoogleButton.vue, index.ts
- node_id: "tqUeE" (Cadastro, "Cadastrar com Google") — 2º uso; 1º uso em Login, node "wQCSC" ("Continuar com Google")
- screenshot: docs/pencil/cadastro-google-button.webp
- usos_contados: 2
- aparições:
  - Login (1 instância — LoginForm.vue, migrado para GoogleButton em /build-page)
  - Cadastro (1 instância — CadastroForm)
- compound: não
- envolve_primitiva: não (envolve `@components/ui/button`, que por sua vez envolve reka-ui — GoogleButton não repete o forwarding, delega ao Button)
- precisa_cva: não (só uma variante visual, usa `cn` direto)
- props:
  - class: HTMLAttributes['class'] — sempre presente
- data_slot: google-button
- slots: default (texto do botão — "Continuar com Google" no Login, "Cadastrar com Google" no Cadastro; corrigido de prop `label` para `<slot />` após code review, R5 anatomia item 6)
- tokens_usados: bg-card, border-border-subtle, text-foreground, text-button-strong
- depende_de: [IconGoogle]
- exemplo_uso: |
  <GoogleButton @click="onGoogleSignIn">Cadastrar com Google</GoogleButton>
- spec_confidence: alta
- spec_source: heuristica_humana (leitura direta dos 2 nodes via batch_get, estrutura e tokens idênticos confirmados)
- responsivo: mobile-first, `w-full` dentro do container pai (375px de referência)
- a11y: `IconGoogle` decorativo (`aria-hidden="true"`), o `label` já descreve a ação — sem necessidade de `aria-label` adicional no botão
- status: implementado
- props_implementadas: [label: string — obrigatório, class: HTMLAttributes['class'] — opcional]

## Estruturas inline-only
Nenhuma nova. Os 4 campos de formulário e o erro de confirmação de senha são markup padrão de `@components/ui/form` + `@components/ui/input`, sem repetição de estrutura customizada que justifique extração (Decisão 7).

## Plano de dados

Nenhum dado estático para `src/data/`. Todo o conteúdo é `literal` (título, subtítulo, labels, placeholders, microcopy) ou `estado-local` (valores dos campos e erros, gerenciados pelo `vee-validate`). Sem service/store de auth nesta fase (Decisão 5), mesmo padrão do Login.

## Inventário de seções

| # | Nome | node-id | Arquivo | Reusa | Dados | Paralelizável | Screenshot | Formato |
|---|------|---------|---------|-------|-------|---------------|------------|---------|
| 1 | CadastroForm | gHrpZ | src/views/cadastro/CadastroForm.vue | GoogleButton, ui/button, ui/input, ui/form, ui/separator, IconGoogle | literal + estado-local | não (seção única) | docs/pencil/cadastro-form.webp | webp |

## Plano de execução (Fase 2)
1. Batch 0 serial: `GoogleButton` (único componente compartilhado, sem dependência de outro componente novo)
2. Serial único: CadastroForm (seção única, sem paralelismo a ganhar)
3. Fora do batch mecânico, mas recomendado no mesmo /build-page: migrar `LoginForm.vue` para consumir `GoogleButton` em vez do botão inline (Decisão 6)

## Critério de aceite por seção
- Fiel ao screenshot docs/pencil/cadastro-form.webp (e overview docs/pencil/cadastro-overview.webp para o conjunto com Status Bar, que não entra no código)
- Zero valor arbitrário em cor e tipografia; `rounded-[12px]` nos campos é a única dimensão arbitrária, justificada (mesma exceção do Login — raio do design sem token equivalente)
- Formulário com `vee-validate` + `zod` via `@components/ui/form`, label associado por `FormItem`/`FormLabel` (`sr-only`, mesmo padrão do Login), erro de confirmação via `.refine` no schema (R13)
- `GoogleButton` com `IconGoogle` `aria-hidden="true"` (decorativo)
- Botão "Criar conta" do tipo `submit`; link "Entrar" como `RouterLink` para `/login`
- Mobile-first (sem `max-*`), 375px de referência

## Stubs criados
- src/pages/Cadastro.vue
- src/views/cadastro/ (pasta vazia)
- rota `/cadastro` em src/routers/index.ts (top-level, fora do `AppLayout`)

## Status

### Componentes (Batch 0)
- [x] GoogleButton

### Seções (Batches 1-N)
- [x] CadastroForm
- [x] bun check + bun run build (build ok; `bun check` falha por divergência pré-existente do biome.json, ver handoff)
- [x] review (0 blockers, 3 majors corrigidos, ver handoff)
