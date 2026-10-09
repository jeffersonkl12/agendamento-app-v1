# API de Agendamento — Guia de Integração para o Front-end

Documentação técnica e de especificação para implementar o front-end (painel do profissional autônomo) sobre esta API.

> Gerada a partir do código-fonte (`src/`) em 2026-10-09; o router de recursos foi montado em `/api/v1` na mesma data. Onde algo vem do **Better Auth 1.7.7** (autenticação), o comportamento foi confirmado no código instalado e na documentação oficial; itens que não consegui confirmar estão marcados como **(a confirmar)**.

---

## Mapa de rotas e prefixos

| Grupo                      | Prefixo                    | Autenticação             | Uso no front               |
| -------------------------- | -------------------------- | ------------------------ | -------------------------- |
| Autenticação (Better Auth) | `/api/auth/*`              | pública (emite a sessão) | Sim                        |
| Conexão WhatsApp           | `/api/whatsapp/connection` | sessão                   | Sim                        |
| **Recursos (CRUD)**        | **`/api/v1/*`**            | sessão                   | Sim                        |
| Webhook WhatsApp           | `/webhooks/whatsapp`       | segredo compartilhado    | **Não** — só Evolution API |

Todas as rotas de recursos das seções 5 e 7 são relativas a **`/api/v1`**: `GET /customers` significa `GET http://localhost:3000/api/v1/customers`. Sem o prefixo a rota retorna 404.

### Ponto de atenção de segurança (para o back-end)

O `MastraServer` registra rotas do Mastra (`/api/agents/...`, workflows etc.) no mesmo app, **fora** do middleware de autenticação. O front **não deve** usá-las, e o back-end deve avaliar protegê-las ou desabilitá-las em produção.

---

## 1. Visão geral

- **O que é:** backend para profissionais autônomos gerenciarem serviços e agenda. Os **clientes finais** não usam o front: agendam conversando por **WhatsApp** com um assistente de IA (Mastra). O front é o **painel do profissional**.
- **Stack:** Hono + Bun, PostgreSQL (Drizzle), Better Auth, Zod 4, Evolution API (WhatsApp), Resend (e-mails).
- **Base URL (dev):** `http://localhost:3000` (porta fixa em `src/index.ts`).
- **Health check:** `GET /` → `200 text/plain` `Hello Hono!`. `GET /api/auth/ok` verifica o Better Auth.

### Conceitos de domínio

```
User (profissional)
 ├── Customer (cliente, identificado pelo telefone WhatsApp)
 ├── AppointmentTemplate (um "serviço" + questionário)
 │     ├── SchedulingConfig (1:1 — dias/horários/intervalo)
 │     └── TemplateQuestion (N, ordenadas por position)
 │           └── QuestionOption (N — só em single_choice / multiple_choice)
 └── Appointment (agendamento: Customer + Template)
       └── AppointmentAnswer (N — respostas do cliente, com preço "congelado")
```

- **Multi-tenant:** todo dado pertence ao usuário logado. Acessar recurso de outro usuário retorna **404** (nunca 403), igual a um id inexistente.
- **Snapshots:** `Appointment` e `AppointmentAnswer` guardam preço, duração e rótulo da pergunta no momento da reserva; editar o serviço depois **não** altera agendamentos passados.

### Convenções globais

| Tema                  | Regra                                                                                                                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formato               | JSON (`Content-Type: application/json`) nas requisições com corpo                                                                                                                                           |
| IDs                   | UUID v4 (string). `:id` inválido → `400`                                                                                                                                                                    |
| Dinheiro              | **Inteiro em centavos** (`7500` = R$ 75,00). Nunca decimal                                                                                                                                                  |
| Datas/horas absolutas | ISO 8601 em UTC (`2026-11-03T13:00:00.000Z`). Na entrada aceita qualquer string que `new Date()` entenda (use ISO)                                                                                          |
| Hora do dia           | `"HH:mm"` na entrada; a **saída** vem como `"HH:mm:ss"` (ex.: `"09:00:00"`)                                                                                                                                 |
| Telefone              | Só dígitos, com DDI, sem `+`: regex `^[1-9]\d{9,14}$` (ex.: `5511999998888`)                                                                                                                                |
| `PATCH`               | Parcial: envie só o que muda. Campos desconhecidos/imutáveis são **ignorados**. Corpo `{}` ou sem mudanças → `200` com o recurso atual. A validação roda sobre o objeto **mesclado** (existente + mudanças) |
| `DELETE`              | `204 No Content`, sem corpo                                                                                                                                                                                 |
| `POST` (criação)      | `201 Created` com o recurso criado                                                                                                                                                                          |
| Campos gerenciados    | `id`, `userId`, `createdAt`, `updatedAt` — **não envie**                                                                                                                                                    |
| Campos anuláveis      | Omitidos no `POST` viram `null`                                                                                                                                                                             |

---

## 2. Autenticação e sessão

Autenticação por **cookie de sessão HttpOnly** emitido pelo Better Auth (cookie `better-auth.session_token`; em HTTPS ganha o prefixo `__Secure-`). O front **não** lê nem envia token manualmente.

### Requisitos no front

1. **Toda requisição** deve usar credenciais:
   - `fetch(url, { credentials: 'include' })` / `axios.defaults.withCredentials = true`.
2. A origem do front precisa estar em **`TRUSTED_ORIGINS`** (variável de ambiente do back, lista separada por vírgula; padrão de exemplo `http://localhost:5173`). Caso contrário o CORS bloqueia.
3. Duração da sessão: 7 dias, renovada com o uso (padrão do Better Auth).
4. Sessão inválida/ausente em rota protegida → `401` com corpo **`text/plain`** `Authentication required` (**não é JSON** — veja seção 3).

Recomendação: usar o cliente oficial `better-auth/client` (`createAuthClient({ baseURL, fetchOptions: { credentials: 'include' } })`), que já implementa as chamadas abaixo. Se preferir `fetch` puro, os contratos HTTP estão a seguir. Os campos extras `phone` e `tradeName` são configurados como `additionalFields` do usuário.

### 2.1 Cadastro — `POST /api/auth/sign-up/email`

Body:

| Campo         | Tipo   | Obrigatório | Regras                                                                                                                |
| ------------- | ------ | ----------- | --------------------------------------------------------------------------------------------------------------------- |
| `name`        | string | sim         |                                                                                                                       |
| `email`       | string | sim         |                                                                                                                       |
| `password`    | string | sim         | 8–128 caracteres                                                                                                      |
| `phone`       | string | não         | campo adicional; use o formato de telefone da seção 1 (esta rota **não** aplica a regex do projeto — valide no front) |
| `tradeName`   | string | não         | nome fantasia / profissional                                                                                          |
| `image`       | string | não         | URL                                                                                                                   |
| `callbackURL` | string | recomendado | URL **absoluta do front** para onde o usuário vai após clicar no link do e-mail. Deve pertencer a `TRUSTED_ORIGINS`   |

```json
{
  "name": "Maria Souza",
  "email": "maria@exemplo.com",
  "password": "senha-segura-123",
  "phone": "5511999998888",
  "tradeName": "Studio Maria",
  "callbackURL": "http://localhost:5173/app"
}
```

Resposta `200`:

```json
{
  "token": null,
  "user": {
    "id": "…",
    "name": "Maria Souza",
    "email": "maria@exemplo.com",
    "emailVerified": false,
    "image": null,
    "phone": "5511999998888",
    "tradeName": "Studio Maria",
    "createdAt": "…",
    "updatedAt": "…"
  }
}
```

Comportamento:

- O e-mail exige verificação (`requireEmailVerification: true`): **não há sessão** após o cadastro (`token: null`). Mostre "Verifique seu e-mail".
- **Anti-enumeração:** se o e-mail **já existe**, a resposta é igualmente `200`; o dono recebe um e-mail avisando. O front não consegue (nem deve) distinguir os casos.

### 2.2 Verificação de e-mail

- O e-mail contém um link `…/api/auth/verify-email?token=…&callbackURL=…`. Ao clicar, o back valida o token, **abre a sessão automaticamente** (`autoSignInAfterVerification`) e redireciona (302) para o `callbackURL`.
- Token inválido/expirado: redireciona para `callbackURL?error=invalid_token`. A tela do `callbackURL` deve tratar esse query param e oferecer "reenviar".
- Reenviar: `POST /api/auth/send-verification-email` com `{ "email": "…", "callbackURL": "http://localhost:5173/app" }` → `{ "status": true }`.

### 2.3 Login com e-mail e senha — `POST /api/auth/sign-in/email`

```json
{
  "email": "maria@exemplo.com",
  "password": "senha-segura-123",
  "rememberMe": true
}
```

| Campo         | Tipo    | Obrigatório         | Notas                                                            |
| ------------- | ------- | ------------------- | ---------------------------------------------------------------- |
| `email`       | string  | sim                 |                                                                  |
| `password`    | string  | sim                 |                                                                  |
| `rememberMe`  | boolean | não (padrão `true`) | `false` → sessão de navegador (cookie de sessão)                 |
| `callbackURL` | string  | não                 | se enviado, a resposta traz `redirect: true` e header `Location` |

Resposta `200` (e `Set-Cookie` com a sessão):

```json
{
  "redirect": false,
  "token": "…",
  "url": null,
  "user": {
    "id": "…",
    "name": "…",
    "email": "…",
    "emailVerified": true,
    "phone": null,
    "tradeName": null,
    "image": null,
    "createdAt": "…",
    "updatedAt": "…"
  }
}
```

Erros (corpo JSON do Better Auth: `{ "code": "…", "message": "…" }`):

| Status | Situação                                                                              | Ação no front                                 |
| ------ | ------------------------------------------------------------------------------------- | --------------------------------------------- |
| `401`  | E-mail ou senha inválidos                                                             | Mensagem genérica                             |
| `403`  | **E-mail não verificado**. Cada tentativa bloqueada **reenvia** o link de verificação | Tela "confirme seu e-mail" (+ botão reenviar) |
| `429`  | Rate limit                                                                            | Mostrar "tente novamente em instantes"        |

### 2.4 Login com Google — `POST /api/auth/sign-in/social`

```json
{
  "provider": "google",
  "callbackURL": "http://localhost:5173/app",
  "errorCallbackURL": "http://localhost:5173/login?error=oauth",
  "newUserCallbackURL": "http://localhost:5173/onboarding",
  "disableRedirect": true
}
```

Resposta: `{ "url": "https://accounts.google.com/…", "redirect": false }`.

Fluxo: o front envia o POST com `disableRedirect: true` (requisição XHR não segue redirect cross-origin) e então faz `window.location.href = url`. O Google devolve para `{BETTER_AUTH_URL}/api/auth/callback/google`, o back cria a sessão e redireciona para `callbackURL` (ou `newUserCallbackURL` no primeiro acesso).

- Sempre pede seleção de conta (`prompt: select_account`).
- Se já existir conta com senha para o mesmo e-mail, o Google é **vinculado** automaticamente (provider confiável).
- Usuários de login social **não têm** `phone` nem `tradeName` → pedir no onboarding e salvar via `PATCH /users/me`.
- `callbackURL`/`errorCallbackURL`/`newUserCallbackURL` devem ser absolutos e estar em `TRUSTED_ORIGINS`. Veja a nota de segurança do `redirect_uri` no `.env.example`.

### 2.5 Sessão atual — `GET /api/auth/get-session`

- Logado: `200` com `{ "session": { … }, "user": { … } }`.
- Não logado: `200` com corpo `null`.

Use no carregamento do app para decidir entre tela de login e painel.

### 2.6 Logout — `POST /api/auth/sign-out`

Envie corpo `{}` com `Content-Type: application/json`. Resposta `200` `{ "success": true }`; o cookie é limpo.

### 2.7 Recuperação de senha

1. `POST /api/auth/request-password-reset` — `{ "email": "…", "redirectTo": "http://localhost:5173/reset-password" }` → `200` `{ "status": true, "message": "…" }` (resposta igual exista ou não o e-mail).
2. O usuário clica no link do e-mail → o back redireciona para `redirectTo?token=<TOKEN>` (ou `redirectTo?error=INVALID_TOKEN`).
3. `POST /api/auth/reset-password` — `{ "newPassword": "…", "token": "<TOKEN>" }` → `200` `{ "status": true }`. **Todas as sessões são revogadas**: mande o usuário para o login. O usuário recebe um e-mail de "senha alterada".

### 2.8 Outras rotas do Better Auth disponíveis

Todas sob `/api/auth/*` (o proxy repassa `GET` e `POST`): `POST /change-password` (`{ currentPassword, newPassword, revokeOtherSessions? }`, exige sessão), `GET /list-sessions`, `POST /revoke-session`, `POST /revoke-other-sessions`, `POST /revoke-sessions`, `GET /list-accounts`, `POST /update-user`.

> Para editar perfil, **prefira `PATCH /users/me`** (aplica as validações do projeto, inclusive telefone) em vez de `/api/auth/update-user`.

### 2.9 Rate limit (somente em produção)

| Rota                       | Limite     |
| -------------------------- | ---------- |
| `/sign-in/email`           | 5 / minuto |
| `/sign-up/email`           | 5 / minuto |
| `/request-password-reset`  | 3 / minuto |
| `/send-verification-email` | 3 / minuto |

Excedeu → `429`. Desabilite os botões após o envio para evitar estourar o limite.

---

## 3. Formato de erros

Rotas do projeto (CRUD e WhatsApp):

| Status | Quando                                                                         | Corpo                                                     |
| ------ | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `400`  | JSON malformado                                                                | `{ "error": "Malformed JSON body" }`                      |
| `400`  | Validação (Zod), `:id` ou query inválidos                                      | `{ "error": "Validation failed", "issues": [ZodIssue…] }` |
| `400`  | Regra de negócio (`BadRequestError`)                                           | `{ "error": "mensagem" }`                                 |
| `401`  | Sem sessão                                                                     | **`text/plain`**: `Authentication required`               |
| `404`  | Não existe **ou** pertence a outro usuário                                     | `{ "error": "Customer not found: <id>" }`                 |
| `409`  | Conflito (`ConflictError`) ou violação de unicidade/chave estrangeira no banco | `{ "error": "mensagem" }`                                 |
| `422`  | Operação inválida para o estado (`InvalidOperationError`)                      | `{ "error": "mensagem" }`                                 |
| `500`  | Erro inesperado                                                                | `{ "error": "Internal server error" }`                    |

Exemplo de `issues` (400):

```json
{
  "error": "Validation failed",
  "issues": [
    {
      "code": "invalid_format",
      "format": "regex",
      "pattern": "/^[1-9]\\d{9,14}$/",
      "path": ["phone"],
      "message": "Invalid phone number"
    }
  ]
}
```

Use `issues[].path` para marcar o campo do formulário e `issues[].message` como texto de apoio.

**Atenções ao tratar erros no front**

- O `401` do middleware é **texto puro**, não JSON: leia `response.status` primeiro, e só faça `response.json()` quando o `Content-Type` for JSON. Em qualquer `401` → redirecionar para login.
- Erros das rotas `/api/auth/*` usam o formato do Better Auth (`{ code, message }`), diferente do acima.
- Violações de unicidade e de chave estrangeira retornam `409` (ver seção 6).
- Mensagens de `error` estão em **inglês**; mapeie para textos de UI no front, não exiba cru.

---

## 4. Conexão do WhatsApp (profissional)

Cada profissional conecta o **próprio número** (uma instância Evolution API, nome `prof-<userId>`). Todas as rotas exigem sessão. CORS com credenciais para `TRUSTED_ORIGINS`.

Tipo de resposta (`ConnectionInfo`):

```ts
type ConnectionInfo = {
  status: "not_created" | "connecting" | "connected" | "disconnected";
  qrCode?: string; // data URL (imagem) do QR code, presente enquanto aguarda leitura
  pairingCode?: string; // código para digitar no WhatsApp; só se phoneNumber foi enviado
};
```

### `GET /api/whatsapp/connection`

Retorna apenas o status (nunca QR code): `200` `{ "status": "connected" }`.

### `POST /api/whatsapp/connection`

Inicia (ou retoma) a conexão. Corpo **opcional**.

| Campo         | Tipo   | Obrigatório | Regras                                                                                                                                                       |
| ------------- | ------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `phoneNumber` | string | não         | Caracteres não numéricos são removidos; depois deve ter **10–15 dígitos** (DDI + DDD + número). Com ele, a resposta traz `pairingCode`; sem ele, só `qrCode` |

Comportamento conforme o estado atual:

| Estado atual                  | O que acontece                         | Resposta                                         |
| ----------------------------- | -------------------------------------- | ------------------------------------------------ |
| `not_created`                 | Cria a instância e configura o webhook | `{ status: 'connecting', qrCode, pairingCode? }` |
| `connecting` / `disconnected` | Pede novo QR/código                    | `{ status: 'connecting', qrCode, pairingCode? }` |
| `connected`                   | Nada a fazer                           | `{ status: 'connected' }`                        |

```http
POST /api/whatsapp/connection
Content-Type: application/json

{ "phoneNumber": "+55 (11) 99999-8888" }
```

```json
{
  "status": "connecting",
  "qrCode": "data:image/png;base64,iVBOR…",
  "pairingCode": "ABCD-1234"
}
```

Erros: `400` (telefone inválido ou JSON malformado), `401`, `500` (Evolution API indisponível/timeout de 15 s).

### `DELETE /api/whatsapp/connection`

Desconecta e remove a instância. Idempotente. `204`.

### Fluxo esperado na tela "Conectar WhatsApp"

1. `GET /connection` ao abrir a tela.
   - `connected` → mostrar "Conectado" + botão **Desconectar** (`DELETE`).
   - Outros → botão **Conectar**.
2. `POST /connection` → exibir `<img src={qrCode}>`; se o usuário preferiu informar o número, exibir o `pairingCode` ("WhatsApp → Aparelhos conectados → Conectar com número de telefone").
3. **Polling** de `GET /connection` a cada ~3 s até `status === 'connected'` (e parar ao sair da tela).
4. QR code expira: se o status continuar `connecting` por muito tempo, ofereça "Gerar novo QR" (novo `POST`).
5. Depois de conectado, os clientes passam a ser atendidos automaticamente pelo assistente; o front vê o resultado em `appointments` e `customers`.

---

## 5. Recursos (CRUD) — prefixo `/api/v1`

Todas as rotas desta seção exigem sessão e operam **apenas** nos dados do usuário logado. Todos os caminhos são relativos a `/api/v1`. Notação: `*` = obrigatório.

### Matriz de rotas

| Recurso                | Listar                                     | Obter                | Criar                         | Atualizar              | Excluir                 |
| ---------------------- | ------------------------------------------ | -------------------- | ----------------------------- | ---------------------- | ----------------------- |
| Perfil                 | —                                          | `GET /users/me`      | — (cadastro é no Better Auth) | `PATCH /users/me`      | `DELETE /users/me`      |
| Clientes               | `GET /customers`                           | `GET /customers/:id` | `POST /customers`             | `PATCH /customers/:id` | `DELETE /customers/:id` |
| Serviços               | `GET /appointment-templates`               | `…/:id`              | `POST …`                      | `PATCH …/:id`          | `DELETE …/:id`          |
| Configuração de agenda | `GET /scheduling-configs`                  | `…/:id`              | `POST …`                      | `PATCH …/:id`          | `DELETE …/:id`          |
| Perguntas              | `GET /template-questions?templateId=*`     | `…/:id`              | `POST …`                      | `PATCH …/:id`          | `DELETE …/:id`          |
| Opções                 | `GET /question-options?questionId=*`       | `…/:id`              | `POST …`                      | `PATCH …/:id`          | `DELETE …/:id`          |
| Agendamentos           | `GET /appointments?status&from&to`         | `…/:id`              | `POST …`                      | `PATCH …/:id`          | `DELETE …/:id`          |
| Respostas              | `GET /appointment-answers?appointmentId=*` | `…/:id`              | `POST …`                      | `PATCH …/:id`          | `DELETE …/:id`          |

Status de sucesso: `GET`/`PATCH` → `200`, `POST` → `201`, `DELETE` → `204`.

---

### 5.1 Perfil — `/users/me`

Representação (`PublicUser`):

```json
{
  "id": "0b9e…",
  "name": "Maria Souza",
  "email": "maria@exemplo.com",
  "emailVerified": true,
  "image": null,
  "phone": "5511999998888",
  "tradeName": "Studio Maria",
  "createdAt": "2026-10-09T12:00:00.000Z",
  "updatedAt": "2026-10-09T12:00:00.000Z"
}
```

**`GET /users/me`** → `200` perfil. `404` se a conta não existir mais.

**`PATCH /users/me`** — campos (todos opcionais):

| Campo       | Regras                 |
| ----------- | ---------------------- |
| `name`      | trim, 1–120 caracteres |
| `phone`     | `^[1-9]\d{9,14}$`      |
| `tradeName` | trim, 1–120 caracteres |

`email`, `image` e senha **não** são alterados aqui (ignorados). Retorna o perfil atualizado.

**`DELETE /users/me`** → `204`. **Exclui a conta e, em cascata, TODOS os dados** (clientes, serviços, agendamentos…). Exija confirmação explícita no front. A sessão deixa de ser válida; redirecione ao login.

---

### 5.2 Clientes — `/customers`

Representação:

```json
{
  "id": "…",
  "userId": "…",
  "phone": "5511988887777",
  "name": "João",
  "createdAt": "…",
  "updatedAt": "…"
}
```

**`POST /customers`**

| Campo    | Tipo           | Regras            |
| -------- | -------------- | ----------------- |
| `phone`* | string         | `^[1-9]\d{9,14}$` |
| `name`   | string \| null | trim, 1–120       |

**`PATCH /customers/:id`** — `phone`, `name`.

**`GET /customers`** → array ordenado por `createdAt` desc, sem paginação.

Clientes também são **criados automaticamente** quando alguém escreve pelo WhatsApp (telefone = número do remetente, `name` possivelmente `null`).

Telefone duplicado para o mesmo usuário e exclusão de cliente com agendamentos retornam `409` (ver seção 6).

---

### 5.3 Serviços (templates) — `/appointment-templates`

Um "serviço" que o cliente pode agendar, com preço base e questionário.

```json
{
  "id": "…",
  "userId": "…",
  "name": "Corte de cabelo",
  "description": "Corte + lavagem",
  "basePriceInCents": 5000,
  "createdAt": "…",
  "updatedAt": "…"
}
```

**`POST /appointment-templates`**

| Campo              | Tipo            | Regras                       |
| ------------------ | --------------- | ---------------------------- |
| `name`*            | string          | trim, 1–120                  |
| `description`      | string \| null  | trim, máx. 500               |
| `basePriceInCents` | integer \| null | ≥ 0. `null` = sem preço base |

**`PATCH /appointment-templates/:id`** — `name`, `description`, `basePriceInCents`.

`DELETE` remove também configuração de agenda, perguntas e opções (cascata). Agendamentos existentes **permanecem**, com `templateId = null`.

---

### 5.4 Configuração de agenda — `/scheduling-configs`

Define quando o profissional atende para **um** serviço. **No máximo uma por serviço.**

```json
{
  "id": "…",
  "userId": "…",
  "templateId": "…",
  "openDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "openTime": "09:00:00",
  "closeTime": "18:00:00",
  "intervalMinutes": 60,
  "timezone": "America/Sao_Paulo",
  "createdAt": "…",
  "updatedAt": "…"
}
```

**`POST /scheduling-configs`**

| Campo             | Tipo                                                                                  | Regras                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `templateId`*     | uuid                                                                                  | Deve ser um serviço seu, senão `404`. Já ter config → `409`                                                                                  |
| `openDays`*       | array de `monday`\|`tuesday`\|`wednesday`\|`thursday`\|`friday`\|`saturday`\|`sunday` | ≥ 1 item, **sem repetição**                                                                                                                  |
| `openTime`*       | string `HH:mm`                                                                        | `00:00`–`23:59`                                                                                                                              |
| `closeTime`*      | string `HH:mm`                                                                        | Deve ser **posterior** a `openTime` (erro em `closeTime`)                                                                                    |
| `intervalMinutes` | integer \| null                                                                       | ≥ 1. Com valor: horários começam em `openTime` e repetem a cada N minutos (grade fixa). `null`: qualquer horário livre dentro do expediente  |
| `timezone`        | string                                                                                | Nome IANA (ex.: `America/Sao_Paulo`, padrão). Fuso inexistente → `400` com `issues[].path = ["timezone"]`, mensagem `Invalid IANA time zone` |

**`PATCH /scheduling-configs/:id`** — todos acima **exceto** `templateId` (imutável). A validação considera o conjunto mesclado: mudar só `closeTime` para antes do `openTime` atual falha.

Entrada aceita `HH:mm` e `HH:mm:ss`; a saída é sempre `HH:mm:ss`.

---

### 5.5 Perguntas do serviço — `/template-questions`

Questionário que o cliente responde ao agendar; o preço da resposta pode somar ao total.

```json
{
  "id": "…",
  "templateId": "…",
  "label": "Quantos metros?",
  "type": "number",
  "isRequired": true,
  "position": 0,
  "priceInCents": 1000,
  "createdAt": "…",
  "updatedAt": "…"
}
```

**`GET /template-questions?templateId=<uuid>`** — `templateId` **obrigatório** (senão `400`). Serviço de outro usuário → `404`.

**`POST /template-questions`**

| Campo          | Tipo            | Regras                                                                                            |
| -------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| `templateId`*  | uuid            | Serviço seu, senão `404`                                                                          |
| `label`*       | string          | trim, 1–200                                                                                       |
| `type`*        | enum            | `free_text` \| `single_choice` \| `multiple_choice` \| `number` \| `yes_no`                       |
| `position`*    | integer         | ≥ 0 (ordem de exibição)                                                                           |
| `isRequired`   | boolean         | padrão `true`                                                                                     |
| `priceInCents` | integer \| null | ≥ 0. **Deve ser `null`/omitido em `single_choice` e `multiple_choice`** (o preço fica nas opções) |

**`PATCH /template-questions/:id`** — `label`, `type`, `isRequired`, `position`, `priceInCents` (`templateId` imutável).

**Como o `priceInCents` da pergunta é cobrado** (aplicado na reserva pelo assistente):

| `type`            | Cobrança                              | Formato do valor da resposta |
| ----------------- | ------------------------------------- | ---------------------------- |
| `free_text`       | Uma vez, se respondida                | `string`                     |
| `number`          | `preço × quantidade informada`        | `number` ≥ 0                 |
| `yes_no`          | Só se a resposta for "sim"            | `boolean`                    |
| `single_choice`   | Preço da opção escolhida              | `string` (rótulo da opção)   |
| `multiple_choice` | Soma dos preços das opções escolhidas | `string[]` (≥ 1 rótulo)      |

Dica de UI: ao escolher `single_choice`/`multiple_choice`, esconda o campo de preço e mostre o editor de opções.

---

### 5.6 Opções de resposta — `/question-options`

Alternativas de perguntas `single_choice`/`multiple_choice`.

```json
{
  "id": "…",
  "questionId": "…",
  "label": "Barba completa",
  "position": 1,
  "priceInCents": 2500
}
```

**`GET /question-options?questionId=<uuid>`** — `questionId` obrigatório; pergunta de outro usuário → `404`.

**`POST /question-options`**

| Campo          | Tipo            | Regras                                                                                                                 |
| -------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `questionId`*  | uuid            | Pergunta sua, senão `404`. Se o tipo **não** for de escolha → `422` `Questions of type "<type>" do not accept options` |
| `label`*       | string          | trim, 1–200                                                                                                            |
| `position`*    | integer         | ≥ 0                                                                                                                    |
| `priceInCents` | integer \| null | ≥ 0. `null` ou `0` = grátis                                                                                            |

**`PATCH /question-options/:id`** — `label`, `position`, `priceInCents` (`questionId` imutável). Opções **não têm** `createdAt/updatedAt`.

---

### 5.7 Agendamentos — `/appointments`

```json
{
  "id": "…",
  "userId": "…",
  "customerId": "…",
  "templateId": "…",
  "status": "scheduled",
  "startsAt": "2026-11-03T13:00:00.000Z",
  "durationMinutes": 60,
  "basePriceInCents": 5000,
  "totalPriceInCents": 7500,
  "notes": "Cliente prefere atendimento pela manhã",
  "createdAt": "…",
  "updatedAt": "…"
}
```

**Status:** `pending` | `scheduled` | `completed` | `canceled` | `no_show`. Agendamentos feitos pelo assistente nascem `scheduled`; cancelados pelo cliente viram `canceled`. Cliente só pode alterar/cancelar enquanto `pending`/`scheduled`.

**`GET /appointments`** — query opcional:

| Param        | Tipo           | Notas                                                 |
| ------------ | -------------- | ----------------------------------------------------- |
| `customerId` | uuid           | só agendamentos desse cliente (`400` se não for uuid) |
| `status`     | enum de status |                                                       |
| `from`       | data ISO       | limite **inferior inclusivo** de `startsAt`           |
| `to`         | data ISO       | limite **superior inclusivo** de `startsAt`           |

Ordem: `startsAt` **decrescente**. Sem paginação. Data inválida → `400`.

Exemplo (agenda de novembro, só confirmados):
`GET /appointments?status=scheduled&from=2026-11-01T00:00:00-03:00&to=2026-11-30T23:59:59-03:00` (codifique o `+` de offsets como `%2B`).

**`POST /appointments`**

| Campo               | Tipo            | Regras                   |
| ------------------- | --------------- | ------------------------ |
| `customerId`*       | uuid            | Cliente seu, senão `404` |
| `startsAt`*         | data ISO        |                          |
| `templateId`        | uuid \| null    | Serviço seu, senão `404` |
| `status`            | enum            | padrão `pending`         |
| `durationMinutes`   | integer \| null | ≥ 1                      |
| `basePriceInCents`  | integer \| null | ≥ 0                      |
| `totalPriceInCents` | integer         | ≥ 0, padrão `0`          |
| `notes`             | string \| null  | trim, máx. 1000          |

**`PATCH /appointments/:id`** — `status`, `startsAt`, `durationMinutes`, `basePriceInCents`, `totalPriceInCents`, `notes`. **`customerId` e `templateId` não mudam.**

**Importante:** este CRUD é "cru". Ele **não** calcula preço, **não** valida disponibilidade/expediente e **não** recalcula total ao mexer em respostas. Ao criar manualmente pelo painel, o front deve informar `durationMinutes` e os preços. Dois agendamentos ativos (`pending`/`scheduled`/`completed`) no mesmo `startsAt` violam a unicidade e retornam `409` (seção 6).

Ações comuns da UI:

- Confirmar/concluir/cancelar/marcar falta → `PATCH { "status": "completed" }` etc.
- Remarcar → `PATCH { "startsAt": "…" }`.

---

### 5.8 Respostas do agendamento — `/appointment-answers`

Respostas dadas pelo cliente, com a pergunta "congelada".

```json
{
  "id": "…",
  "appointmentId": "…",
  "questionId": "…",
  "questionLabel": "Quais adicionais?",
  "questionType": "multiple_choice",
  "value": ["Barba completa", "Sobrancelha"],
  "priceInCents": 4000
}
```

**`GET /appointment-answers?appointmentId=<uuid>`** — `appointmentId` obrigatório; agendamento de outro usuário → `404`.

**`POST /appointment-answers`**

| Campo            | Tipo                                    | Regras                                                                                 |
| ---------------- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| `appointmentId`* | uuid                                    | Agendamento seu, senão `404`                                                           |
| `questionId`     | uuid \| null                            | Se enviado, pergunta sua, senão `404`                                                  |
| `questionLabel`* | string                                  | trim, 1–200                                                                            |
| `questionType`*  | enum de tipos de pergunta               |                                                                                        |
| `value`*         | string \| number \| boolean \| string[] | Deve casar com `questionType` (tabela da seção 5.5), senão `400` com `path: ["value"]` |
| `priceInCents`   | integer                                 | ≥ 0, padrão `0`                                                                        |

**`PATCH /appointment-answers/:id`** — `questionLabel`, `value`, `priceInCents`. (`appointmentId`, `questionId` e `questionType` imutáveis; o `value` é validado contra o `questionType` existente.)

Editar respostas **não** atualiza `totalPriceInCents` do agendamento: se alterar preço, faça também `PATCH /appointments/:id { totalPriceInCents }`.

---

## 6. Armadilhas e comportamentos a conhecer

Violações de constraints do PostgreSQL agora são traduzidas para `409 Conflict` (`{ "error": "…" }`), em vez de `500`:

| Situação                                                                                              | Resposta | Mensagem (`error`)                                                      |
| ----------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------- |
| Cliente com telefone já existente (mesmo usuário)                                                     | `409`    | `A record with these values already exists`                             |
| Dois agendamentos ativos (`pending`/`scheduled`/`completed`) no mesmo `startsAt` (criação ou `PATCH`) | `409`    | idem                                                                    |
| Excluir cliente que possui agendamentos                                                               | `409`    | `The record is referenced by other records or references a missing one` |

Trate `409` mostrando uma mensagem amigável conforme a tela (ex.: "Já existe um cliente com este telefone", "Horário já ocupado", "Cliente possui agendamentos").

Outros pontos:

| Situação                    | Comportamento                                           | Como o front se protege                              |
| --------------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| Listas sem paginação        | Retornam tudo                                           | Filtrar no cliente; usar `from`/`to` em agendamentos |
| CRUD de agendamento é "cru" | Não valida expediente/disponibilidade nem calcula preço | Calcular/validar no front ao criar manualmente       |

---

## 7. Fluxos recomendados de ponta a ponta

### 7.1 Onboarding do profissional

```
1. Cadastro            POST /api/auth/sign-up/email  (callbackURL = /app)
2. "Verifique e-mail"  (usuário clica no link → sessão aberta → redireciona ao callbackURL)
3. Perfil completo?    GET /users/me → se phone/tradeName nulos: PATCH /users/me
4. Conectar WhatsApp   GET/POST/DELETE /api/whatsapp/connection  (seção 4)
5. Criar serviço       POST /appointment-templates
6. Definir agenda      POST /scheduling-configs   { templateId, openDays, openTime, closeTime, intervalMinutes }
7. (Opcional) Questionário
                       POST /template-questions → (se escolha) POST /question-options (N)
```

Sem o passo 6 o serviço não tem horários disponíveis para o assistente oferecer. Sem o passo 4 o assistente não atende ninguém.

### 7.2 Painel diário

```
Agenda do dia/semana → GET /appointments?from=…&to=…&status=scheduled
Detalhe              → GET /appointments/:id + GET /appointment-answers?appointmentId=:id
                       + GET /customers/:customerId
Mudar status         → PATCH /appointments/:id { status }
Remarcar             → PATCH /appointments/:id { startsAt }
```

Para listar com nome do cliente, carregue `GET /customers` uma vez e cruze por `customerId` no front (a API não faz join).

### 7.3 Construtor de serviço (tela única)

```
GET  /appointment-templates                     → lista de serviços
GET  /scheduling-configs                        → cruzar por templateId
GET  /template-questions?templateId=X           → ordenar por position
GET  /question-options?questionId=Q             → uma chamada por pergunta de escolha
Salvar alterações → POST/PATCH/DELETE correspondentes
Reordenar         → PATCH /template-questions/:id { position } (uma chamada por item alterado)
```

### 7.4 Como o cliente final agenda (contexto, sem chamada do front)

```
Cliente → WhatsApp → Evolution API → POST /webhooks/whatsapp
   → assistente (Mastra) lista serviços/preços/horários, valida disponibilidade,
     calcula preço pelas respostas, cria Customer (se novo) + Appointment(scheduled) + Answers
   → resposta enviada de volta ao cliente pelo WhatsApp
```

O front enxerga o resultado ao recarregar `appointments`/`customers` (não há push/WebSocket; use polling ou refetch ao focar a aba).

---

## 8. Rotas que o front **não** deve chamar

| Rota                                    | Motivo                                                                                                                                                                              |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /webhooks/whatsapp`               | Uso exclusivo da Evolution API; exige header `x-webhook-secret` (`401` texto puro sem ele). Responde `{ "status": "accepted" \| "ignored" }` imediatamente e processa em background |
| `/api/agents/*`, demais rotas do Mastra | Infra interna do assistente; sem autenticação do projeto (ver aviso de segurança)                                                                                                   |

---

## 9. Variáveis de ambiente que afetam o front

| Variável                                    | Impacto                                                                                                                                                                                  |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TRUSTED_ORIGINS`                           | Origens autorizadas (CORS + `callbackURL`). Inclua a URL do front em cada ambiente                                                                                                       |
| `BETTER_AUTH_URL`                           | URL pública da API (base dos links enviados por e-mail e do callback do Google)                                                                                                          |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Login Google. Redirect URI no console Google: `{BETTER_AUTH_URL}/api/auth/callback/google`                                                                                               |
| `EMAIL_FROM` / `RESEND_API_KEY`             | Remetente dos e-mails. Com o remetente de sandbox (`onboarding@resend.dev`) só chega e-mail para o dono da conta Resend — cadastros de teste com outros e-mails **não receberão** o link |

---

## 10. Checklist de implementação do front

- [ ] Cliente HTTP com `credentials: 'include'` e interceptor: `401` → login (cuidado: corpo é texto).
- [ ] `getSession` no boot; guarda de rotas.
- [ ] Telas: cadastro, "verifique e-mail", login (senha + Google), esqueci/redefinir senha, tratamento de `?error=` nos callbacks.
- [ ] Onboarding (perfil → WhatsApp → serviço → agenda).
- [ ] Tela de conexão WhatsApp com polling de status.
- [ ] CRUDs: clientes, serviços (+ agenda, perguntas, opções), agendamentos (+ respostas).
- [ ] Máscaras/validações de telefone (`^[1-9]\d{9,14}$`), dinheiro em centavos, horas `HH:mm`.
- [ ] Mapeamento de mensagens de erro (inglês → i18n) e uso de `issues[].path` nos formulários.
- [ ] Confirmação forte para `DELETE /users/me` e exclusões em cascata (serviço, pergunta).
- [ ] Tratar `409` (telefone duplicado, horário ocupado, cliente com agendamentos) com mensagens amigáveis (seção 6).
