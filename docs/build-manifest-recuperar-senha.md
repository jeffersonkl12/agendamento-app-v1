# Build Manifest — Recuperar senha

> Gerado por /build-prep em 2026-09-23
> Fonte: pencil — node ZklKK ("1c · Recuperar senha"), arquivo `design/pencil/design.pen`
> Para implementar: `/build-page recuperar-senha`

## Identificação
- page: recuperar-senha
- página: src/pages/RecuperarSenha.vue
- seções: src/views/recuperar-senha/
- rota: /recuperar-senha

## Decisões de arquitetura (específicas deste produto, fora do RULES.md genérico)

1. **Mobile-first, não desktop-first.** Mesma decisão do Login/Cadastro/Home: tela do Pencil em 375px fixos, sem artboard desktop. Código sai mobile-first, sem `max-*` do R12. Ver [[mobile_first_override]].
2. **Status Bar excluída da implementação.** Mesmo frame reusável mockup de chrome iOS já excluído nas páginas anteriores. Não entra no inventário.
3. **Fora do `AppLayout`.** Recuperar senha é pré-autenticação, como Login/Cadastro: não usa `NavBar`/`AvatarMenu`/`NavMenu`. Registrada como rota top-level (`/recuperar-senha`), irmã de `/login` e `/cadastro`, não filha do layout com `/`.
4. **Dark mode pendente.** Nenhum token novo nesta página (todas as 5 cores e os 3 text-styles usados já existiam), então nada a decidir aqui — herda a mesma lacuna documentada no Login/Cadastro/Home. Ver [[dark_mode_pending]].
5. **Sem serviço real de auth.** Mesma decisão do Login/Cadastro: formulário nasce com validação client-side (`vee-validate` + `zod`, campo `email` obrigatório e com formato válido) e handler `onSubmit` como placeholder local, até a skill de dados dinâmicos existir. Sem estado de sucesso ("link enviado") no design — só a tela de formulário; se o produto precisar de confirmação visual, é decisão de UX fora do escopo mecânico desta fase.
6. **Sem `GoogleButton`/divisor "ou".** Diferente de Login/Cadastro, esta tela não tem login social — só o campo de e-mail e o botão de envio. Não reusa `GoogleButton` nem `ui/separator`.
7. **Ação pendente fora do escopo desta fase:** `src/views/login/LoginForm.vue` tem o link "Esqueci minha senha" apontando para `to="/TODO"` (linhas 98-101) com um comentário explícito esperando esta tela existir. Deve ser atualizado para `to="/recuperar-senha"` no `/build-page` — build-prep não edita seções já implementadas. **Feito no `/build-page`.**
8. **`AuthInput` extraído durante o `/build-page` (code review, MAJOR M1).** A `FIELD_CLASS` estava copiada à mão em Login, Cadastro e nesta tela, e a cópia já tinha divergido: só o Cadastro tinha `aria-invalid:border-error aria-invalid:ring-0`, então Login e Recuperar senha caíam no `aria-invalid:border-destructive` default do `ui/input` num estado de erro que nunca acontece nesta tela (só 1 campo, sem regex client-side complexa) mas acontecia no Login/Cadastro. Corrigido com um componente `@components/auth/auth-input` (envolve `ui/input`, mesma anatomia do `GoogleButton`) consumido pelas 3 telas. Ver spec abaixo. Um `AuthHeader` (Logo Badge + título + subtítulo, também repetido 3×) ficou **fora** desta extração — motivo e prioridade em `## Backlog / dívida técnica`.

## Frame raiz
- node-id: ZklKK ("1c · Recuperar senha")
- Screenshot: docs/pencil/recuperar-senha-overview.webp (375×527, mobile)

## Tokens

### Adicionados
Nenhum. Todas as 5 cores e os 3 text-styles usados na tela já existiam no catálogo (ver Reusados) — nenhuma criação necessária.

### Reusados

Cores:

| Token reusado | Valor | Uso na tela |
| --- | --- | --- |
| `bg-primary` / `text-primary` | `#7A4B5C` | Logo Badge, botão "Enviar link de recuperação", link "Voltar para o login" |
| `text-primary-foreground` | `#FFFFFF` | Iniciais "SB", label "Enviar link de recuperação" |
| `bg-card` | `#FFFFFF` | Fundo do campo de e-mail |
| `text-foreground` | `#2B2225` | Título |
| `text-muted-foreground` | `#8B7B7D` | Subtítulo, placeholder do campo |
| `border-border-subtle` | `#E5DAD5` | Borda do campo de e-mail |

Text-styles reusados (CSS idêntico ao que o design pede, sem aproximação — todos já usados no Login/Cadastro):

| Classe | Uso |
| --- | --- |
| `text-mark` | Iniciais "SB" no Logo Badge (1.375rem/700/1.2, igual ao Login/Cadastro) |
| `font-heading text-metric` | Título "Recuperar senha" (1.5rem/400/1.2 — design pede 24px/400, idêntico) |
| `text-caption-lg` | Subtítulo "Informe seu e-mail e enviaremos um link para redefinir sua senha" (0.84375rem/400 = 13.5px exato) |
| `text-button-strong` | Label "Enviar link de recuperação" (0.90625rem/700 = 14.5px exato) |
| `text-tag` | Link "Voltar para o login" (0.8125rem/700 = 13px exato — não `text-tag-sm`, que é 12.5px; conferido nó a nó) |
| — | Placeholder do campo ("E-mail") sem text-style próprio, igual ao Login/Cadastro — tipografia default do `@components/ui/input` |

## Ícones
Nenhum — não há node de ícone na tela (nem fonte, nem vetor, nem imagem).

## Imagens
Nenhuma — não há image-fill em nenhum node da tela.

## Componentes do kit reusados
- `@components/ui/button` → botão "Enviar link de recuperação" (`h-12 w-full rounded-xl px-3.5 text-button-strong`, mesma classe do botão "Entrar"/"Criar conta")
- `@components/ui/input` → **não é mais consumido direto por esta tela nem por Login/Cadastro.** Envolvido por `@components/auth/auth-input` (ver spec abaixo), criado no `/build-page` para eliminar a divergência da Decisão 8
- `@components/ui/form` (+ `vee-validate` + `zod`) → estrutura do formulário (R13). Schema: `email` (string, obrigatório, formato e-mail — mesma regra do campo `email` do Cadastro)

**Não existe no kit:** nada faltando — todas as peças têm match direto.

## Componentes do projeto reusados
- `@components/auth/auth-input` (`AuthInput`) → campo "E-mail" (ver spec abaixo — criado nesta execução do `/build-page`, não estava proposto no `/build-prep`)

Não usa `NavBar`/`AvatarMenu` (fora do `AppLayout`, ver Decisão 3) nem `GoogleButton` (ver Decisão 6).

## Componentes compartilhados — specs
> Nenhuma spec foi proposta pelo `/build-prep` (ver histórico abaixo). A entrada `AuthInput` foi criada retroativamente durante o `/build-page`, a partir de um finding do code review (MAJOR M1) — registrada aqui para manter o manifesto como fonte de verdade.

### AuthInput
- destino: src/components/auth/auth-input/
- arquivos: AuthInput.vue, index.ts
- node_id: mesmo campo de e-mail desta tela (`P3xlcX`); 1ª extração formal, retroativa aos campos já existentes de Login (`identifier`/`password`) e Cadastro (`name`/`email`/`password`/`confirmPassword`)
- screenshot: docs/pencil/recuperar-senha-form.webp (campo "E-mail")
- usos_contados: 7 (1 em Recuperar senha, 2 em Login, 4 em Cadastro)
- aparições:
  - RecuperarSenhaForm (1 instância — email)
  - LoginForm (2 instâncias — identifier, password)
  - CadastroForm (4 instâncias — name, email, password, confirmPassword)
- compound: não
- envolve_primitiva: não (envolve `@components/ui/input`, que por sua vez lida com `useVModel`/`@vueuse/core` — `AuthInput` não repete isso, delega ao `Input`)
- precisa_cva: não (uma variante visual só, usa `cn` direto)
- props:
  - class: HTMLAttributes['class'] — sempre presente
- data_slot: auth-input
- slots: nenhum (repassa atributos nativos de input via fallthrough — `type`, `autocomplete`, `inputmode`, `placeholder`, `v-bind="componentField"`)
- tokens_usados: bg-card, border-border-subtle, text-paragraph, text-foreground, text-error (via `aria-invalid:border-error`)
- depende_de: []
- exemplo_uso: |
  <AuthInput type="email" autocomplete="email" inputmode="email" placeholder="E-mail" v-bind="componentField" />
- spec_confidence: alta
- spec_source: heuristica_humana (finding do code-reviewer, 3 consumidores já existentes com implementação idêntica)
- responsivo: mobile-first, `w-full` dentro do container pai (375px de referência)
- a11y: `aria-invalid:border-error aria-invalid:ring-0` embutido — estado de erro do `FormMessage`/`vee-validate` agora consistente nas 3 telas de auth (antes só o Cadastro tinha)
- status: implementado
- props_implementadas: [class: HTMLAttributes['class'] — opcional]

## Estruturas inline-only

### Spacer
- usos_contados: 1
- inline_na_secao: RecuperarSenhaForm
- motivo: "Espaçador de 6px entre o subtítulo e o campo de e-mail, sem correspondência com nenhum token de espaçamento maior. Vira apenas um elemento com `h-1.5` (6px, dentro da escala padrão do Tailwind) entre os dois — não é componente, é ajuste fino de layout."
- node_id: "s3FfCm"
- tokens_usados: nenhum

## Plano de dados

Nenhum dado estático para `src/data/`. Todo o conteúdo é `literal` (título, subtítulo, placeholder, labels) ou `estado-local` (valor do campo e erro de validação, gerenciados pelo `vee-validate`). Sem service/store de auth nesta fase (Decisão 5), mesmo padrão do Login/Cadastro.

## Inventário de seções

| # | Nome | node-id | Arquivo | Reusa | Dados | Paralelizável | Screenshot | Formato |
|---|------|---------|---------|-------|-------|---------------|------------|---------|
| 1 | RecuperarSenhaForm | rD4z1 | src/views/recuperar-senha/RecuperarSenhaForm.vue | ui/button, ui/input, ui/form | literal + estado-local | não (seção única) | docs/pencil/recuperar-senha-form.webp | webp |

## Plano de execução (Fase 2)
1. Batch 0 planejado: nenhum componente compartilhado a criar (nenhuma spec proposta pelo `/build-prep`)
2. Serial único: RecuperarSenhaForm (seção única, sem paralelismo a ganhar)
3. Fora do batch mecânico, recomendado e **feito** no mesmo `/build-page`: atualizar o link "Esqueci minha senha" em `LoginForm.vue` para `to="/recuperar-senha"` (Decisão 7)
4. **Batch 0 retroativo** (pós code-review, fora do fluxo padrão): extração de `AuthInput` + migração de `LoginForm.vue`/`CadastroForm.vue`/`RecuperarSenhaForm.vue` (Decisão 8)

## Backlog / dívida técnica

- **`AuthHeader` (P1).** Logo Badge (`bg-primary size-14 rounded-2xl` + `text-mark`) + `<h1 class="font-heading text-metric">` + `<p class="text-caption-lg text-muted-foreground">` estão repetidos, idênticos, em `LoginForm.vue`, `CadastroForm.vue` e `RecuperarSenhaForm.vue` (3 usos reais — R6 pede extração a partir de 2). Não foi extraído nesta execução porque o code review tratou como "pode ficar num refactor separado", focando o M1 no `FIELD_CLASS`/estado de erro (risco funcional real). Extrair como `@components/auth/auth-header/AuthHeader.vue`, recebendo o título via slot (cada tela tem copy diferente: "Bem-vindo de volta", "Criar sua conta", "Recuperar senha") e o subtítulo via slot ou prop.
- **`FormMessage` sem `MESSAGE_CLASS` no Login/Recuperar senha (P2).** Cadastro aplica `class="text-label text-error"` em todo `FormMessage`; Login e Recuperar senha usam o default do kit (`text-destructive text-sm`) — `text-destructive` resolve pro mesmo valor de cor que `text-error` no tema atual, mas `text-sm` é um utilitário Tailwind cru, fora do catálogo de text-styles do projeto (R2). Não é um BLOCKER porque não há falha visual hoje (mesma cor), mas é a mesma classe de risco do M1: diverge silenciosamente se `--destructive` e `--error` algum dia se separarem. Corrigir junto do `AuthHeader`, ou criar uma variante de `FormMessage` default para telas de auth.

## Critério de aceite por seção
- Fiel ao screenshot docs/pencil/recuperar-senha-form.webp (e overview docs/pencil/recuperar-senha-overview.webp para o conjunto com Status Bar, que não entra no código)
- Zero valor arbitrário em cor e tipografia; `rounded-[12px]` no campo é a única dimensão arbitrária, justificada (mesma exceção do Login/Cadastro — raio do design sem token equivalente)
- Formulário com `vee-validate` + `zod` via `@components/ui/form`, label associado por `FormItem`/`FormLabel` (`sr-only`, mesmo padrão do Login/Cadastro)
- Botão "Enviar link de recuperação" do tipo `submit`; link "Voltar para o login" como `RouterLink` para `/login`
- Mobile-first (sem `max-*`), 375px de referência

## Stubs criados
- src/pages/RecuperarSenha.vue
- src/views/recuperar-senha/ (pasta vazia)
- rota `/recuperar-senha` em src/routers/index.ts (top-level, fora do `AppLayout`)

## Status

### Componentes (Batch 0)
- [x] AuthInput (retroativo, pós code-review — ver Decisão 8)

### Seções (Batches 1-N)
- [x] RecuperarSenhaForm
- [x] bun check + bun run build (build ok; `bun check` falha só por divergência pré-existente do biome.json, mesma causa documentada no Login/Cadastro)
- [x] review (0 blockers, 2 majors corrigidos — M1 via extração de AuthInput, M2 via remoção da div-espaçador —, 4 minors: 2 corrigidos (toast de feedback, `.trim()` no schema), 2 registrados no backlog acima)
