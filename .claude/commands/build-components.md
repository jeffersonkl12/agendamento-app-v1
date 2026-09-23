---
description: >
  DEPRECATED. Fase absorvida pelo /build-page Passo 1 (Batch 0 - Components serial).
  Nao invocar diretamente. Este comando existe so como redirect.
argument-hint: <page-name>
---

# /build-components — DEPRECATED

Fase absorvida pelo `/build-page` Passo 1 (Batch 0 — Components serial).

**Não invocar diretamente.** Os `component-builder` são despachados serialmente pelo orquestrador `/build-page` **antes** das sections rodarem em paralelo. Esse temporal slicing resolve a race condition que justificava a fase 3 separada — não há mais janela de escrita compartilhada entre subagentes.

## Por que foi absorvido

- **Race condition já resolvida** sem precisar de fase separada: components implementados serial no Batch 0 do `/build-page` antes do Batch 1 paralelo de sections. Sem janela de escrita compartilhada.
- **Lint/build único no fim** (`/build-page` Passo 4) elimina retrabalho de lintar componente isoladamente.
- **Evolução mid-build** (`componentes_evolucao_pedida` retornado por section-builder) re-dispara `component-builder` em modo `update` no próprio `/build-page`, sem precisar de comando separado.

## Migração

Toda a lógica vive agora em `.claude/commands/build-page.md` Passo 1 (Batch 0). Consultar lá:
- Filtro de specs com `status: proposto`
- Gate humano opcional de candidatos inline (`usos_contados < 2`)
- Topological sort por `depende_de`
- Despachar `component-builder` serial 1×1
- Modo `update` pra evolução mid-build

## Referências

- Plano de execução desta migração: `.claude/plans/eu-t-achando-que-cryptic-cascade.md` Decisão D6 + D9
- Orquestrador atual: `.claude/commands/build-page.md`
- Subagente: `.claude/agents/component-builder/AGENT.md`
