---
name: pencil-design-rules
description: >
  Regras de qualidade para criacao de designs no Pencil. Garante estrutura limpa
  (auto-layout, variaveis, componentes) sem limitar criatividade visual.
  Use quando: criar designs no Pencil, "design no Pencil", "criar tela",
  "novo layout", "criar pagina", "novo design",
  ou SEMPRE antes de usar batch_design para criar/editar qualquer elemento visual.
user-invocable: true
---

# Pencil Design Rules — Qualidade sem Limitar Criatividade

Guia para criar designs estruturalmente limpos e prontos para codigo, sem restringir decisoes criativas. A filosofia e simples:

> **Estrutura e organizacao sao obrigatorias. Escolhas visuais e de composicao sao livres.**

**Este guia complementa os guidelines do Pencil MCP** — carregue-os com `get_guidelines` antes de comecar.

---

## Principio Central

Cada regra tem um nivel de rigidez:

| Nivel | Significado | Quando quebrar |
|-------|-------------|----------------|
| **OBRIGATORIO** | Nunca quebrar. Afeta diretamente a qualidade do codigo gerado | Nunca |
| **PREFERIR** | Seguir por padrao. Quebrar quando houver intencao criativa clara | Quando a alternativa produz um resultado visual melhor |
| **RECOMENDADO** | Boa pratica. Seguir quando nao houver motivo para nao seguir | Quando atrapalha o fluxo ou nao faz sentido no contexto |

---

## 1. Layout: Preferir Auto-Layout

**Nivel: PREFERIR**

Auto-layout (`layout: "vertical"` / `"horizontal"`) deve ser a escolha padrao para organizar elementos. Produz designs mais faceis de converter em codigo responsivo.

### Padrao (auto-layout)

```javascript
// Cards distribuidos uniformemente
row=I(section, {type: "frame", layout: "horizontal", width: "fill_container", gap: 24})
card1=I(row, {type: "ref", ref: "cardId", width: "fill_container"})
card2=I(row, {type: "ref", ref: "cardId", width: "fill_container"})
card3=I(row, {type: "ref", ref: "cardId", width: "fill_container"})
```

### Quando posicionamento absoluto e valido

Posicionamento absoluto (`layout: "none"` ou `layoutPosition: "absolute"`) e totalmente aceitavel quando a **intencao criativa exige**:

- **Composicoes sobrepostas** — texto sobre imagem em posicao especifica, elementos que se cruzam
- **Layouts broken-grid** — assimetria intencional, elementos que "escapam" do grid
- **Hero sections com composicao livre** — titulo posicionado de forma artistica, nao alinhado a grid
- **Elementos decorativos** — vectors ornamentais, linhas, formas abstratas
- **Overlays e badges** — indicadores posicionados sobre outros elementos
- **Parallax ou efeitos de profundidade** — camadas visuais sobrepostas

### O que EVITAR (problema real)

O problema nao e usar absoluto — e usar absoluto **por preguica** quando auto-layout resolve melhor:

```javascript
// RUIM: grid de cards identicos posicionados na mao (preguica, nao criatividade)
grid=I(section, {type: "frame", layout: "none", height: 560})
card1=I(grid, {type: "frame", width: 597, x: 0, y: 0, ...})
card2=I(grid, {type: "frame", width: 597, x: 597, y: 0, ...})
card3=I(grid, {type: "frame", width: 597, x: 1194, y: 0, ...})

// BOM: mesmo resultado, estrutura limpa
row=I(section, {type: "frame", layout: "horizontal", gap: 0})
card1=I(row, {type: "ref", ref: "cardId", width: "fill_container"})
card2=I(row, {type: "ref", ref: "cardId", width: "fill_container"})
card3=I(row, {type: "ref", ref: "cardId", width: "fill_container"})
```

### Dica para grids 2D

Flexbox do Pencil e single-axis. Para grids, criar rows separadas:

```javascript
grid=I(section, {type: "frame", layout: "vertical", width: "fill_container", gap: 24})
row1=I(grid, {type: "frame", layout: "horizontal", width: "fill_container", gap: 24})
row2=I(grid, {type: "frame", layout: "horizontal", width: "fill_container", gap: 24})
```

---

## 2. Cores: Sempre Variaveis

**Nivel: OBRIGATORIO**

Toda cor DEVE referenciar uma variavel `$--nome`. Hex codes diretos tornam o design impossivel de manter e geram codigo com valores magicos.

### Errado

```javascript
I(parent, {type: "frame", fill: "#ffffff", ...})
I(parent, {type: "text", fill: "#3f402a", content: "Titulo", ...})
I(parent, {type: "frame", stroke: {fill: "#dedad3", thickness: 1}, ...})
```

### Correto

```javascript
I(parent, {type: "frame", fill: "$--card", ...})
I(parent, {type: "text", fill: "$--foreground", content: "Titulo", ...})
I(parent, {type: "frame", stroke: {fill: "$--border", thickness: 1}, ...})
```

### Antes de comecar qualquer design

1. Rodar `get_variables` para listar variaveis disponiveis
2. O catalogo do projeto e a paleta shadcn (ver `src/assets/index.css`): `$--background`, `$--foreground`, `$--card`, `$--card-foreground`, `$--popover`, `$--popover-foreground`, `$--primary`, `$--primary-foreground`, `$--secondary`, `$--secondary-foreground`, `$--muted`, `$--muted-foreground`, `$--accent`, `$--accent-foreground`, `$--destructive`, `$--border`, `$--input`, `$--ring`, `$--chart-1` a `$--chart-5`, `$--sidebar*`. Preferir sempre um desses antes de propor cor nova
3. Se uma cor necessaria NAO existe nesse catalogo, **criar uma nova variavel** antes de usar — ela entra depois em `src/assets/index.css` nos tres lugares (`:root`, `.dark`, `@theme inline` — R1)
4. Para opacidade, usar canal alpha na propria cor (ex: `oklch(1 0 0 / 10%)`, como o projeto ja faz em `--border` no `.dark`) — nao criar variavel derivada tipo `$--white-30`

---

## 3. Tipografia: Sistema Padronizado

**Nivel: OBRIGATORIO**

Todo texto no design DEVE mapear para um dos text-styles do catalogo do projeto (`text-{nome}`, definidos em `src/assets/index.css` + `TEXT_STYLES` em `src/libs/utils.ts` — R2). Nao e uma escala numerada por tamanho: cada nome e um proposito fixo, e o valor (size/weight/line-height) e exato — nao aproximar "no olho".

### Catalogo do projeto

| Nome | fontSize | fontWeight | lineHeight | Uso |
|------|----------|------------|------------|-----|
| **title** | 1.25rem (20px) | 300 | 1.4 | titulo de tela |
| **heading** | 0.875rem (14px) | 400 | 1.4 | titulo de secao ou card |
| **heading-caps** | 0.875rem (14px) | 500 | 1.4 | titulo em caixa alta (uppercase) |
| **label** | 0.75rem (12px) | 400 | 1.42 | rotulo de campo, legenda de dado |
| **paragraph** | 0.875rem (14px) | 400 | 1.4 | texto corrido |
| **paragraph-light** | 0.875rem (14px) | 300 | 1.4 | texto corrido secundario |
| **caption** | 0.875rem (14px) | 400 | normal | apoio |
| **caption-sm** | 0.75rem (12px) | 300 | 1.5 | apoio compacto |
| **button** | 1rem (16px) | 600 | 1 | acao |
| **button-sm** | 0.875rem (14px) | 600 | 1 | acao compacta |

### Nomenclatura

Nomear o node de texto com o nome direto do estilo — sem numero, sem categoria de tamanho:

```
title
heading
heading-caps
label
paragraph
paragraph-light
caption
caption-sm
button
button-sm
```

Antes de usar um estilo, rodar `get_variables`/`get_guidelines` e conferir se o projeto ja tem um equivalente — dois nomes para o mesmo texto custam mais que um nome bem escolhido. O catalogo **nao e um limite**: se nenhum estilo existente cobre o que o design pede, criar um novo e valido (R2) — mas o node ja nasce nomeado com o proposito (ex: `metric`, `paragraph-lg`), nao com um numero generico.

### Line-height — nao existe step fixo

O catalogo real usa `1`, `1.4`, `1.42`, `1.5` e `normal` — **nao** e um sistema de steps de 10%. Ao reusar um estilo existente, copiar o line-height exato da tabela acima. Ao criar um estilo novo, escolher o line-height que fizer sentido pro tamanho/peso do texto (geralmente mais folgado em textos corridos, mais apertado em numeros/labels curtos) — sem arredondar de cabeca.

### Propriedades obrigatorias em cada text style

Todo texto DEVE definir **todas** estas propriedades:

```javascript
I(container, {
  type: "text",
  name: "heading",
  content: "Titulo da Secao",
  fontFamily: "$--font-sans",      // OBRIGATORIO — variavel de fonte
  fontWeight: "400",               // OBRIGATORIO — peso do estilo (ver catalogo)
  fontSize: 14,                    // OBRIGATORIO — tamanho do estilo (ver catalogo)
  lineHeight: 1.4,                 // OBRIGATORIO — line-height exato do estilo
  fill: "$--foreground",           // OBRIGATORIO — cor via variavel
  textGrowth: "fixed-width",      // recomendado para texto em flexbox
  width: "fill_container"          // recomendado para texto em flexbox
})
```

`letterSpacing` e opcional (default `0`) — nenhum text-style do catalogo usa tracking. So definir um valor diferente de `0` se o design pedir explicitamente e nao houver estilo do catalogo que atenda.

### Errado

```javascript
// ERRADO: sem lineHeight definido (usa default do browser — inconsistente)
I(container, {type: "text", content: "Titulo", fontSize: 14, fill: "$--foreground"})

// ERRADO: nome generico, nao mapeia pra nenhum text-style
I(container, {type: "text", name: "Text 1", fontSize: 14, lineHeight: 1.4, fill: "$--foreground"})

// ERRADO: sem fontFamily (herda qualquer coisa)
I(container, {type: "text", content: "Titulo", fontSize: 14, lineHeight: 1.4, fill: "$--foreground"})

// ERRADO: valores nao batem com nenhum estilo do catalogo nem justificam um novo
I(container, {type: "text", name: "heading", fontSize: 22, lineHeight: 1.15, ...})
```

### Correto

```javascript
// title — titulo de tela
I(container, {type: "text", name: "title",
  content: "Saldo disponivel", fontFamily: "$--font-sans", fontWeight: "300",
  fontSize: 20, lineHeight: 1.4, fill: "$--foreground"})

// heading — titulo de secao/card
I(container, {type: "text", name: "heading",
  content: "Extrato", fontFamily: "$--font-sans", fontWeight: "400",
  fontSize: 14, lineHeight: 1.4, fill: "$--foreground",
  textGrowth: "fixed-width", width: "fill_container"})

// paragraph — texto corrido
I(container, {type: "text", name: "paragraph",
  content: "Ultimas 30 transacoes da conta.", fontFamily: "$--font-sans", fontWeight: "400",
  fontSize: 14, lineHeight: 1.4, fill: "$--muted-foreground",
  textGrowth: "fixed-width", width: "fill_container"})

// label — rotulo de campo
I(container, {type: "text", name: "label",
  content: "Valor", fontFamily: "$--font-sans", fontWeight: "400",
  fontSize: 12, lineHeight: 1.42, fill: "$--muted-foreground"})
```

### Fontes — usar variaveis

O projeto tem uma unica familia tipografica:

```
$--font-sans     → familia do projeto (JetBrains Mono Variable)
$--font-heading  → alias de $--font-sans (mesmo valor, nome semantico)
```

**NUNCA** hardcodar o nome da fonte direto no texto:

```javascript
// ERRADO
{fontFamily: "JetBrains Mono", ...}

// CORRETO
{fontFamily: "$--font-sans", ...}
```

Se o design pedir uma segunda familia (ex: fonte de destaque para titulos grandes), criar a variavel antes de usar e registrar em `src/assets/index.css` (R1) — nao inventar mais de uma familia sem essa etapa.

---

## 4. Sizing: Dinamico por Padrao, Fixo Quando Intencional

**Nivel: PREFERIR**

Usar `fill_container` e `fit_content` como escolha padrao. Pixels fixos sao validos quando representam uma decisao de design intencional.

### Preferir dinamico

```javascript
// Cards que se adaptam ao container
I(row, {type: "ref", ref: "cardId", width: "fill_container"})

// Secoes que preenchem a pagina
I(page, {type: "frame", width: "fill_container", ...})
```

### Fixo e valido quando intencional

```javascript
// Card de carrossel com largura fixa (decisao de design)
I(carousel, {type: "ref", ref: "cardId", width: 300})

// Sidebar com largura definida
I(layout, {type: "frame", name: "Sidebar", width: 280, ...})

// Coluna de texto com largura maxima para legibilidade
I(section, {type: "frame", name: "Content Column", width: 720, ...})

// Icones, avatares, logos — sempre fixos
I(nav, {type: "icon_font", width: 24, height: 24, ...})
```

### O que EVITAR

```javascript
// RUIM: largura que e resultado de divisao manual (597.333 = 1792/3)
// Indica que deveria ser fill_container com gap
I(grid, {type: "frame", width: 597.3333, x: 0, y: 0, ...})

// RUIM: gap enorme para empurrar elementos (usar justifyContent)
{layout: "horizontal", gap: 418}
// MELHOR:
{layout: "horizontal", justifyContent: "space_between"}
```

### Regra pratica

Pergunte: "esse tamanho fixo e uma **decisao de design** ou e **consequencia de nao usar auto-layout**?"
- Decisao de design → pixel fixo OK
- Consequencia → usar `fill_container`

---

## 5. Estrutura de Pagina e Spacing

**Nivel: PREFERIR**

### Hierarquia recomendada

```
Pagina (frame, layout: "vertical", width: 1920)
  └── Secao (frame, layout: "vertical", width: "fill_container", padding)
       └── Conteudo
```

### Spacing consistente (mas nao rigido)

O projeto nao usa variaveis de spacing — Tailwind ja tem uma escala fixa em multiplos de 4px (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96...). Usar valores dessa escala em padding/gap garante que a conversao gere `p-6`, `gap-3` etc. sem valor arbitrario (R1). Variacoes sao aceitas quando ha intencao, desde que continuem na escala:

```javascript
// Base: valores na escala de 4px
section=I(page, {type: "frame", padding: [96, 64], ...})

// Hero com mais respiro — decisao criativa valida, ainda na escala
hero=I(page, {type: "frame", padding: [160, 64, 120, 64], ...})

// Secao de stats mais compacta — tambem valido
stats=I(page, {type: "frame", padding: [48, 64], ...})
```

### O que EVITAR

Padding que parece **acidental** em vez de **intencional**:

```javascript
// RUIM: valores que parecem aleatorios sem logica visual
section1=I(page, {..., padding: [112, 64]})
section2=I(page, {..., padding: [120, 64]})  // 8px de diferenca? parece erro
section3=I(page, {..., padding: [88, 240, 120, 0]})  // assimetrico sem motivo claro
```

A regra nao e "todo padding igual" — e "todo padding intencional".

---

## 6. Componentes Reutilizaveis

**Nivel: OBRIGATORIO (para 3+ repeticoes) / PREFERIR (para 2 repeticoes)**

Elementos visuais que aparecem **3 ou mais vezes** DEVEM ser componentes reutilizaveis. Para 2 repeticoes, e fortemente recomendado.

### Errado

```javascript
// Mesmo card copiado 4x com copy-paste
statCard1=I(row, {type: "frame", layout: "vertical", padding: 64, gap: 8,
  children: [{type: "text", content: "22+", fontSize: 48, ...}, ...]})
statCard2=I(row, {type: "frame", layout: "vertical", padding: 64, gap: 8,
  children: [{type: "text", content: "50+", fontSize: 48, ...}, ...]})
// ... mais 2x
```

### Correto

```javascript
// Componente reutilizavel
statCard=I(document, {
  type: "frame", name: "Component/Card/Stat", reusable: true,
  layout: "vertical", padding: 64, gap: 8, width: "fill_container",
  children: [
    {id: "value", type: "text", name: "title", content: "00", fontSize: 20, lineHeight: 1.4, fill: "$--foreground"},
    {id: "label", type: "text", name: "label", content: "Label", fontSize: 12, lineHeight: 1.42, fill: "$--muted-foreground"}
  ]
})

// Instancias
card1=I(row, {type: "ref", ref: statCard, width: "fill_container",
  descendants: {"value": {content: "22+"}, "label": {content: "anos"}}})
card2=I(row, {type: "ref", ref: statCard, width: "fill_container",
  descendants: {"value": {content: "50+"}, "label": {content: "transacoes"}}})
```

### Nomenclatura de componentes

Usar prefixo `Component/` com categoria:

```
Component/Button/Primary
Component/Card/Stat
Component/Card/Service
Component/Nav/Link
Component/Footer
```

---

## 7. Nomenclatura Semantica

**Nivel: OBRIGATORIO**

Todo node DEVE ter `name` que descreva seu proposito. Nomes genericos automaticos sao inaceitaveis.

### Errado

```
Frame 1597887590
Frame 48096564
Group 1
Rectangle 5
```

### Correto

```
Hero Content
Stats Row
Services Grid
CTA Button Primary
Decorative Vector
```

### Padroes sugeridos

| Tipo | Formato | Exemplo |
|------|---------|---------|
| Secao | `Section - N. Nome` | `Section - 1. Hero` |
| Container | `{Contexto} Content` | `Hero Content` |
| Linha | `{Contexto} Row` | `Stats Row` |
| Grid | `{Contexto} Grid` | `Services Grid` |
| Componente | `Component/{Cat}/{Nome}` | `Component/Card/Stat` |
| Decorativo | `Decorative {Tipo}` | `Decorative Vector` |

---

## 8. Texto

**Nivel: OBRIGATORIO (fill) / PREFERIR (sizing)**

### Obrigatorio: texto SEMPRE com fill

Texto sem `fill` e **invisivel**. Sempre definir cor:

```javascript
// ERRADO: texto invisivel
I(container, {type: "text", name: "title", content: "Titulo", fontSize: 20})

// CORRETO
I(container, {type: "text", name: "title", content: "Titulo", fontSize: 20, lineHeight: 1.4, fill: "$--foreground"})
```

### Preferir: sizing via layout

Deixar o auto-layout controlar o tamanho do texto quando possivel:

```javascript
// Texto que preenche o pai (headings, paragrafos)
I(container, {type: "text", name: "heading", textGrowth: "fixed-width", width: "fill_container",
  fill: "$--foreground", content: "Titulo", fontSize: 14, lineHeight: 1.4})

// Texto com tamanho proprio (labels, botoes)
I(button, {type: "text", name: "button", content: "CONTATO", fontSize: 16, lineHeight: 1, fill: "$--primary-foreground"})
```

### Largura fixa em texto — quando e valido

Limitar largura do texto para **legibilidade** e uma decisao de design valida:

```javascript
// Paragrafo com largura maxima para manter 60-75 caracteres por linha
I(section, {type: "text", name: "paragraph", textGrowth: "fixed-width", width: 640,
  content: "Texto longo...", fontSize: 14, fill: "$--muted-foreground", lineHeight: 1.4})
```

---

## 9. Imagens

**Nivel: OBRIGATORIO**

NAO existe node type `image`. Imagens sao `fill` de tipo `image` em frames ou rectangles:

```javascript
// Imagem que preenche um espaco
imageFrame=I(container, {
  type: "frame", name: "Hero Image",
  width: "fill_container", height: 560, clip: true,
  fill: {type: "image", url: "./images/hero.jpg", mode: "fill", enabled: true}
})

// Imagem gerada por AI
G(imageFrame, "ai", "modern office, professional team")

// Logo com dimensao fixa
logo=I(nav, {type: "rectangle", name: "Logo", width: 188, height: 50,
  fill: {type: "image", url: "./images/logo.png", mode: "fit", enabled: true}})
```

---

## 10. Strokes e Borders

**Nivel: OBRIGATORIO**

Borders DEVEM usar variaveis de cor. Consistencia no `align` dentro do mesmo design:

```javascript
// ERRADO
{stroke: {fill: "#dedad3", thickness: {right: 1}}}

// CORRETO
{stroke: {align: "inside", fill: "$--border", thickness: {right: 1}}}
```

---

## 11. Workflow

**Nivel: RECOMENDADO**

### Antes de criar

1. `get_editor_state` — entender contexto
2. `get_variables` — listar variaveis
3. `get_guidelines` — carregar guias relevantes
4. `batch_get` — listar componentes existentes
5. Planejar: quais componentes criar, qual estrutura

### Durante

6. Criar componentes reutilizaveis primeiro
7. Frame da pagina com `placeholder: true`
8. Montar secoes com auto-layout (ou absoluto quando intencional)
9. Instanciar componentes via `ref`
10. Nomear todos os nodes

### Depois

11. `get_screenshot` — validar visualmente
12. Remover `placeholder: true`

---

## 12. Checklist de Review

Apos terminar, verificar com `batch_get`:

| Problema | Sinal | Acao |
|----------|-------|------|
| Layout acidental | `layout: "none"` em grid de cards identicos | Trocar para auto-layout |
| Cor hardcoded | Hex (`#...`) em `fill` ou `stroke` | Substituir por `$--variavel` |
| Largura acidental | `width: 597.333` (divisao manual) | Usar `fill_container` |
| Gap como spacer | `gap: 418` (valor enorme) | Usar `justifyContent` |
| Nome generico | `Frame 12345` | Renomear |
| Texto invisivel | `type: "text"` sem `fill` | Adicionar fill |
| Card duplicado | Mesmo frame 3+ vezes | Extrair componente |

**Nota:** Esses checks buscam erros **acidentais**. Se algo aparece como "problema" mas e uma decisao criativa intencional, esta tudo bem — o designer tem a ultima palavra sobre composicao visual.

---

## Resumo

| # | Regra | Nivel |
|---|-------|-------|
| 1 | Preferir auto-layout (absoluto OK quando intencional) | PREFERIR |
| 2 | Cores sempre via variaveis `$--` | OBRIGATORIO |
| 3 | Tipografia via catalogo do projeto (title, heading, label, paragraph...) — sem escala numerada | OBRIGATORIO |
| 4 | Sizing dinamico por padrao, fixo quando intencional | PREFERIR |
| 5 | Spacing consistente (variacoes intencionais OK) | PREFERIR |
| 6 | Componentes reutilizaveis para 3+ repeticoes | OBRIGATORIO |
| 7 | Nomes semanticos em todos os nodes | OBRIGATORIO |
| 8 | Texto sempre com fill definido | OBRIGATORIO |
| 9 | Imagens via frame/rectangle fill | OBRIGATORIO |
| 10 | Strokes via variaveis de cor | OBRIGATORIO |
| 11 | Workflow: variables → componentes → layout → review | RECOMENDADO |
