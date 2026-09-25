# API do Painel do Prestador — Rotas, Regras e Fluxos

Guia de consumo da API pelo **dashboard de gerenciamento** (painel do prestador). Descreve quais rotas existem, o que cada uma espera e devolve, as regras de negócio que o servidor aplica e a ordem correta de uso.

> Escopo: apenas o painel. O fluxo do bot de WhatsApp não passa por estas rotas e será documentado à parte.
> Regras de domínio completas (com os códigos `RN-*` citados aqui): [`rules-dominion.md`](./rules-dominion.md).

---

## Sumário

1. [Convenções gerais](#1-convenções-gerais)
2. [Autenticação](#2-autenticação)
3. [Onboarding: ordem correta de configuração](#3-onboarding-ordem-correta-de-configuração)
4. [Perfil do negócio](#4-perfil-do-negócio--business-profiles)
5. [Assinatura](#5-assinatura--subscriptions)
6. [Modelos de atendimento](#6-modelos-de-atendimento--service-templates)
7. [Perguntas do modelo](#7-perguntas-do-modelo)
8. [Configuração de agendamento](#8-configuração-de-agendamento--scheduling-configs)
9. [Clientes](#9-clientes--customers)
10. [Agendamentos](#10-agendamentos--appointments)
11. [Telas do painel → rotas](#11-telas-do-painel--rotas)
12. [Limitações atuais e pontos de atenção](#12-limitações-atuais-e-pontos-de-atenção)

---

## 1. Convenções gerais

### 1.1 Formato

| Item              | Convenção                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Corpo             | JSON (`Content-Type: application/json`)                                                    |
| IDs               | UUID v4. Qualquer `:id` que não seja UUID válido retorna `400`                             |
| Dinheiro          | **Inteiro em centavos** (`R$ 49,90` → `4990`). O front converte para exibição e para envio |
| Data              | `YYYY-MM-DD`                                                                               |
| Horário           | Envio: `HH:MM` (ex.: `"09:00"`). Retorno do banco: `HH:MM:SS` (ex.: `"09:00:00"`)          |
| Timestamps        | `createdAt` / `updatedAt` em ISO 8601 com fuso                                             |
| Fuso do prestador | `timezone` da configuração de agendamento (padrão `America/Sao_Paulo`)                     |
| Enums             | Sempre em **MAIÚSCULAS** (`AWAITING`, `SINGLE`, `ACTIVE`...)                               |

### 1.2 Multi-tenant (isolamento)

Nenhuma rota recebe `businessOwnerId`: o dono é sempre **o usuário da sessão**. Recursos de outro prestador se comportam como inexistentes (`404`), nunca `403`. Não envie `businessOwnerId` no corpo — ele é ignorado/rejeitado.

### 1.3 Rotas `/me`

Recursos **1:1 com o prestador** (perfil, assinatura, configuração de agendamento) não são acessados por id, e sim por `/me`. Padrão de uso:

1. `GET /<recurso>/me`
2. `404` → o recurso ainda não existe → mostrar formulário de criação e usar `POST /<recurso>`
3. `200` → edição via `PATCH /<recurso>/me`

> ⚠️ `POST` só pode ser feito **uma vez** por prestador. Um segundo `POST` hoje devolve `500` (ver §12).

### 1.4 Erros

Todos os erros têm o formato `{ "error": string }`. Erros de validação de formato trazem também `issues`.

| Status | Quando                                                                      | Corpo                                             |
| ------ | --------------------------------------------------------------------------- | ------------------------------------------------- |
| `400`  | Corpo/param fora do formato (tipo errado, campo faltando, UUID inválido)    | `{ "error": "Invalid request data", "issues": [...] }` |
| `400`  | Regra de negócio violada (ex.: nome vazio, fim antes do início)             | `{ "error": "<mensagem>" }`                       |
| `401`  | Sem sessão válida                                                           | texto `Authentication required`                   |
| `404`  | Recurso não existe **ou pertence a outro prestador**                        | `{ "error": "<mensagem>" }`                       |
| `409`  | Conflito de estado (ex.: confirmar agendamento já cancelado)                | `{ "error": "<mensagem>" }`                       |
| `500`  | Erro inesperado                                                             | `{ "error": "Internal server error" }`            |

`issues` segue o formato do Zod: cada item tem `path` (campo) e `message`, útil para marcar o campo errado no formulário. As mensagens vêm em inglês — o front deve traduzir/mapear, não exibir cru.

---

## 2. Autenticação

Feita com **Better Auth**, montado em `/api/auth/*`. A sessão é mantida por **cookie** — o front deve enviar requisições com credenciais (`credentials: "include"` no `fetch`, `withCredentials: true` no axios). Recomendação: usar o client oficial `better-auth/react` (ou equivalente) apontando para a URL da API, em vez de chamar os endpoints manualmente.

| Ação                     | Endpoint Better Auth                          | Observações                                                                 |
| ------------------------ | --------------------------------------------- | --------------------------------------------------------------------------- |
| Cadastro por e-mail      | `POST /api/auth/sign-up/email`                | `name`, `email`, `password`. Não loga automaticamente                        |
| Login por e-mail         | `POST /api/auth/sign-in/email`                | Falha se o e-mail não estiver verificado                                    |
| Login com Google         | `POST /api/auth/sign-in/social` (`provider: "google"`) | Cria a conta no primeiro acesso, sem senha local                   |
| Sessão atual             | `GET /api/auth/get-session`                   | `null` quando deslogado                                                     |
| Logout                   | `POST /api/auth/sign-out`                     |                                                                             |
| Esqueci a senha          | `POST /api/auth/request-password-reset`       | Envia link por e-mail                                                       |
| Redefinir senha          | `POST /api/auth/reset-password`               | Encerra todas as sessões abertas                                            |
| Verificar e-mail         | Link enviado por e-mail                       | Enviado no cadastro e reenviado a cada tentativa de login não verificada    |

### Regras que afetam o front

- **Verificação de e-mail obrigatória.** Após o cadastro o usuário **não** está logado; mostre uma tela "verifique seu e-mail". Tentar logar sem verificar falha e dispara um novo e-mail.
- **Confirmação de senha** (RN-AU02) é responsabilidade do front: a API não recebe o campo "confirmar senha".
- **Recuperação de senha** (RN-AU04): mostre sempre a mesma mensagem de sucesso, exista ou não o e-mail.
- **Logout** (RN-AU05) deve pedir confirmação na UI antes de chamar a rota.
- **Toda rota do painel exige sessão** (RN-AU06). Um `401` em qualquer chamada deve redirecionar para o login.
- **Rate limit** está ativo nos endpoints de autenticação; trate `429` com uma mensagem de "tente novamente em instantes".
- Campos extras do usuário: `phoneNumber` pode ser enviado no cadastro; `role` e `isActive` são controlados pelo servidor.

---

## 3. Onboarding: ordem correta de configuração

O bot só consegue agendar quando **todas** as peças abaixo existem (RN-C02, RN-C03). O painel deve guiar o prestador nesta ordem:

```
1. Cadastro + verificação de e-mail + login
2. Perfil do negócio          POST /business-profiles
3. Modelo de atendimento      POST /service-templates
4. Perguntas do modelo (≥ 1)  POST /service-templates/:templateId/questions
5. Configuração de agenda     POST /scheduling-configs   (com activeTemplateId do passo 3)
```

**Checklist de "bot pronto"** (o painel pode exibir como status):

| Condição                                              | Como verificar                                            |
| ----------------------------------------------------- | --------------------------------------------------------- |
| Perfil do negócio existe                              | `GET /business-profiles/me` → `200`                       |
| Configuração de agenda existe                         | `GET /scheduling-configs/me` → `200`                      |
| Há um modelo em uso                                   | `activeTemplateId` da configuração não é `null`           |
| Modelo em uso tem ao menos uma pergunta               | `GET /service-templates/:activeTemplateId/questions` → lista não vazia |
| Ao menos um dia da semana habilitado                  | Garantido pelo servidor ao salvar a configuração          |

Se qualquer item falhar, o bot responde ao cliente que o agendamento está indisponível.

---

## 4. Perfil do negócio — `/business-profiles`

Identidade pública do prestador, usada pelo bot ao falar com o cliente ("Olá, Studio Bella"). Relação **1:1** com o prestador.

### `POST /business-profiles` — criar perfil

```json
{ "businessName": "Studio Bella", "photoUrl": "https://..." }
```

| Campo          | Tipo            | Regra                                   |
| -------------- | --------------- | --------------------------------------- |
| `businessName` | string (≤ 255)  | Obrigatório; não pode ser só espaços    |
| `photoUrl`     | string \| null  | Opcional                                |

→ `201` com o perfil criado.

### `GET /business-profiles/me` — perfil do prestador logado

→ `200` com o perfil · `404` se ainda não foi criado.

### `PATCH /business-profiles/me` — editar perfil

Aceita apenas `businessName` e/ou `photoUrl` (RN-PF01). `businessName` vazio → `400`. `photoUrl: null` remove a foto.

### Resposta

```json
{
  "id": "uuid",
  "businessOwnerId": "uuid",
  "businessName": "Studio Bella",
  "photoUrl": null,
  "whatsappInstanceName": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

- `whatsappInstanceName` é **somente leitura**: atribuído quando o número de WhatsApp é provisionado, nunca pelo painel. `null` = WhatsApp ainda não conectado.
- Sem foto, o painel exibe as **iniciais** derivadas de `businessName`.
- A API **não faz upload de imagem**: `photoUrl` deve ser uma URL já hospedada.

---

## 5. Assinatura — `/subscriptions`

Contrato do prestador com a plataforma. Relação **1:1**.

| Rota                       | Descrição                                   |
| -------------------------- | ------------------------------------------- |
| `GET /subscriptions/me`    | Plano atual → `200` ou `404` se não existir |
| `POST /subscriptions`      | Cria a assinatura                           |
| `PATCH /subscriptions/me`  | Altera `planName`, `price`, `renewalDate`, `status` |

Corpo de criação:

```json
{ "planName": "Plano Essencial", "price": 4990, "renewalDate": "2026-10-25", "status": "ACTIVE" }
```

| Campo         | Tipo                                     | Regra                         |
| ------------- | ---------------------------------------- | ----------------------------- |
| `planName`    | string                                   | Obrigatório                   |
| `price`       | inteiro (centavos)                       | Obrigatório                   |
| `renewalDate` | `YYYY-MM-DD`                             | Obrigatório                   |
| `status`      | `ACTIVE` \| `PAST_DUE` \| `CANCELED`     | Opcional, padrão `ACTIVE`     |

**Uso correto no painel:** apenas **leitura** (`GET /subscriptions/me`) na tela de perfil — plano, preço e data de renovação (RN-PF02). Criação e alteração pertencem ao fluxo de cobrança, não ao prestador (ver §12).

Significado do status (RN-AS02/RN-AS03): `ACTIVE` = tudo funciona; `PAST_DUE` / `CANCELED` = o bot deve parar de aceitar novos agendamentos, mas o painel continua acessível para consulta. O painel deve exibir um aviso quando o status não for `ACTIVE`.

---

## 6. Modelos de atendimento — `/service-templates`

Um modelo é o "formulário" que o bot aplica ao cliente: **valor base + lista ordenada de perguntas**. O prestador pode ter vários modelos, mas só **um fica em uso** pelo bot (o `activeTemplateId` da configuração de agendamento).

| Rota                          | Descrição                                   | Sucesso |
| ----------------------------- | ------------------------------------------- | ------- |
| `POST /service-templates`     | Cria modelo                                  | `201`   |
| `GET /service-templates`      | Lista modelos do prestador (sem perguntas)   | `200`   |
| `GET /service-templates/:id`  | Um modelo (sem perguntas)                    | `200`   |
| `PATCH /service-templates/:id`| Edita `name` e/ou `basePrice`                | `200`   |
| `DELETE /service-templates/:id`| Exclui modelo                               | `204`   |

Corpo (criação e edição):

```json
{ "name": "Dia de Spa Relax", "basePrice": 1000 }
```

### Resposta

```json
{
  "id": "uuid",
  "businessOwnerId": "uuid",
  "name": "Dia de Spa Relax",
  "basePrice": 1000,
  "version": 3,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Regras

- **Nome** obrigatório e não vazio na criação. Na edição, **nome vazio é ignorado** e o anterior é mantido (não dá erro).
- **Valor base** ≥ 0; omitido = `0` (RN-V01, RN-V03).
- **Versão** (RN-M03, RN-API04): toda edição efetiva de nome/valor base incrementa `version`. É somente leitura. Serve para garantir que conversas em andamento e agendamentos já criados continuem com a versão em que começaram — editar o modelo **nunca** altera agendamentos existentes.
- `PATCH` sem mudança real devolve o modelo inalterado (sem subir versão).
- Um modelo **sem perguntas é um rascunho válido**, mas não pode ser usado pelo bot (RN-M04).
- As perguntas **não** vêm junto no `GET`; use a rota de perguntas (§7).

### Exclusão

- Excluir um modelo remove também todas as suas perguntas e opções.
- **Não é possível excluir** um modelo que esteja em uso na configuração de agendamento ou que já tenha agendamentos. Hoje isso retorna `500` (ver §12). O painel deve:
  - bloquear o botão "excluir" quando `template.id === schedulingConfig.activeTemplateId`;
  - pedir confirmação antes de excluir;
  - tratar erro com uma mensagem do tipo "este modelo já foi usado em agendamentos e não pode ser excluído".

---

## 7. Perguntas do modelo

Perguntas pertencem a um modelo. São criadas/listadas pelo modelo e editadas/excluídas pelo próprio id.

| Rota                                            | Descrição                               | Sucesso |
| ----------------------------------------------- | --------------------------------------- | ------- |
| `POST /service-templates/:templateId/questions` | Cria pergunta no modelo                 | `201`   |
| `GET /service-templates/:templateId/questions`  | Lista perguntas com opções, por `order` | `200`   |
| `PATCH /questions/:id`                          | Edita pergunta (parcial)                | `200`   |
| `DELETE /questions/:id`                         | Exclui pergunta                         | `204`   |

Se o modelo/pergunta não existir ou for de outro prestador → `404`.

### 7.1 Tipos de pergunta

| `type`    | O cliente responde       | Opções                                   | Preço                                 |
| --------- | ------------------------ | ---------------------------------------- | ------------------------------------- |
| `TEXT`    | Texto livre              | Nenhuma                                  | Nunca gera valor                      |
| `SINGLE`  | Exatamente 1 opção       | ≥ 1 com rótulo (obrigatório)             | Valor da opção escolhida              |
| `MULTI`   | 1+ opções                | ≥ 1 com rótulo (obrigatório)             | Soma das opções escolhidas            |
| `NUMBER`  | Quantidade inteira       | Nenhuma                                  | `quantidade × unitPrice`              |
| `BOOLEAN` | Sim / Não                | Fixas "Sim" e "Não", geradas pelo servidor | Valor da resposta escolhida         |

### 7.2 Corpo de criação

```json
{
  "title": "Tipo de tratamento desejado",
  "type": "SINGLE",
  "required": true,
  "order": 1,
  "options": [
    { "label": "Massagem relaxante", "price": 8000 },
    { "label": "Limpeza de pele", "price": 6000 }
  ]
}
```

| Campo           | Tipo                                   | Quando usar                                          |
| --------------- | -------------------------------------- | ---------------------------------------------------- |
| `title`         | string                                 | Sempre. Obrigatório, não vazio (é aparado)           |
| `type`          | `TEXT`\|`SINGLE`\|`MULTI`\|`NUMBER`\|`BOOLEAN` | Sempre                                       |
| `order`         | inteiro                                | Sempre. Posição na conversa do bot                   |
| `required`      | boolean                                | Opcional, padrão `true`                              |
| `options`       | `[{ label, price? }]`                  | Só `SINGLE` / `MULTI`                                |
| `booleanPrices` | `{ yes?: centavos, no?: centavos }`    | Só `BOOLEAN`                                         |
| `unitPrice`     | inteiro (centavos)                     | Só `NUMBER`                                          |

Exemplos dos demais tipos:

```json
{ "title": "Quer incluir massagem nos pés?", "type": "BOOLEAN", "order": 2, "booleanPrices": { "yes": 2000, "no": 0 } }
{ "title": "Alguma observação?", "type": "TEXT", "order": 3, "required": false }
{ "title": "Quantas pessoas?", "type": "NUMBER", "order": 4, "required": false, "unitPrice": 1500 }
```

### 7.3 Regras de gravação (o servidor normaliza, não confie no que foi enviado)

- **RN-P01** `title` vazio → `400`.
- **RN-P02** `SINGLE`/`MULTI` sem nenhuma opção com rótulo → `400`.
- **RN-P03** Opções com rótulo vazio são **descartadas silenciosamente**. A ordem das opções é a ordem do array.
- **RN-P04** `BOOLEAN` sempre fica com exatamente "Sim" e "Não"; `options` enviado é ignorado; só os preços (`booleanPrices`) são editáveis. A UI não deve permitir editar rótulo nem remover essas opções.
- **RN-P05** `unitPrice` só é gravado em `NUMBER`; nos outros tipos vira `null`.
- `options` enviado para `TEXT`/`NUMBER` é ignorado.
- **Sempre use a resposta da API** para atualizar a tela, pois ela reflete a normalização.

### 7.4 Edição (`PATCH /questions/:id`)

Todos os campos são opcionais. Regras de preservação de opções (RN-P06):

| Situação                                          | O que acontece com as opções                              |
| ------------------------------------------------- | --------------------------------------------------------- |
| Edita só `title`, `order`, `required`             | Opções **preservadas** intactas                           |
| Envia `options` (ou `booleanPrices`)              | Opções **substituídas** pela lista enviada                |
| Troca de tipo para `TEXT` / `NUMBER`              | Opções removidas                                          |
| Troca de tipo para `BOOLEAN`                      | Viram "Sim"/"Não" (com `booleanPrices`, se enviados)      |
| Troca de `BOOLEAN` → `SINGLE`/`MULTI`             | "Sim"/"Não" descartadas → **precisa enviar `options`**, senão `400` |
| Troca entre `SINGLE` ↔ `MULTI`                    | Precisa enviar `options`, senão `400`                     |

> Importante: substituir opções gera **novos ids** de opção. Não guarde ids de opção no front entre edições.

**Editar opções = enviar a lista completa.** Não existe rota para adicionar/remover uma opção isolada; o front mantém a lista localmente e envia inteira. Pela RN-P07, a UI não deve permitir remover a última opção de uma pergunta de escolha.

### 7.5 Ordenação

- A lista vem ordenada por `order` crescente; o bot pergunta nessa ordem.
- Reordenar (drag-and-drop) = um `PATCH { "order": n }` por pergunta afetada. O servidor não reindexa nem impede `order` duplicado — mantenha a sequência consistente no front (ex.: 1, 2, 3...).

### 7.6 Exclusão

`DELETE /questions/:id` remove a pergunta e suas opções. Deve pedir confirmação (RN-M02). Agendamentos antigos **não** são afetados, porque guardam uma cópia das respostas (RN-S02). Se for a última pergunta do modelo em uso, o bot para de agendar (RN-C03) — avise o prestador.

### Resposta (pergunta)

```json
{
  "id": "uuid",
  "templateId": "uuid",
  "title": "Quer incluir massagem nos pés?",
  "type": "BOOLEAN",
  "required": true,
  "order": 2,
  "unitPrice": null,
  "options": [
    { "id": "uuid", "questionId": "uuid", "label": "Sim", "price": 2000, "order": 0, "createdAt": "...", "updatedAt": "..." },
    { "id": "uuid", "questionId": "uuid", "label": "Não", "price": null, "order": 1, "createdAt": "...", "updatedAt": "..." }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

`price: null` = sem custo extra (equivale a 0).

### 7.7 Pré-visualização de preço no painel

A fórmula que o servidor usa ao agendar (§5 das regras) pode ser replicada no front para um "simulador" na tela do modelo:

```
total = basePrice
      + Σ price das opções escolhidas (SINGLE, MULTI, BOOLEAN)
      + Σ quantidade × unitPrice (NUMBER)
```

`TEXT` e perguntas opcionais puladas não somam nada. É apenas ilustrativo: o valor real é sempre recalculado pelo servidor no momento do agendamento.

---

## 8. Configuração de agendamento — `/scheduling-configs`

Define **quando** o bot oferece horários e **qual modelo** ele usa. Relação **1:1**. Salvar publica imediatamente para o bot (RN-C05, RN-CF03).

| Rota                          | Descrição                               |
| ----------------------------- | --------------------------------------- |
| `GET /scheduling-configs/me`  | Configuração atual → `200` ou `404`     |
| `POST /scheduling-configs`    | Cria                                     |
| `PATCH /scheduling-configs/me`| Edita (parcial)                          |

Corpo:

```json
{
  "mondayEnabled": true,
  "tuesdayEnabled": false,
  "wednesdayEnabled": true,
  "thursdayEnabled": false,
  "fridayEnabled": true,
  "saturdayEnabled": false,
  "sundayEnabled": false,
  "startTime": "09:00",
  "endTime": "18:00",
  "intervalMinutes": 30,
  "activeTemplateId": "uuid-do-modelo",
  "timezone": "America/Sao_Paulo"
}
```

| Campo               | Regra                                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| `<dia>Enabled`      | boolean, padrão `false`. **Pelo menos um** precisa ser `true` → senão `400` |
| `startTime`         | Obrigatório na criação. `HH:MM`                                        |
| `endTime`           | Obrigatório na criação. Deve ser **maior** que `startTime` → senão `400` |
| `intervalMinutes`   | Padrão `30`. Use apenas 15, 30, 45 ou 60                               |
| `activeTemplateId`  | Opcional/`null`. Id de um modelo **do próprio prestador** com ≥ 1 pergunta |
| `timezone`          | Padrão `America/Sao_Paulo`. Nome IANA                                  |

### Regras

- No `PATCH`, a validação é feita sobre **o resultado final** (valores atuais + enviados). Ex.: desligar o único dia ativo → `400`.
- **Restrições de UI** (o servidor ainda não valida — ver §12): `startTime`/`endTime` entre 06:00 e 22:00 em passos de 30 min; `intervalMinutes` ∈ {15, 30, 45, 60}. Use selects, não campo livre.
- **Modelo em uso** (RN-CF02): o seletor deve listar apenas `GET /service-templates`. Mostre alerta se o modelo escolhido não tiver perguntas (o bot não vai funcionar).
- **RN-C04:** alterar dias/horários **não cancela** agendamentos já existentes fora da nova janela. Eles continuam válidos; o prestador decide o que fazer. Vale avisar isso na tela de salvar.
- `activeTemplateId: null` desliga o bot (sem modelo em uso).

### Como os horários (slots) são gerados

Útil para o calendário do painel (RN-D01…D06):

- Só dias habilitados têm horários.
- Slots de `startTime` até **antes** de `endTime`, a cada `intervalMinutes`. Ex.: 09:00–18:00 / 30 min → 09:00, 09:30, …, 17:30 (18 slots).
- Um slot comporta **um** agendamento. Agendamentos `AWAITING` e `CONFIRMED` ocupam o slot; `CANCELED` libera.
- Horários passados (no fuso do prestador) nunca são oferecidos.

> Não existe rota de "slots disponíveis" para o painel. Se o calendário precisar mostrar horários livres, calcule no front com a configuração + lista de agendamentos.

---

## 9. Clientes — `/customers`

Cliente é quem agenda pelo WhatsApp; **não tem conta**. É identificado pelo telefone, **por prestador** (o mesmo número em dois prestadores são dois clientes distintos). Normalmente é criado pelo bot na primeira conversa.

| Rota                    | Descrição                                         | Sucesso |
| ----------------------- | ------------------------------------------------- | ------- |
| `GET /customers`        | Lista clientes do prestador                        | `200`   |
| `PATCH /customers/:id`  | Edita apenas `name`                                | `200`   |
| `POST /customers`       | Busca-ou-cria por telefone (uso do bot)            | `201`   |

### Resposta

```json
{ "id": "uuid", "businessOwnerId": "uuid", "phoneNumber": "5511999999999", "name": "Maria", "createdAt": "...", "updatedAt": "..." }
```

### Regras

- `name` pode ser `null` (cliente que nunca informou nome) — exiba o telefone formatado nesse caso.
- `phoneNumber` é imutável pelo painel.
- `POST /customers` **não é um cadastro manual**: se o telefone já existe, devolve o cliente existente (e atualiza o nome se vier diferente), sempre com `201`. O painel não precisa desta rota no escopo atual (RN-A04: o prestador não cria agendamentos).
- **Uso principal no painel:** montar um mapa `customerId → cliente` para exibir nome/telefone nos agendamentos (ver §10).

---

## 10. Agendamentos — `/appointments`

Reserva de um horário por um cliente, com as respostas e o valor **congelados** no momento da criação. No escopo atual **quem cria é o bot**; o painel **consulta, confirma e cancela**.

| Rota                              | Descrição                                     | Sucesso |
| --------------------------------- | --------------------------------------------- | ------- |
| `GET /appointments`               | Lista todos os agendamentos (sem respostas)   | `200`   |
| `GET /appointments/:id`           | Detalhe com respostas                          | `200`   |
| `POST /appointments/:id/cancel`   | Cancela                                        | `200`   |
| `POST /appointments/:id/confirm`  | Confirma                                       | `200`   |
| `POST /appointments`              | Cria (uso do bot — **não usar no painel**)     | `201`   |

### 10.1 Ciclo de vida

```
[criado pelo bot] → AWAITING ──(cliente confirma)──→ CONFIRMED
                       │                                 │
                       ├─ expira (30 min) ─→ CANCELED ←──┤
                       └─ prestador cancela → CANCELED ←─┘ prestador cancela
```

| Status      | Significado                                       | Ocupa horário | Conta no faturamento |
| ----------- | ------------------------------------------------- | ------------- | -------------------- |
| `AWAITING`  | Criado, aguardando o cliente confirmar no bot      | Sim           | Não                  |
| `CONFIRMED` | Cliente confirmou                                  | Sim           | Sim                  |
| `CANCELED`  | Cancelado pelo prestador, pelo cliente ou expirado | Não           | Não                  |

Transições permitidas pela API:

| Ação       | Status de origem permitido | Senão       |
| ---------- | -------------------------- | ----------- |
| `confirm`  | `AWAITING`                 | `409`       |
| `cancel`   | `AWAITING` ou `CONFIRMED`  | `409` (já cancelado) |

- **Expiração automática:** um job no servidor roda a cada 5 min e cancela todo `AWAITING` criado há mais de **30 min**. Consequência para o front: um agendamento pode mudar de `AWAITING` para `CANCELED` sem ação do prestador — recarregue a lista periodicamente/ao focar a tela e trate `409` ao tentar agir sobre ele.
- **Cancelar libera o horário imediatamente** (RN-A05).
- **Cancelamento exige confirmação explícita** na UI (RN-A01).
- `confirm` existe para o fluxo do bot (o cliente é quem confirma). No painel, só exponha se o negócio decidir permitir que o prestador confirme manualmente.
- O cliente **ainda não é notificado** pelo WhatsApp quando o prestador cancela (RN-A02 pendente) — ver §12.

### 10.2 Lista — `GET /appointments`

```json
[
  {
    "id": "uuid",
    "businessOwnerId": "uuid",
    "customerId": "uuid",
    "templateId": "uuid",
    "templateVersion": 3,
    "date": "2026-09-30",
    "startTime": "14:30:00",
    "totalValue": 21000,
    "status": "AWAITING",
    "origin": "WHATSAPP",
    "idempotencyKey": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

A lista **não tem filtro, paginação nem ordenação garantida**, e **não traz respostas nem dados do cliente**. O front deve:

- **Ordenar** por `date` + `startTime`.
- **Resolver o cliente** cruzando `customerId` com `GET /customers`.
- **Filtrar** por status/período localmente (ex.: esconder `CANCELED` da agenda — RN-A03).
- Carregar o detalhe (`GET /appointments/:id`) só quando o usuário abrir um agendamento.

### 10.3 Detalhe — `GET /appointments/:id`

Igual ao item da lista, mais `answers`:

```json
{
  "...": "campos do agendamento",
  "answers": [
    { "id": "uuid", "appointmentId": "uuid", "questionTitle": "Tipo de tratamento desejado", "questionType": "SINGLE", "answer": "Day spa completo", "appliedPrice": 15000, "order": 1, "createdAt": "...", "updatedAt": "..." },
    { "id": "uuid", "appointmentId": "uuid", "questionTitle": "Quantas pessoas?", "questionType": "NUMBER", "answer": "2", "appliedPrice": 3000, "order": 4, "createdAt": "...", "updatedAt": "..." }
  ]
}
```

- `answers` é um **snapshot** (RN-S01): título, tipo, resposta e valor aplicado no momento do agendamento. Exiba estes dados, **não** as perguntas atuais do modelo — o modelo pode ter mudado ou sido excluído.
- Ordene `answers` por `order`.
- Em `MULTI`, `answer` traz os rótulos separados por `", "`.
- Perguntas opcionais que o cliente pulou **não aparecem**.
- **Detalhamento de valor:** `totalValue − Σ appliedPrice` = valor base do modelo naquela versão.
- **"Serviço"** exibido em resumos (RN-S03): use a resposta da primeira pergunta `SINGLE` (menor `order`) do snapshot.

---

## 11. Telas do painel → rotas

| Tela                         | Carregamento                                                                                       | Ações                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Login / Cadastro**         | `GET /api/auth/get-session`                                                                        | Endpoints do Better Auth (§2)                                                                 |
| **Onboarding**               | `GET /business-profiles/me`, `GET /scheduling-configs/me`, `GET /service-templates`                | `POST` na ordem do §3                                                                         |
| **Início (resumo)**          | `GET /appointments`, `GET /customers`, `GET /scheduling-configs/me` (fuso)                         | —                                                                                             |
| **Agenda (calendário/lista)**| `GET /appointments`, `GET /customers`, `GET /scheduling-configs/me`                                 | Abrir detalhe                                                                                 |
| **Detalhe do agendamento**   | `GET /appointments/:id` (+ cliente do mapa)                                                         | `POST /appointments/:id/cancel`                                                               |
| **Modelos**                  | `GET /service-templates`, `GET /scheduling-configs/me` (para marcar o "em uso")                     | `POST`/`PATCH`/`DELETE /service-templates`                                                    |
| **Editor de modelo**         | `GET /service-templates/:id`, `GET /service-templates/:id/questions`                                | `PATCH` modelo; `POST`/`PATCH`/`DELETE` perguntas                                             |
| **Configurar agendamentos**  | `GET /scheduling-configs/me`, `GET /service-templates`                                              | `POST /scheduling-configs` ou `PATCH /scheduling-configs/me`                                  |
| **Perfil**                   | `GET /business-profiles/me`, `GET /subscriptions/me`, `GET /api/auth/get-session`                   | `PATCH /business-profiles/me`; logout                                                         |

### Cálculos do Início (feitos no front)

A API não expõe métricas; calcule sobre `GET /appointments` (RN-I01…I03):

| Indicador            | Cálculo                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------- |
| Faturamento          | Σ `totalValue` dos `CONFIRMED` no período                                                 |
| Agendamentos         | Quantidade de `CONFIRMED` no período                                                      |
| Ticket médio         | Faturamento ÷ Agendamentos (0 se não houver)                                              |
| "Este mês"           | Mês corrente **no fuso do prestador** (`timezone` da configuração), não no fuso do navegador |
| "Total"              | Todos os agendamentos                                                                     |
| Próximos agendamentos| Os 3 próximos a partir de agora, sem `CANCELED`, ordenados por data/hora                  |

### Calendário (RN-G01…G07)

- Semana começa na **segunda-feira**.
- Estado de cada dia: **tem agendamentos** (há não cancelados na data) / **disponível sem agendamentos** (dia habilitado na configuração) / **sem atendimento** (dia desabilitado).
- Um dia desabilitado pode ter agendamentos antigos (RN-C04) — mostre-os mesmo assim.

---

## 12. Limitações atuais e pontos de atenção

Comportamentos do backend hoje que o front precisa contornar ou que ainda devem ser corrigidos no servidor:

| # | Situação                                                                                                          | Impacto no front / recomendação                                                            |
| - | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1 | **CORS e `trustedOrigins` não estão configurados.** Um painel em outra origem (ex.: `localhost:5173`) terá requisições e login bloqueados. | Configurar no backend antes da integração, ou servir o front pela mesma origem (proxy do dev server). |
| 2 | `POST` duplicado em perfil, assinatura ou configuração de agenda retorna `500` em vez de `409`.                    | Sempre `GET /me` antes; nunca fazer `POST` se já existe.                                    |
| 3 | Excluir modelo em uso ou já usado em agendamentos retorna `500` em vez de `409`.                                  | Bloquear na UI e tratar o erro com mensagem amigável.                                       |
| 4 | `activeTemplateId` não é validado ao salvar (pode apontar para modelo inexistente, de outro prestador ou sem perguntas). | Só permitir escolha a partir de `GET /service-templates` e validar perguntas no front.     |
| 5 | `startTime`/`endTime` (06:00–22:00, passos de 30 min), `intervalMinutes` (15/30/45/60) e `timezone` não são validados no servidor. | Restringir via selects no front.                                                           |
| 6 | Assinatura pode ser criada/alterada (inclusive `status` e `price`) pelo próprio prestador.                         | Painel deve usar só `GET /subscriptions/me`. No backend, essas rotas deveriam sair do escopo do prestador. |
| 7 | `GET /appointments` sem filtro, ordenação, paginação ou dados do cliente.                                          | Filtrar/ordenar/juntar no front; vai precisar de filtros por período quando o volume crescer. |
| 8 | Editar perguntas **não** incrementa a `version` do modelo (só nome/valor base incrementam).                        | Sem impacto direto no painel; relevante para o bot (RN-M03).                                |
| 9 | Cancelamento pelo prestador ainda **não notifica** o cliente no WhatsApp (RN-A02).                                 | Avisar o prestador na confirmação de cancelamento enquanto não houver notificação.          |
| 10| `POST /appointments` confia no `totalValue` enviado e não valida o horário (viola RN-A04/RN-API03).                | Não usar no painel.                                                                         |
| 11| Mensagens de erro vêm em inglês.                                                                                  | Mapear por status/campo para textos em PT-BR.                                               |
