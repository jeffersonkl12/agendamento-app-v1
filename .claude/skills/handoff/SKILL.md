---
name: handoff
description: Compacta a conversa atual em um documento de handoff (passagem de bastão) para outro agente continuar o trabalho. Use quando precisar transferir contexto entre sessões ou agentes.
argument-hint: "Para que a próxima sessão será usada?"
---

Escreva um documento de handoff resumindo a conversa atual para que um agente novo (blank-slate) consiga continuar o trabalho. Salve em um caminho gerado por `mktemp -t handoff-XXXXXX.md` (leia o arquivo antes de escrever nele).

Sugira as skills que devem ser usadas, se houver, pela próxima sessão.

Não duplique conteúdo já capturado em outros artefatos (PRDs, planos, ADRs, issues, commits, diffs). Referencie por caminho ou URL.

Se o usuario passou argumentos, trate-os como descrição do foco da próxima sessão e adapte o documento de acordo.
