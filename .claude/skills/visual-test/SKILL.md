---
name: visual-test
description: >
  Compara implementacao com design (Figma ou Pencil) por screenshot diff. Aceita pagina,
  secao ou componente via selector CSS, e link/node do Figma ou PNG do Pencil como
  baseline. Roda local; sem CI/PR. Use quando o usuario pedir "compara com Figma/Pencil",
  "visual test", "pixel perfect", ou reportar "ficou diferente do design".
disable-model-invocation: true
user-invocable: true
---

# Visual Test — Screenshot Diff (OPCIONAL)

Skill **sob demanda**. Nao rode automaticamente — so quando o usuario pedir, em landing
de alta fidelidade, ou quando ele reportar diferenca do design.

Voce e um QA visual senior. Padrao: **goal NAO atingido ate o diff provar o contrario**.
Julgue pelo diff, nao por code hints.

## Workflow (3 passos)

### 1. Coletar input do usuario

Antes de rodar, garanta:

- **Onde comparar na implementacao**:
  - Rota (`/`, `/sobre`, `/produto/:slug` resolvido)
  - Escopo: pagina inteira, ou **`--component "<seletor CSS estavel>"`**
    (`[data-section='hero']`, `.ornamento`, etc.). Component-first reduz flakiness
    e isola onde o erro esta.
- **De onde vem o baseline**:
  - **Figma**: URL ou node id. De `figma.com/design/<FILE_KEY>/...?node-id=12-345`:
    - `FIGMA_FILE_KEY` = `<FILE_KEY>` (env)
    - `--figma-node "12:345"` (troca `-` por `:`)
    - Se for branch URL: use a `branchKey` como file key.
  - **Pencil**: chame MCP `get_screenshot` no frame, salve PNG em
    `tests/visual/baselines/<nome>.png` e use `--baseline <path>`.
- **Viewport(s)**: alinhe ao(s) frame(s) exportado(s). Frame so desktop →
  `--viewports desktop`. Multi-viewport so quando o design tiver variantes.

### 2. Rodar o script

Comando base:

```bash
node scripts/visual-test.mjs \
  --route /sobre \
  --component "[data-section='hero']" \
  --name hero \
  --figma-node "123:456" \
  --viewports desktop \
  --tolerance 1
```

Pencil (ou baseline ja salvo):

```bash
node scripts/visual-test.mjs \
  --route / --component ".ornamento" --name ornament \
  --baseline tests/visual/baselines/ornament-desktop-baseline.png \
  --viewports desktop --tolerance 1
```

Variaveis de ambiente quando usar `--figma-node`:

```bash
# PowerShell
$env:FIGMA_ACCESS_TOKEN="..."; $env:FIGMA_FILE_KEY="..."
# bash
export FIGMA_ACCESS_TOKEN=...; export FIGMA_FILE_KEY=...
```

O script: navega no Astro (`localhost:4321` ou `--preview-url`), espera selector,
captura screenshot, baixa baseline do Figma se faltar, compara com pixelmatch,
escreve `*-actual.png`, `*-diff.png` e `report-*.md` em `tests/visual/results/`.

### 3. Analisar o diff

Abra `tests/visual/results/<prefix>-<viewport>-diff.png`. Pixels magenta = diferenca.

**Decisao:**

| Sintoma no diff                              | Fix tipico                                              |
|----------------------------------------------|---------------------------------------------------------|
| Tudo deslocado uniformemente                 | Wrapper com padding/margin errado, ou container width   |
| Borda magenta em torno de elemento           | Tamanho/padding/border-width fora do design             |
| Bloco inteiro magenta                        | Componente faltando, escondido, ou conteudo trocado     |
| Magenta so em texto                          | Font-family/weight/size/letter-spacing ou line-height   |
| Magenta em forma colorida                    | Cor (verifique token), opacity, gradient stops          |
| Magenta espalhado fino                       | Anti-alias / sub-pixel — checar tolerancia, nao bug     |
| Diff alto so em uma area                     | Re-rode com `--component` mais especifico naquela area  |

**Quebrar em partes** (recomendado quando diff > 5% e a falha parece local):

1. Estreite o seletor (`.secao` → `.secao .ornamento`).
2. Se possivel, exporte sub-frame do Figma com node id menor — baseline mais limpo.
3. Re-rode com `--tolerance 1`.

## CLI

| Flag             | Descricao                                              | Default |
|------------------|--------------------------------------------------------|---------|
| `--route`        | Rota a capturar                                        | `/`     |
| `--component`    | Seletor CSS isolado (recomendado)                      | —       |
| `--viewports`    | `mobile,tablet,desktop` (vazio = `mobile,desktop`)     | `mobile,desktop` |
| `--name`         | Prefixo dos arquivos                                   | derivado da rota |
| `--tolerance`    | % maximo de pixels diferentes pra PASS                 | `2` (use `1` em componente) |
| `--figma-node`   | Node id(s) do Figma (`a:b` ou `a:b,c:d` 1=1 com viewports) | —     |
| `--baseline`     | Path para PNG ja salvo (Pencil ou export manual)       | —       |
| `--wait-for`     | Selector a esperar antes do screenshot                 | `main, footer, [data-loaded]` |
| `--preview-url`  | URL base alternativa (substitui `localhost:4321`)      | —       |
| `--full-page`    | Pagina inteira (ignorado se `--component`)             | off     |
| `--skip-compare` | So captura, nao compara                                | off     |

Resolucoes: `mobile 375x812` · `tablet 768x1024` · `desktop 1920x1080`.

## Estabilizar a captura

O script ja aplica por default:

- `networkidle` no `goto` + `waitForSelector` no `--wait-for`.
- `document.fonts.ready` antes do shot (sem `waitForTimeout` magico).
- `animations: 'disabled'` no `screenshot()` — Playwright congela CSS/Web
  Animations no estado inicial.
- Redimensiona o baseline pro tamanho do actual antes do pixelmatch (Figma
  exporta @2x; viewport @1x — sem isso o diff vinha corrompido).
- Avisa quando a aspect ratio difere > 5% (sinal de baseline errado).

Casos que ainda exigem cuidado:

- **Fontes web**: pequenas variacoes entre OS sao esperadas (~0.5%). Nao trate
  como bug a menos que peso/familia/size estejam claramente errados.
- **Conteudo dinamico (CMS, datas, contadores)**: o `animations: 'disabled'`
  nao resolve. Use `--component` apontando para regiao sem o dado volatil.
- **Imagens externas / Astro `<Image>` lazy**: scroll ate o componente ou
  use `loading="eager"` na pagina de teste, senao o shot pega placeholder.
- **GSAP em loop infinito**: Playwright cancela e mostra estado inicial.
  Se voce **quer** ver o estado animado, aciona o trigger no DOM antes do shot.

## Anti-padroes

- Comparar pagina inteira em diff > 5% e tentar ler tudo. → use `--component`.
- Aceitar PASSED so porque `diff < tolerance` sem abrir o PNG. → sempre abra o diff.
- Comparar com viewport diferente do frame exportado. → `mobile` no codigo vs
  frame `desktop` no Figma da diff inteiro.
- Usar `figma.com/embed` ou viewer publico como baseline. → so REST API com token.
- Esquecer de validar baseline (pagina branca, erro 404 capturado como baseline).
  → o script ja avisa se >98% branco; trate o aviso.
- Medir distancia/padding olhando o diff a olho nu. → o diff mostra **onde**, nao
  **quanto**. Se precisar do delta exato, inspecione o DOM e o Figma.

## Saida esperada (o que reportar pro usuario)

1. Tabela: viewport, % diff, PASS/FAIL.
2. Para cada FAIL: descricao objetiva da diferenca (regiao + tipo: padding, cor,
   ornamento, texto), arquivo + linha sugeridos pro fix.
3. Caminho do diff PNG e do report `.md`.
4. Se nao tem certeza, classifique como `INCONCLUSIVO` e proponha quebrar em
   partes (passo 3 acima) — nao force PASSED.

## Arquivos do skill

```
scripts/
  visual-test.mjs                 # captura + compara
  capture-figma-baselines.mjs     # download em lote (opcional)
tests/visual/
  baselines/                      # PNGs de referencia (versionados)
  results/                        # output (gitignored)
```

## Referencias usadas no design deste skill

- Playwright `toHaveScreenshot` + `mask` + `animations: 'disabled'` (best practice
  oficial para reduzir flakiness).
- pixelmatch (zero-dep, padrao da industria pra diff PNG).
- Component-first screenshot (mais confiavel que full-page; recomendado por todas
  as guias modernas de visual regression).
- Figma REST API `/v1/images` para export de node como PNG @2x.
- ΔE2000 (perceptual color) e uiMatch sao referencias para evolucoes futuras —
  nao implementadas aqui.
