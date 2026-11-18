# Styleguide Oficial e Design System (`styleguide.md`)

Este documento define os **tokens canônicos, escalas tipográficas, espaçamentos, anatomia de telas e regras anti-desvio** do projeto **DevToolsBR**. Toda ferramenta existente ou futura em `src/features/` e componente compartilhado em `src/components/` deve seguir **100%** estas especificações para garantir consistência visual entre Desktop (`1440×900`) e Mobile (`375×667`).

---

## 1. Paleta de Cores & Temas (Light / Dark)

O sistema de temas é baseado em **variáveis CSS OKLCH** definidas em [`src/app/globals.css`](../../src/app/globals.css) e mapeadas no `@theme inline` do Tailwind CSS v4 com suporte à variante `@custom-variant dark (&:is(.dark *))`.

### 1.1. Tokens Semânticos (`:root` e `.dark`)

| Token CSS | Classe Tailwind | Light (`:root`) | Dark (`.dark`) | Uso Canônico |
| :--- | :--- | :--- | :--- | :--- |
| `--background` | `bg-background` | `oklch(0.985 0.003 250)` | `oklch(0.135 0.02 260)` | Fundo principal da aplicação (`AppShell`) |
| `--foreground` | `text-foreground` | `oklch(0.16 0.025 255)` | `oklch(0.975 0.005 255)` | Texto primário de alta legibilidade |
| `--card` | `bg-card` | `oklch(1 0 0)` | `oklch(0.175 0.022 260)` | Superfície de `Card` e `aside` (`bg-card/40`) |
| `--muted` | `bg-muted` | `oklch(0.955 0.006 255)` | `oklch(0.225 0.024 260)` | Sub-cards internos, barras de status e chips |
| `--muted-foreground` | `text-muted-foreground` | `oklch(0.46 0.022 255)` | `oklch(0.7 0.02 255)` | Subtítulos, descrições e rótulos auxiliares |
| `--primary` | `bg-primary` / `text-primary` | `oklch(0.49 0.21 264)` | `oklch(0.63 0.195 264)` | Ação primária, ícone ativo e foco |
| `--secondary` | `bg-secondary` | `oklch(0.955 0.008 255)` | `oklch(0.235 0.025 260)` | Botões e badges secundários |
| `--accent` | `bg-accent` | `oklch(0.945 0.014 260)` | `oklch(0.245 0.03 260)` | Hover em itens de menu e seleção |
| `--destructive` | `bg-destructive` / `text-destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.63 0.22 27)` | Erros de validação e alertas destrutivos |
| `--border` / `--input` | `border-border` / `border-input` | `oklch(0.905 0.009 255)` | `oklch(0.265 0.025 260)` | Bordas sutis (`border-border/80`) e inputs |

### 1.2. Acento Financeiro e Semântico

- **Acento Financeiro (`emerald-600` / `emerald-500`)**: usado exclusivamente em indicadores financeiros positivos, total de rendimentos/juros compostos, badges de economia/isenção (`Isento de IR`) e presets ativos do BCB (`CDI`, `Selic`, `IPCA+6%`).
  - Exemplo canônico de destaque: `text-emerald-600 dark:text-emerald-400` para valores positivos e `border-emerald-500 bg-emerald-500/10` para presets selecionados.
- **Raios de Borda (`--radius: 0.625rem`)**: `rounded-lg` (`--radius-lg`, `10px`) para botões/inputs/itens de navegação e `rounded-xl` (`--radius-xl`, `14px`) para cards e blocos de ferramentas.

### 1.3. Persistência do Tema sem FOUC e Hidratação Limpa

1. **Script Pré-Hidratação (`src/app/layout.tsx`)**: `THEME_INIT_SCRIPT` é injetado de forma síncrona no `<head>` (`suppressHydrationWarning` no `<html>`), lendo `localStorage.getItem("theme")` e aplicando a classe `.dark` em `document.documentElement` antes da primeira pintura.
2. **Estado Reativo sem Cascading Renders (`src/components/layout/site-header.tsx`)**: a leitura do tema no cliente usa `React.useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getThemeServerSnapshot)` (com `getThemeServerSnapshot` retornando `false` no SSR) e sincroniza alterações entre abas via evento `"storage"` e evento customizado `"devtools-theme-change"`.

---

## 2. Escala Tipográfica Única

### 2.1. Famílias de Fontes (`next/font/google` + `globals.css`)

- **Sans-Serif Principal (`font-sans`)**: `Plus Jakarta Sans` (`--font-jakarta`, pesos `400`, `500`, `600`, `700`, `800`), com *optical features* `"cv02", "cv03", "cv04", "cv11"` aplicadas ao `body`.
- **Monoespaçada Numérica (`font-mono`)**: `JetBrains Mono` (`--font-jetbrains-mono`, pesos `400`, `500`, `600`, `700`), sempre com `font-variant-numeric: tabular-nums` ativo em `code, pre, .font-mono` para alinhamento perfeito de dígitos em documentos e tabelas financeiras.

### 2.2. Hierarquia Tipográfica Canônica

| Papel na Interface | Classes Tailwind Obrigatórias | Tamanho Efetivo (Mobile → Desktop) |
| :--- | :--- | :--- |
| **`H1` de Página (`<ToolPageHeader />`)** | `text-lg sm:text-2xl font-bold tracking-tight` | `18px` → `24px` |
| **Subtítulo de Página (`<ToolPageHeader />`)** | `text-xs sm:text-sm text-muted-foreground leading-relaxed` | `12px` → `14px` |
| **`H2` de Seção** | `text-base sm:text-lg font-bold tracking-tight` | `16px` → `18px` |
| **`CardTitle`** | `text-sm sm:text-base font-bold leading-snug` | `14px` → `16px` |
| **`Label` de Formulário** | `text-xs sm:text-sm font-medium` | `12px` → `14px` |
| **Corpo / Descrição de Card** | `text-xs sm:text-sm leading-relaxed text-muted-foreground` | `12px` → `14px` |
| **Valores Hero (`CPF` / `CNPJ`)** | `font-mono text-2xl sm:text-3xl font-bold tracking-wider` | `24px` → `30px` |
| **KPIs Financeiros (`#amount`)** | `font-mono text-2xl sm:text-3xl font-bold tracking-tight` | `24px` → `30px` |
| **Texto Auxiliar / Badges / Chips** | `text-xs font-medium` | `12px` (mínimo absoluto) |

> **Regra Estrita de Tamanho Mínimo:** É **PROIBIDO** utilizar `text-[10px]`, `text-[11px]` ou qualquer classe arbitrária abaixo de `12px` em qualquer componente, badge, legenda ou tabela. O menor tamanho permitido em toda a plataforma é **`text-xs` (`12px`)**.

---

## 3. Escala Canônica de Espaçamento & Grid

### 3.1. `AppShell` (`src/components/layout/app-shell.tsx` e `site-header.tsx`)

| Região | Especificação Canônica | Comportamento |
| :--- | :--- | :--- |
| **Header Superior (`SiteHeader`)** | `h-14` (`56px`), `px-3 sm:px-6 lg:px-8` | Fixo (`sticky top-0 z-40`), sem links redundantes de ferramentas |
| **Desktop Sidebar (`<aside>`)** | `hidden w-[268px] shrink-0 border-r border-border/80 bg-card/40 lg:block` | `<SidebarNav defaultExpanded />` com categorias abertas |
| **Mobile Drawer (`<Sheet>`)** | `w-72` (gaveta lateral esquerda `SheetContent` `p-0`) | `<SidebarNav defaultExpanded={false} />` com categorias colapsadas |
| **Área Principal (`<main>`)** | `min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8` | Container interno `mx-auto w-full max-w-[1440px]` |

### 3.2. Itens da Sidebar (`src/components/layout/sidebar-nav.tsx`)

- Ritmo vertical do `<nav>`: `flex flex-col gap-5 px-3.5 py-4`.
- **Ferramentas Ativas**: lista com `flex flex-col gap-1.5`; cada link usa `px-3 py-2.5 text-sm font-medium rounded-lg` (`~40px` de altura de linha confortável).
- **Catálogo por Categoria**: botões de acordeão com `px-3 py-2 text-xs sm:text-[13px] font-semibold` e `gap-2` entre categorias; lista expandida com `mt-1 flex flex-col gap-1 pl-2` e cada item usando `px-3 py-2 text-[13px]`.

### 3.3. Ritmo de Página, Grids e Cards

| Elemento | Token Canônico | Valor Efetivo |
| :--- | :--- | :--- |
| **Espaçamento vertical entre blocos da página** | `space-y-4 sm:space-y-5` | `16px` mobile / `20px` desktop |
| **Grid entre cards irmãos** | `gap-4` | `16px` uniforme em mobile e desktop |
| **Padding interno de `Card` padrão** | `p-4 sm:p-5` com `space-y-4` interno | `16px` mobile / `20px` desktop |
| **Padding interno de sub-cards** | `p-3.5 sm:p-4` | `14px` mobile / `16px` desktop |
| **Gap interno de grids de formulário** | `grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5` | `16px` mobile / `20px` desktop |

### 3.4. Altura Padrão e Espaçamento de Controles Interativos

| Controle | Altura Canônica | Espaçamento Adjacente | Observações |
| :--- | :--- | :--- | :--- |
| **`Input`, `Button` primário/secundário, `SelectTrigger`, `TabsList`** | `h-10` (`40px`) | `gap-2.5` / `gap-3` | Altura única no mobile e desktop |
| **Chips secundários, botão `Sincronizar`, seleção de anos (`1a`..`30a`), toggles segmentados** | `h-8` (`32px`) | `gap-2` (`8px`) | `Sincronizar` exibe ícone + rótulo `"Sincronizar"` sempre visível |
| **Incrementos rápidos inline (`+1k`, `+5k`, `+200`)** | `h-7` (`28px` mínimo) | `gap-2` (`8px`) | Nunca usar `h-5` ou `px-1.5` espremidos |

---

## 4. Anatomia Obrigatória de Tela de Ferramenta

Toda página de ferramenta em `src/features/<category>/<slug>/index.tsx` deve seguir exatamente esta árvore estrutural:

```text
div.w-full.space-y-4.sm:space-y-5.pb-8
├── 1. <ToolPageHeader />                  (Ícone + H1 + Descrição curta + ações opcionais à direita)
├── 2. <Tabs>                              (Quando houver modos: grid w-full grid-cols-3 h-10 p-1)
├── 3. Grid Principal (grid-cols-1 lg:grid-cols-12 gap-4)
│   ├── Área Principal (lg:col-span-8)     (PRIMEIRO no DOM: Resultado / Simulação / Ação Primária)
│   └── Área Lateral (lg:col-span-4)       (SEGUNDO no DOM: Parâmetros secundários / Histórico / Dicas)
└── 4. Cards Educativos Inferiores         (grid-cols-1 md:grid-cols-2 gap-4 — SEM <Separator /> solto)
```

### Regras Estruturais da Anatomia

1. **Cabeçalho Unificado (`<ToolPageHeader />`)**: implementado em [`src/components/layout/tool-page-header.tsx`](../../src/components/layout/tool-page-header.tsx). Nenhuma feature deve recriar seu próprio `<h1>` manualmente.
2. **Abas Compactas (`<Tabs>`)**: usar `grid w-full grid-cols-3 h-10 p-1` com ícone (`size-3.5 shrink-0`) e rótulo curto (`text-xs sm:text-sm`) que nunca quebre em 2 linhas no viewport `375px`.
3. **Ordem do DOM = Prioridade Mobile**: a ação principal (card do valor gerado com botões `Copiar` / `Gerar Novo` lado a lado em `grid-cols-2 gap-2.5`, ou card de simulação com `#mainValue` e `#amount`) vem **sempre primeiro no JSX** antes de parâmetros secundários ou histórico.
4. **Card Header Anti-Overflow**: todo `Card` usa `min-w-0 overflow-hidden` e `CardHeader` usa `flex min-w-0 flex-col gap-1.5`. Em cards de catálogo com ícone + badge, usar sempre **2 linhas** (Linha 1: ícone à esquerda + `Badge` à direita; Linha 2: `<CardTitle className="mt-2 line-clamp-1">`).
5. **Proibido `<Separator />` Solto entre Seções**: separar seções apenas usando o ritmo vertical `space-y-4 sm:space-y-5` (ou `border-t` dentro de um mesmo `CardContent` quando delimitando barra de ações).

---

## 5. Checklist Anti-Desvio para Novas Features

Antes de abrir PR ou finalizar uma tarefa, valide todos os itens abaixo:

- [ ] A tela utiliza `<ToolPageHeader />` em vez de um cabeçalho ad-hoc?
- [ ] Não há nenhuma classe `text-[10px]` ou `text-[11px]` no código (mínimo `text-xs`)?
- [ ] O container raiz da feature usa `w-full space-y-4 sm:space-y-5 pb-8`?
- [ ] Todos os grids entre cards irmãos usam `gap-4` e padding de card `p-4 sm:p-5`?
- [ ] Todos os `Input`, `SelectTrigger`, `TabsList` e `Button` principais têm altura `h-10` (`40px`), e chips/botões secundários têm no mínimo `h-8` (`32px`) ou `h-7` (`28px` em incrementos) com `gap-2`?
- [ ] No mobile (`375×667`), o conteúdo principal e `#amount` / visor principal aparecem sem corte, sem truncamento indevido e com `0` violações de contenção geométrica?
- [ ] A linguagem da UI é 100% limpa (sem citar *"4Devs"*, *"Investidor10"*, *"Módulo 11"*, *"Mod-11"*, *"Motor"* ou *"Client-Side"*)?
- [ ] A cobertura Vitest V8 do módulo é `>= 90%` (lines, branches, functions, statements), `npm run lint` (`no-explicit-any: "error"`), `npm run typecheck`, `npm run test:e2e:coverage` e `npm run test:e2e` passam sem erros?
