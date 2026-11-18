# Diretrizes Obrigatórias de UX Mobile-First (`mobile-ux-guidelines.md`)

Este documento define as **regras inegociáveis de arquitetura Mobile-First, ergonomia em telas pequenas (`375x667`) e linguagem de interface** para todas as ferramentas do **DevToolsBR**.

Nenhuma ferramenta pode ser publicada ou aprovada na revisão de QA (`@mob-verifier`) sem cumprir 100% dos itens abaixo.

---

## 1. Regra "Above-the-Fold" (`< 600px` em Viewport `375x667`)

Em dispositivos móveis (`375px` de largura por `667px` de altura útil), **o usuário jamais deve precisar rolar a página para executar a ação principal da ferramenta**.

1. **Orçamento Vertical do Topo (`< 110px` totais antes da ferramenta)**:
   - `SiteHeader`: altura fixa `h-14` (`56px`).
   - `<main>`: padding reduzido no mobile (`px-3 py-3 sm:px-6 sm:py-6`).
   - Cabeçalho da Ferramenta: compacto em 1 linha (`text-lg sm:text-2xl font-bold`) + subtítulo curto de 1 linha (`text-xs sm:text-sm text-muted-foreground`), sem badges redundantes ou parágrafos longos no topo.
2. **Geradores (CPF, CNPJ e futuros geradores)**:
   - O **Valor Gerado + Botões `Copiar` / `Gerar Novo` + Opções Principais (Pontuação / Estado / Formato)** devem caber integralmente nos primeiros `520px` verticais da tela (`375x667`).
3. **Calculadoras (Juros Compostos e futuras calculadoras)**:
   - Os **Presets rápidos** devem ficar em **uma única faixa horizontal rolável** (`flex items-center gap-1.5 overflow-x-auto no-scrollbar`) integrada ao topo do card de simulação — nunca em um card vertical separado que empurre os inputs para fora da tela.
   - Os **4 campos de entrada** e os **3 cards de resultado resumido** devem aparecer imediatamente, sem exigir rolagem longa.

---

## 2. Ordem do DOM = Ordem de Prioridade Mobile

Em layouts responsivos com CSS Grid (`grid-cols-1 lg:grid-cols-12`), **a ordem dos elementos no JSX/DOM determina o que aparece primeiro no celular**:

- **ERRADO**: Colocar o card de *Opções de Configuração* antes do *Visor do Documento Gerado* no JSX achando que no desktop ficarão lado a lado. No mobile, isso joga o resultado gerado para o fim da página!
- **CORRETO**:
  1. **1º elemento no JSX**: Card Principal com o Documento Gerado (`text-2xl sm:text-4xl font-mono`) + Botões de Ação lado a lado (`Copiar` + `Gerar Novo`).
  2. **2º elemento no JSX**: Controles compactos de configuração (ex.: `Pontuação`, `Estado UF`, `Padrão Numérico/Alfanumérico`).
  3. **3º elemento no JSX**: Informações complementares (Anatomia/Região Fiscal, Histórico Recente, Conteúdo Educativo).

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
3. **Gaveta Mobile (`Sheet` + `SidebarNav`) Leve e Animada**:
   - `SheetOverlay` e `SheetContent` devem utilizar animações `@keyframes` aceleradas por GPU (`translate3d` + `cubic-bezier(0.32, 0.72, 0, 1)` em `240ms`).
   - Na `SidebarNav`, exibir no topo apenas **Visão Geral** e **Ferramentas Ativas**, mantendo as categorias de catálogo futuro **colapsadas por padrão (accordion)** para montar apenas ~10 nós DOM na abertura instantânea.

---

## 6. Linguagem Limpa (Zero Menções a Sites de Referência ou Jargões Internos)

Todas as ferramentas do **DevToolsBR** são implementações próprias e independentes. Na interface visível ao usuário (`src/`):
- **PROIBIDO** citar nomes de sites externos (ex.: *"4Devs"*, *"Investidor10"*).
- **PROIBIDO** exibir jargões internos de engenharia ou implementação nos títulos, subtítulos, badges ou cards (ex.: *"Motor Módulo 11"*, *"Módulo 11"*, *"Mod-11"*, *"Motor Financeiro"*, *"100% Client-Side"*).
- Usar sempre linguagem clara, direta e focada no usuário final (ex.: *"Cálculo Oficial da Receita Federal"*, *"Dígitos Verificadores"*, *"Equivalência Composta de Taxas"*).

---

## 7. Gate Obrigatório: Playwright E2E, Contenção Geométrica e Snapshots Visuais (Desktop & Mobile)

Nenhuma tarefa ou branch pode ser aprovada sem validação automatizada no **Playwright** (`playwright.config.ts` e `tests/e2e/layout-and-snapshots.spec.ts`) em **Desktop (`1440x900`)** e **Mobile (`375x667`)**:

1. **Contenção Geométrica de Cards (`[data-slot="card"]`)**:
   - Todo `Card` deve possuir `min-w-0 overflow-hidden` e `CardHeader` deve utilizar `flex min-w-0 flex-col gap-1.5`.
   - Em cards de catálogo (4 colunas no desktop), **nunca** colocar `[Ícone] + [Título Completo] + [Badge]` na mesma linha horizontal. Utilizar sempre o padrão **Vercel / Linear Card Header**:
     - **Linha 1**: `<div className="flex items-center justify-between gap-2">` com o Ícone à esquerda e a `Badge` (`Disponível` / `Catálogo`) à direita.
     - **Linha 2**: `<CardTitle className="mt-2 ... line-clamp-1">` ocupando 100% da largura útil do card.
   - O teste automatizado verifica que nenhum elemento filho (`badge`, `card-title`, `h1..h4`, `button`, `input`) ultrapasse as bordas laterais do card (`childBox.right <= cardBox.right + 1` e `childBox.left >= cardBox.left - 1`).
2. **Snapshots Visuais Determinísticos (`toHaveScreenshot`)**:
   - Todo worker que implementar ou alterar uma rota deve adicionar/atualizar o teste da rota em `tests/e2e/layout-and-snapshots.spec.ts` e gerar os snapshots Desktop (`1440x900`) e Mobile (`375x667`) via `npm run test:e2e:snapshots`.
   - O agente verificador (`@verifier` / `@pw-verifier`) é **obrigado** a:
     1. Executar `npm run test:e2e` e confirmar 100% de aprovação.
     2. Inspecionar visualmente cada arquivo `.png` gerado em `tests/e2e/__screenshots__/` usando a ferramenta `read_file` antes de aprovar o merge.
