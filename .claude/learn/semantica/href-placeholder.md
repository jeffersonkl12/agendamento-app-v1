---
title: href="#" proibido — usar /TODO
date: 2026-04-07
category: semantica
tags: [links, placeholders, semantics]
recurrence: alta
scope: generic
related: []
sources: []
supersedes: []
superseded_by: []
rules_ref: ["RULES.md#R13"]
origin: Wallet / botão "Exportar extrato"
---

# href="#" proibido — usar /TODO

**Erro:** links/botões com `href="#"` placeholder que vão pra produção.

```vue
<!-- ❌ -->
<a href="#">Baixar PDF</a>
```

**Correção:** usar `href="/TODO"` com comentário — gera 404 óbvio e é buscável. Navegação interna real usa `RouterLink` (R13), não `<a>`.

```vue
<!-- ✅ -->
<a href="/TODO"><!-- TODO: URL real do PDF -->Baixar PDF</a>
```

**Por quê:** `#` faz scroll-to-top silencioso e passa despercebido em review. `/TODO` quebra explicitamente em runtime e é fácil de grepar.
