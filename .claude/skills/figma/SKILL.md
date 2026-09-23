---
name: figma
description: >
  Workflow de conversao Figma-to-code do projeto. Use quando: receber URL do Figma,
  "implementar do Figma", "converter design", "figma-to-code".
user-invocable: true
---

# Figma → Código

**Regras universais de código: ver `.claude/RULES.md`. Este arquivo ensina SÓ o workflow técnico.**

> **Para página inteira nova (5+ seções)**, prefira o workflow orquestrado em **3 fases CMS-first**:
> 1. `/build-prep <figma-url>` — gera manifesto + yaml schema Directus + assets + screenshots por seção (Partes A+B desta skill, automatizadas)
> 2. `/build-cms <page>` — cria coleções no Directus a partir do yaml + sobe seeds (texto literal e assets do Figma) + paridade R13-c + gera helpers em `src/lib/cms/{page}.js`
> 3. `/build-page <page>` — Batch 0 (`component-builder` serial em ordem topológica) + Batches 1-N (`section-builder` paralelo, Parte C desta skill) + lint/build única vez no fim
>
> Esta skill continua sendo a referência técnica subjacente — o `/build-prep` segue as Partes A+B,
> e cada `section-builder` segue a Parte C lendo o screenshot da seção como fonte primária visual. Use esta skill diretamente apenas para:
> - Refactor pontual de uma seção já existente
> - Implementação ad-hoc de 1-2 seções pequenas
> - Debug de problema específico em conversão Figma-to-code

## Pré-flight obrigatório (HARD FAIL)

Antes de gerar qualquer linha de código, os itens abaixo DEVEM estar resolvidos. Se algum falhar, ABORTAR e comunicar ao usuário.

- [ ] **Tokens lidos** — `get_variable_defs` executado; cores/typography/spacing disponíveis
- [ ] **Ícones extraídos** — se o design tem ícones, `/icon-extract` rodou e salvou SVGs em `public/icons.svg` ou `src/assets/icons/`
- [ ] **Imagens baixadas** — URLs dos image-fills extraídos e baixados pra `src/assets/images/{page}/`
- [ ] **Screenshot capturado** — ao menos 1 screenshot do frame principal como referência visual em `docs/figma/`. **Preferir REST API via `extract-screenshots.mjs`** (defaults: scale=1.5 + WebP); o MCP `get_screenshot` só retorna 1x e fica borrado

**Se ícones foram identificados no Figma mas `/icon-extract` NÃO rodou: PARE. Não gere código. Avise o usuário e rode `/icon-extract` primeiro.** Ícone inventado do Lucide/Material é o erro mais recorrente em conversão Figma-to-code e quebra a fidelidade visual.

### Parte A — Reconhecimento (ANTES de gerar qualquer código)

1. `get_metadata` → estrutura do arquivo (pages, frames, nodes principais)
2. `get_variable_defs` → extrair tokens (cores, tipografia, espaçamento)
3. Conferir `src/styles/tailwind.css` e `tailwind.config.js`:
   - Se token já existe, usar
   - Se NÃO existe, ADICIONAR (não gerar inline)
4. Registrar classes `text-{categoria}-{numero}` como plugin Tailwind (se faltarem). **Vocabulário e validação:** o sistema tipográfico do projeto está em `.claude/skills/pencil-design-rules/SKILL.md` → "3. Tipografia: Sistema Padronizado" (categorias Display/Headline/Title/Paragraph/Caps, steps de lineHeight 1.0–1.7, letterSpacing sempre definido). Capturar os valores **EXATOS** do text-style do Figma (fontSize, fontWeight, lineHeight, letterSpacing) e registrá-los na classe — o sistema serve pra nomear a categoria e conferir se o lineHeight cai num step esperado, **NUNCA pra arredondar valores do design** (fidelidade R1/R2 manda).
5. Se há ícones no design → **rodar `/icon-extract` AGORA** (ver pré-flight). O hook `check-icons.mjs` VAI bloquear qualquer Write/Edit que importe de lucide/heroicons/material/fontawesome — não insista.
6. **Screenshot do frame principal via REST API** (scale=1.5, JPG → WebP via sharp — referência leve e nítida; MCP `get_screenshot` é só 1x e fica borrado):

   ```bash
   node .claude/skills/figma/extract-screenshots.mjs \
     --url "<figma-url>" \
     --output docs/figma \
     --prefix {page}- --name overview \
     --scale 1.5
   ```

   - Defaults: `--scale 1.5` + WebP (q=82) — ~10× mais leve que `--scale 2 --no-webp`.
   - Pra batch de seções (uma chamada só): passar `--node-id "id1=hero,id2=cta,..."`. Ver header de `extract-screenshots.mjs`.

### Parte B — INVENTÁRIO OBRIGATÓRIO (anti "esqueceu seção")

7. Produzir um **inventário numerado de TODAS as seções da página**, na ordem vertical:

   ```
   Inventário da página [nome]:
   1. Hero
   2. Sobre
   3. Serviços
   4. Depoimentos
   5. CTA
   6. Rodapé
   Total: 6 seções. Confirma? (sim/ajustar)
   ```

   Mostrar ao usuário e AGUARDAR confirmação. Nunca pular esta etapa.

8. Criar um **tracker de progresso** interno (TodoWrite ou lista inline). Cada seção do inventário vira um item `pendente`.

### Parte C — Geração seção por seção

9. Pra CADA seção do inventário:
   - `get_design_context` do nó da seção (NÃO do frame inteiro)
   - Baixar imagens dos image-fills daquela seção → `src/assets/images/{page}/`, preferir `.webp`
   - Gerar `.jsx` em `src/screens/{Page}/{NomeSeção}.jsx`
   - Marcar seção como `✅ implementada` no tracker
10. Criar `.astro` em `src/pages/` importando todas as seções do inventário na ordem
11. Antes de declarar "pronto", conferir: **todos os itens do inventário estão `✅`?** Se algum está `pendente`, voltar ao passo 9.

### Parte D — Validação final

12. Validar: ZERO valores arbitrários (`[...]`), ZERO placeholder, ícones reais importados, texto literal (ver R13 em RULES.md)

## Anti-alucinação (chunking)

- Lê UMA seção por vez com `get_design_context` — NÃO passa todos nodes juntos
- Se retorno for >10k tokens, dividir em chamadas menores
- Screenshot ANTES de contexto textual — a imagem é mais confiável que o texto
- 5 chamadas pequenas e precisas > 1 chamada gigante imprecisa

## Contexto do vault de aprendizado (3 níveis)

Antes de gerar código, consumir o vault em ordem:

1. **N1**: ler `.claude/learn/_index.json`. Categorias relevantes pra Figma-to-code:
   `tokens`, `icons`, `responsive`, `semantica`, `navbar`, `components`, `layout`.
2. **N2**: olhar os arrays dessas categorias no JSON; escolher até 3 notas que batam com a seção atual.
3. **N3**: ler **no máximo 3 notas** completas. Se mais baterem, priorizar `recurrence: alta` e `scope: generic`.

A entrada do agente é `_index.json`. O índice humano fica em `index.base` (Obsidian Bases) — não tente ler ele.

## Referências

- Regras de código: `.claude/RULES.md`
- Ícones: skill `/icon-extract`
- Validação visual opcional: skill `/visual-test`
- Vault de aprendizado: `.claude/learn/` (entrada `_index.json`)
