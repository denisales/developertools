# Diretrizes Obrigatórias de UX Mobile-First (`mobile-ux-guidelines.md`)

Este documento define as **regras inegociáveis de arquitetura Mobile-First, ergonomia em telas pequenas (`375x667`) e linguagem de interface** para todas as ferramentas do **DevToolsBR**, alinhadas 1:1 com os tokens do [**Styleguide Oficial (`styleguide.md`)**](./styleguide.md) e com os aprendizados de [**`lessons-learned.md`**](./lessons-learned.md).

Nenhuma ferramenta pode ser publicada ou aprovada na revisão de QA (`@mob-verifier`) sem cumprir 100% dos itens abaixo.

---

## 1. Regra "Above-the-Fold" (`< 600px` em Viewport `375x667`)

Em dispositivos móveis (`375px` de largura por `667px` de altura útil), **o usuário jamais deve precisar rolar a página para executar a ação principal da ferramenta**, sem sacrificar legibilidade nem comprimir alvos de toque.

1. **Orçamento Vertical do Topo e Shell (`AppShell` + `<ToolPageHeader />`)**:
   - `SiteHeader`: altura fixa `h-14` (`56px`).
   - `<main>`: padding canônico `px-4 py-4 sm:px-6 sm:py-6 lg:px-8` com container `max-w-[1440px]`.
   - Cabeçalho unificado `<ToolPageHeader />` (`src/components/layout/tool-page-header.tsx`): `H1` em `text-lg sm:text-2xl font-bold tracking-tight` + subtítulo `text-xs sm:text-sm text-muted-foreground leading-relaxed` (`line-clamp-1 sm:line-clamp-none`), sem badges redundantes ou parágrafos longos no topo.
   - Ritmo vertical da página: `space-y-4 sm:space-y-5` (`16px` mobile / `20px` desktop), grids entre cards irmãos com `gap-4` e padding interno de `Card` padrão `p-4 sm:p-5` (sub-cards `p-3.5 sm:p-4`).
2. **Geradores (CPF, CNPJ e futuros geradores)**:
   - O **Valor Gerado (`font-mono text-2xl sm:text-3xl font-bold tracking-wider`) + Botões `Copiar` / `Gerar Novo` + Opções Principais (Pontuação / Estado / Formato)** devem caber integralmente nos primeiros `520px` verticais da tela (`375x667`).
3. **Calculadoras (Juros Compostos e futuras calculadoras)**:
   - Os **Presets rápidos** devem ficar em **uma única faixa horizontal rolável** (`flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar`) integrada ao topo do card de simulação — nunca em um card vertical separado que empurre os inputs para fora da tela.
   - Os campos de entrada principais (`#mainValue`, `#investment`, `#rate`) devem permanecer visíveis logo na dobra inicial (`375x667`), com espaçamento respirável (`p-4 sm:p-5`, `space-y-4`, `gap-4`) que evite elementos espremidos ou colados no celular.
   - **Ergonomia Mínima de Toque, Tipografia e Espaçamento no Mobile**:
     - Todos os **inputs e botões de ação primária/secundária** (`Input`, `Button`, `SelectTrigger`, `TabsList`) devem ter altura padrão de **`h-10` (`40px`)** no mobile e no desktop.
     - Todos os **chips de atalho de período/taxa/sincronização** (`1a`..`30a`, presets BCB, botão `Sincronizar`, toggles segmentados) devem ter altura padrão de **`h-8` (`32px`)**, e chips de incremento rápido inline (`+1k`, `+5k`, `+200`) altura mínima confortável (`h-7` / `28px`), com espaçamento mínimo de **`gap-2` (`8px`)** entre botões interativos adjacentes.
     - **Mínimo tipográfico estrito:** proibido `text-[10px]` / `text-[11px]`; menor fonte permitida é `text-xs` (`12px`).
     - Textos de status com dados dinâmicos (ex.: indicadores BCB) devem quebrar linha naturalmente (`text-xs leading-relaxed text-muted-foreground`, sem `whitespace-nowrap` truncando palavras ao meio) em sua própria barra sutil ao lado do botão `Sincronizar`.

---

## 2. Ordem do DOM = Ordem de Prioridade Mobile

Em layouts responsivos com CSS Grid (`grid-cols-1 lg:grid-cols-12 gap-4`), **a ordem dos elementos no JSX/DOM determina o que aparece primeiro no celular**:

- **ERRADO**: Colocar o card de *Opções de Configuração* antes do *Visor do Documento Gerado* no JSX achando que no desktop ficarão lado a lado. No mobile, isso joga o resultado gerado para o fim da página!
- **CORRETO**:
  1. **1º elemento no JSX (`lg:col-span-8`)**: Card Principal com o Documento Gerado (`font-mono text-2xl sm:text-3xl font-bold tracking-wider`) ou KPI Financeiro (`font-mono text-2xl sm:text-3xl font-bold tracking-tight`) + Botões de Ação lado a lado (`Copiar` + `Gerar Novo`).
  2. **2º elemento no JSX (`lg:col-span-4`)**: Controles compactos de configuração (ex.: `Pontuação`, `Estado UF`, `Padrão Numérico/Alfanumérico`).
  3. **3º elemento no JSX**: Cards educativos inferiores (`gap-4`, sem `<Separator />` solto entre seções), Anatomia/Região Fiscal e Histórico Recente.

---

## 3. Abas Compactas em Linha Única (`grid-cols-3`)

Quando uma ferramenta possuir 3 modos principais (ex.: Gerar, Validar, Em Lote):
- Usar sempre `grid w-full grid-cols-3 h-10 p-1` no `TabsList`.
- Usar **rótulos curtos** que nunca quebrem linha nem sobreponham texto em `375px`:
  - `Gerar CPF` | `Validar` | `Em Lote`
  - `Gerar CNPJ` | `Validar` | `Em Lote`
- Fonte `text-xs sm:text-sm` com ícone compacto `size-3.5 shrink-0`.

---

## 4. Botões de Ação Lado a Lado (`grid-cols-2 gap-2.5`)

- Nunca empilhar botões de ação primária e secundária (`w-full` + `w-full` vertical) dentro do visor principal no mobile, pois isso consome mais de `110px` verticais e deixa botões colados sem respiro.
- Usar sempre **`grid grid-cols-2 gap-2.5 sm:flex sm:justify-center sm:gap-3`** com botões `h-10 sm:h-11 text-xs sm:text-sm font-semibold`:
  - Coluna 1: `Copiar` (primário)
  - Coluna 2: `Gerar Novo` (outline)

---

## 5. Busca Global e Navegação Mobile (60fps)

1. **Proibido `<input type="search">` Nativo**:
   - Navegadores móveis e WebKit renderizam um botão `x` nativo dentro de `input[type="search"]`, duplicando nosso botão `<X>` customizado.
   - **Regra**: Usar sempre `type="text"` com nosso botão `<X>` único e controlado.
2. **Busca no Header Mobile (`< sm`)**:
   - Proibido espremer um campo `<Input>` inline na barra superior de `375px` ao lado da logo e do botão de tema.
   - No mobile (`< sm`), renderizar um **Botão `Buscar...`** (`h-9 px-3 gap-2`) que abre um **Overlay/Modal de Largura Total** (`fixed inset-x-3 top-16 z-50 rounded-xl border bg-popover p-3 shadow-2xl` com backdrop `fixed inset-0 top-14 z-40 bg-black/40 backdrop-blur-xs`).
   - No desktop (`>= sm`), o dropdown de resultados deve ter largura explícita confortável (`w-[420px] right-0`), jamais ficando preso à largura estreita do input.
3. **Gaveta Mobile (`Sheet` `w-72` + `SidebarNav`) Leve e Animada**:
   - `SheetOverlay` e `SheetContent` devem utilizar animações `@keyframes` aceleradas por GPU (`translate3d` + `cubic-bezier(0.32, 0.72, 0, 1)` em `240ms`).
   - Na `SidebarNav` mobile (`w-72`, `defaultExpanded={false}`), exibir no topo apenas **Visão Geral** (`px-3 py-2`) e **Ferramentas Ativas** (`gap-1.5`, `px-3 py-2.5`), mantendo as categorias de catálogo futuro **colapsadas por padrão (accordion)** para abertura instantânea (no desktop `<aside>` usa `w-[268px]` com `defaultExpanded`).

---

## 6. Linguagem Limpa (Zero Menções a Sites de Referência ou Jargões Internos)

Todas as ferramentas do **DevToolsBR** são implementações próprias e independentes. Na interface visível ao usuário (`src/`):
- **PROIBIDO** citar nomes de sites externos (ex.: *"4Devs"*, *"Investidor10"*).
- **PROIBIDO** exibir jargões internos de engenharia ou implementação nos títulos, subtítulos, badges ou cards (ex.: *"Motor Módulo 11"*, *"Módulo 11"*, *"Mod-11"*, *"Motor Financeiro"*, *"100% Client-Side"*).
- Usar sempre linguagem clara, direta e focada no usuário final (ex.: *"Cálculo Oficial da Receita Federal"*, *"Dígitos Verificadores"*, *"Equivalência Composta de Taxas"*).

---

## 7. Gate Obrigatório: Cobertura E2E, Cenários Funcionais, Contenção Geométrica e Snapshots Visuais (Desktop & Mobile)

Nenhuma tarefa, página ou branch pode ser aprovada sem validação automatizada completa no **Playwright** e no verificador de cobertura de rotas em **Desktop (`1440x900`)** e **Mobile (`375x667`)**. Toda nova página/tela em `src/app/` e toda ferramenta marcada como `"ready"` em `src/config/tools-registry.ts` **deve obrigatoriamente** cumprir os 4 passos abaixo:

1. **Registro na Cobertura de Rotas E2E (`scripts/check-e2e-coverage.mjs`):**
   - A rota deve estar coberta e validada por `npm run test:e2e:coverage`, que falha com código de saída `1` caso qualquer página em `src/app/` ou ferramenta `"ready"` em `src/config/tools-registry.ts` esteja sem cenários funcionais ou sem snapshots Desktop/Mobile.
2. **Cenários Funcionais Interativos (`tests/e2e/functional-scenarios.spec.ts`):**
   - Toda ferramenta/tela deve possuir testes E2E interativos reais simulando o fluxo do usuário (ex.: cliques em gerar/validar/copiar, alternância de abas, selects, toggles, inputs de cálculo e verificação dos resultados exibidos na tela).
3. **Contenção Geométrica de Cards (`[data-slot="card"]`) e Snapshots Visuais (`tests/e2e/layout-and-snapshots.spec.ts`):**
   - Todo `Card` deve possuir `min-w-0 overflow-hidden` e `CardHeader` deve utilizar `flex min-w-0 flex-col gap-1.5`.
   - Em cards de catálogo (4 colunas no desktop), **nunca** colocar `[Ícone] + [Título Completo] + [Badge]` na mesma linha horizontal. Utilizar sempre o padrão **Vercel / Linear Card Header**:
     - **Linha 1**: `<div className="flex items-center justify-between gap-2">` com o Ícone à esquerda e a `Badge` (`Disponível` / `Catálogo`) à direita.
     - **Linha 2**: `<CardTitle className="mt-2 ... line-clamp-1">` ocupando 100% da largura útil do card.
   - O teste automatizado verifica que nenhum elemento filho (`badge`, `card-title`, `h1..h4`, `button`, `input`) ultrapasse as bordas laterais do card (`childBox.right <= cardBox.right + 1` e `childBox.left >= cardBox.left - 1`), além de zero scroll horizontal (`scrollWidth <= innerWidth`).
   - Todo worker que implementar ou alterar uma rota deve atualizar `tests/e2e/layout-and-snapshots.spec.ts` e gerar os snapshots determinísticos Desktop (`1440x900`) e Mobile (`375x667`) via `npm run test:e2e:snapshots`.
4. **Auditoria Visual pelo Verifier e Gate de Pre-Commit (`.husky/pre-commit`):**
   - O agente verificador (`@verifier` / `@pw-verifier`) é **obrigado** a:
     1. Executar `npm run lint` (`@typescript-eslint/no-explicit-any: "error"`), `npm run typecheck` (`"strict": true`), `npm run test:coverage` (`>= 90%` Vitest V8), `npm run test:e2e:coverage` e `npm run test:e2e`, confirmando 100% de aprovação.
     2. Inspecionar visualmente cada arquivo `.png` gerado em `tests/e2e/__screenshots__/desktop/` e `tests/e2e/__screenshots__/mobile/` usando a ferramenta `read_file` antes de aprovar o merge.
   - Esses mesmos checks obrigatórios são executados automaticamente pelo hook `.husky/pre-commit` antes de qualquer commit no repositório.
