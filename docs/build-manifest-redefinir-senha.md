# Build Manifest — Redefinir senha

> Gerado por /build-prep em 2026-09-23
> Fonte: pencil — node sRD22 ("1d · Redefinir Senha"), arquivo `design/pencil/design.pen`
> Para implementar: `/build-page redefinir-senha`

## Identificação
- page: redefinir-senha
- página: src/pages/RedefinirSenha.vue
- seções: src/views/redefinir-senha/
- rota: /redefinir-senha

## Decisões de arquitetura (específicas deste produto, fora do RULES.md genérico)

1. **Mobile-first, não desktop-first.** Mesma decisão do Login/Cadastro/Recuperar senha: tela do Pencil em 375px fixos, sem artboard desktop. Código sai mobile-first, sem `max-*` do R12. Ver [[mobile_first_override]].
2. **Status Bar excluída da implementação.** Mesmo frame reusável mockup de chrome iOS já excluído nas páginas anteriores (`vzbKv`, ref de `F6JJP`). Não entra no inventário.
3. **Fora do `AppLayout`.** Redefinir senha é pré-autenticação, como Login/Cadastro/Recuperar senha: não usa `NavBar`/`AvatarMenu`/`NavMenu`. Registrada como rota top-level (`/redefinir-senha`), irmã de `/login`, `/cadastro` e `/recuperar-senha`, não filha do layout com `/`.
4. **Dark mode pendente.** Nenhum token novo nesta página (todas as cores e os 5 text-styles usados já existiam), então nada a decidir aqui — herda a mesma lacuna documentada no Login/Cadastro/Recuperar senha. Ver [[dark_mode_pending]].
5. **Sem serviço real de auth.** Mesma decisão do Login/Cadastro/Recuperar senha: formulário nasce com validação client-side (`vee-validate` + `zod`) e handler `onSubmit` como placeholder local, até a skill de dados dinâmicos existir.
6. **Sem `GoogleButton`/divisor "ou".** Igual Recuperar senha — só os dois campos de senha e o botão de salvar. Não reusa `GoogleButton` nem `ui/separator`.
7. **`AuthHeader` cruza o limiar de extração — proposto nesta fase.** O padrão Logo Badge (`bg-primary size-14 rounded-2xl` + `text-mark` "SB") + `<h1 class="font-heading text-metric">` + `<p class="text-caption-lg text-muted-foreground">` já se repetia em Login, Cadastro e Recuperar senha (3 usos, registrado como dívida P1 no manifesto de Recuperar senha, não extraído na ocasião). Esta tela é o **4º uso idêntico**, node a node (`E5nkCH`/`HM2eZ`/`vQe3h`), o que já ultrapassa o limiar de 2 usos da regra 6 do Passo 7 (soma cross-página). Proponho a spec de `AuthHeader` abaixo para o Batch 0 do `/build-page` resolver — inclusive migrando os 3 consumidores existentes, decisão que cabe à Fase 2, não a esta.
8. **Confirmação de senha via `.refine()`.** Mesmo padrão do Cadastro (`password === confirmPassword`, erro em `confirmPassword`), com os campos renomeados para "Nova senha"/"Confirmar nova senha" — sem campo de e-mail nesta tela (o usuário já veio autenticado pelo link).
9. **`AuthInput` reutilizado diretamente** (já extraído durante o `/build-page` de Recuperar senha) para os dois campos, com `type="password"`.

## Frame raiz
- node-id: sRD22 ("1d · Redefinir Senha")
- Screenshot: docs/pencil/redefinir-senha-overview.webp (375×586, mobile)

## Tokens

### Adicionados
Nenhum. Todas as cores e os 5 text-styles usados na tela já existiam no catálogo (ver Reusados) — nenhuma criação necessária.

### Reusados

Cores:

| Token reusado | Valor | Uso na tela |
| --- | --- | --- |
| `bg-primary` / `text-primary` | `#7A4B5C` | Logo Badge, botão "Salvar nova senha", link "Voltar para o login" |
| `text-primary-foreground` | `#FFFFFF` | Iniciais "SB", label "Salvar nova senha" |
| `bg-card` | `#FFFFFF` | Fundo dos campos de senha |
| `text-foreground` | `#2B2225` | Título |
| `text-muted-foreground` | `#8B7B7D` | Subtítulo, placeholders dos campos |
| `border-border-subtle` | `#E5DAD5` | Borda dos campos de senha |

Text-styles reusados (CSS idêntico ao que o design pede, sem aproximação):

| Classe | Uso |
| --- | --- |
| `text-mark` | Iniciais "SB" no Logo Badge (1.375rem/700/1.2) |
| `font-heading text-metric` | Título "Criar nova senha" (1.5rem/400/1.2 — design pede 24px/400, idêntico) |
| `text-caption-lg` | Subtítulo "Sua identidade foi confirmada. Defina uma nova senha para acessar sua conta." (0.84375rem/400 = 13.5px exato) |
| `text-button-strong` | Label "Salvar nova senha" (0.90625rem/700 = 14.5px exato) |
| `text-tag` | Link "Voltar para o login" (0.8125rem/700 = 13px exato) |
| — | Placeholders "Nova senha" / "Confirmar nova senha" (14px/400) sem text-style próprio — tipografia default do `@components/auth/auth-input`, igual às outras telas de auth |

## Ícones
Nenhum — não há node de ícone na tela.

## Imagens
Nenhuma — não há image-fill em nenhum node da tela.

## Componentes do kit reusados
- `@components/ui/button` → botão "Salvar nova senha" (`h-12 w-full rounded-xl px-3.5 text-button-strong`, mesma classe dos botões de Login/Cadastro/Recuperar senha)
- `@components/ui/form` (+ `vee-validate` + `zod`) → estrutura do formulário (R13). Schema: `password` + `confirmPassword`, ambos obrigatórios, `.refine()` garantindo igualdade (mesma regra do Cadastro)

**Não existe no kit:** nada faltando — todas as peças têm match direto.

## Componentes do projeto reusados
- `@components/auth/auth-input` (`AuthInput`) → campos "Nova senha" e "Confirmar nova senha", `type="password"` (já existe, criado durante o `/build-page` de Recuperar senha)

Não usa `NavBar`/`AvatarMenu` (fora do `AppLayout`, ver Decisão 3) nem `GoogleButton`/`ui/separator` (ver Decisão 6).

## Componentes compartilhados — specs
> Consumida pelo Batch 0 do `/build-page`. `status` vira "implementado" quando o arquivo é criado.

### AuthHeader
- destino: src/components/auth/auth-header/
- arquivos: AuthHeader.vue, AuthHeaderTitle.vue, AuthHeaderDescription.vue, index.ts
- node_id: `E5nkCH` (Logo Badge) + `HM2eZ` (Title) + `vQe3h` (Subtitle) — mesma estrutura em Login (`kBseT`), Cadastro (`oVxhA`), Recuperar senha (`ZklKK`)
- screenshot: docs/pencil/redefinir-senha-overview.webp (recorte superior — badge + título + subtítulo)
- usos_contados: 4 (Login, Cadastro, Recuperar senha, Redefinir senha)
- aparições:
  - LoginForm (1 instância)
  - CadastroForm (1 instância)
  - RecuperarSenhaForm (1 instância)
  - RedefinirSenhaForm (1 instância)
- compound: sim (`AuthHeader` = raiz + badge fixo + `<slot />`; `AuthHeaderTitle` = `<h1>`; `AuthHeaderDescription` = `<p>`) — **revisão pós code-review (MAJOR M2): API original (Rev. 1, título/subtítulo por prop com markup fechado) violava R5 item 6-7. Corrigido para compound antes de qualquer consumidor real existir.**
- envolve_primitiva: não
- precisa_cva: não (sem variantes ortogonais — só conteúdo muda)
- props:
  - AuthHeader: class: HTMLAttributes['class'] — opcional
  - AuthHeaderTitle: class?: HTMLAttributes['class'] — opcional; demais atributos (`id`, para `aria-labelledby`) chegam por fallthrough nativo do `<h1>`
  - AuthHeaderDescription: class?: HTMLAttributes['class'] — opcional
- data_slot: auth-header / auth-header-title / auth-header-description
- slots: default em cada peça (`AuthHeader` recebe `AuthHeaderTitle` + `AuthHeaderDescription` como children; badge "SB" é fixo, não é slot — idêntico nas 4 telas)
- tokens_usados: bg-primary, text-primary-foreground, text-mark, font-heading, text-metric, text-foreground, text-caption-lg, text-muted-foreground
- depende_de: []
- exemplo_uso: |
  <AuthHeader>
    <AuthHeaderTitle id="redefinir-senha-title">Criar nova senha</AuthHeaderTitle>
    <AuthHeaderDescription>Sua identidade foi confirmada. Defina uma nova senha para acessar sua conta.</AuthHeaderDescription>
  </AuthHeader>
- spec_confidence: alta
- spec_source: heuristica_humana (4 consumidores com implementação idêntica, dívida já registrada no manifesto de Recuperar senha); API compound corrigida por finding do code-reviewer (MAJOR M2)
- responsivo: mobile-first, conteúdo centralizado (375px de referência)
- a11y: `id` no `<AuthHeaderTitle>` chega ao `<h1>` por fallthrough — a `<section>` da view usa esse mesmo id em `aria-labelledby`, mesmo padrão já usado nas 4 telas
- status: implementado (Rev. 2 — compound, corrige MAJOR M2 do code review)
- migração_obrigatória: LoginForm.vue, CadastroForm.vue, RecuperarSenhaForm.vue devem trocar o bloco badge+título+subtítulo inline por `<AuthHeader>` (MAJOR M1 do code-review — R6: componente shared só se sustenta com 2+ consumidores reais; sem migração, o componente teria 1 consumidor de fato)

## Estruturas inline-only

### Spacer
- usos_contados: 1
- inline_na_secao: RedefinirSenhaForm
- motivo: "Espaçador de 6px entre o subtítulo e o primeiro campo, sem correspondência com token de espaçamento maior — mesmo padrão do node `s3FfCm` em Recuperar senha, que o code review removeu por já existir `gap` suficiente na seção (M2 daquele manifesto). Registrar aqui para o `section-builder`/review decidirem de novo com o mesmo critério; não é componente."
- node_id: "yixVO"
- tokens_usados: nenhum

## Plano de dados

Nenhum dado estático para `src/data/`. Todo o conteúdo é `literal` (título, subtítulo, placeholders, labels) ou `estado-local` (valor dos dois campos e erro de validação, gerenciados pelo `vee-validate`). Sem service/store de auth nesta fase (Decisão 5), mesmo padrão das outras telas de auth.

## Inventário de seções

| # | Nome | node-id | Arquivo | Reusa | Dados | Paralelizável | Screenshot | Formato |
|---|------|---------|---------|-------|-------|---------------|------------|---------|
| 1 | RedefinirSenhaForm | PgKD8 | src/views/redefinir-senha/RedefinirSenhaForm.vue | AuthHeader (proposto), AuthInput, ui/button, ui/form | literal + estado-local | não (seção única) | docs/pencil/redefinir-senha-form.webp | webp |

## Plano de execução (Fase 2)
1. Batch 0 serial: `AuthHeader` (spec nova, proposta acima) — considerar migrar Login/Cadastro/Recuperar senha para consumi-lo no mesmo batch, resolvendo a dívida P1 do manifesto de Recuperar senha (decisão do `/build-page`, fora do escopo mecânico desta fase)
2. Serial único: RedefinirSenhaForm (seção única, sem paralelismo a ganhar)

## Critério de aceite por seção
- Fiel ao screenshot docs/pencil/redefinir-senha-form.webp (e overview docs/pencil/redefinir-senha-overview.webp para o conjunto com Status Bar, que não entra no código)
- Zero valor arbitrário em cor e tipografia; `rounded-[12px]` nos campos já vem embutido em `AuthInput` (mesma exceção herdada de Login/Cadastro/Recuperar senha, não precisa ser reintroduzida)
- Formulário com `vee-validate` + `zod` via `@components/ui/form`, `.refine()` para igualdade de senha (mesmo padrão do Cadastro), label associado por `FormItem`/`FormLabel` (`sr-only`)
- Botão "Salvar nova senha" do tipo `submit`; link "Voltar para o login" como `RouterLink` para `/login`
- Mobile-first (sem `max-*`), 375px de referência

## Stubs criados
- src/pages/RedefinirSenha.vue
- src/views/redefinir-senha/ (criada pelo `section-builder` na Fase 2 ao escrever o primeiro arquivo)
- rota `/redefinir-senha` em src/routers/index.ts (top-level, fora do `AppLayout`)

## Status

### Componentes (Batch 0)
- [x] AuthHeader (Rev. 2 — compound)

### Seções (Batches 1-N)
- [x] RedefinirSenhaForm (regenerada para AuthHeader compound Rev. 2 + minors m1-m3 do review aplicados)
- [x] bun check + bun run build (build ok; `bun check` falha só por divergência pré-existente do biome.json — mesma causa documentada em Login/Cadastro/Recuperar senha, confirmada afetando também `RecuperarSenhaForm.vue` já aceito)
- [x] review (0 blockers, 2 majors corrigidos — M1 via migração de Login/Cadastro/Recuperar senha para AuthHeader, M2 via refatoração do AuthHeader para compound —, 3 minors corrigidos; ver docs/build-handoff-redefinir-senha.md)

## Auditoria

- [x] Tokens de cor novos existem nos três lugares de index.css — N/A, nenhum token novo
- [x] Text-styles novos existem em index.css E em TEXT_STYLES de src/libs/utils.ts — N/A, nenhum text-style novo; os 5 usados já existiam e batem exato com os valores do design
- [x] Ícones extraídos — N/A, nenhum ícone na tela
- [x] Imagens baixadas — N/A, nenhuma image-fill na tela
- [x] Overview capturado (docs/pencil/redefinir-senha-overview.webp, 375×586, webp por estar ≤1000px)
- [x] Cada seção do inventário tem screenshot (docs/pencil/redefinir-senha-form.webp)
- [x] Spec de AuthHeader tem props, data_slot, exemplo_uso e spec_confidence
- [x] AuthHeader tem spec_confidence alta — não precisa de checkpoint humano
- [x] Kit `ui/` consultado antes de propor componente novo (button, form, input já cobertos; AuthHeader não tem equivalente no kit, é composição de domínio)
- [x] Seção tem fonte de dados declarada no inventário (`literal + estado-local`)
- [x] Nenhum dado estático necessário — sem apontamento pendente para `src/data/`
- [x] Stubs criados e rota registrada
