# Registro de Aprendizados e Prevenção de Erros (`lessons-learned.md`)

Este documento registra os principais incidentes reais de layout, hidratação, integração com APIs externas, testes E2E e infraestrutura encontrados durante a evolução do **DevToolsBR**, convertendo cada caso em uma regra obrigatória e em um gate automatizado para que nenhum erro se repita.

---

## 1. Overflow de Badges em `CardHeader` CSS Grid

- **Problema Real:** Em cards de catálogo (4 colunas no desktop) e em cards com título longo + `Badge` de status (`Disponível` / `Catálogo`), a badge vazava além da borda direita do card.
- **Causa Raiz:** O `CardHeader` padrão do `shadcn/ui` utilizava CSS Grid com título e ação/badge competindo na mesma linha horizontal e sem `min-w-0` no container pai, impedindo o encolhimento de filhos flex/grid e causando estouro horizontal.
- **Solução Adotada:**
  - `Card` (`src/components/ui/card.tsx`) passou a exigir `min-w-0 overflow-hidden` e `CardHeader` passou a usar `flex min-w-0 flex-col gap-1.5`.
  - Cards de catálogo passaram a usar o layout de **2 linhas** (Linha 1: Ícone à esquerda + `Badge` à direita via `flex items-center justify-between gap-2`; Linha 2: `<CardTitle className="mt-2 line-clamp-1">`).
- **Regra de Prevenção & Gate Automatizado:**
  - Seguir o padrão de 2 linhas descrito em [`styleguide.md`](./styleguide.md) e [`mobile-ux-guidelines.md`](./mobile-ux-guidelines.md).
  - Gate em [`tests/e2e/layout-and-snapshots.spec.ts`](../../tests/e2e/layout-and-snapshots.spec.ts): asserção automatizada de **Bounding Box Containment** validando em todos os `[data-slot="card"]` que `childBox.right <= cardBox.right + 1` e `childBox.left >= cardBox.left - 1` para `[data-slot="badge"]`, `[data-slot="card-title"]`, `h1..h4`, `button` e `input`, além de `scrollWidth <= innerWidth`.

---

## 2. Busca Mobile Quebrada com Dropdown de `100px` e Duplo Botão `×`

- **Problema Real:** No mobile (`375×667`), o campo de busca inline no `SiteHeader` ficava espremido com um dropdown de resultados preso à largura minúscula do input (`~100px`), além de exibir dois botões `×` sobrepostos dentro do campo no WebKit/mobile.
- **Causa Raiz:**
  1. Uso de `<input type="search">` nativo, no qual navegadores WebKit/iOS/Android renderizam um ícone `×` nativo ao lado do botão `<X>` customizado.
  2. Dropdown posicionado com `left-0 right-0` relativo a um container estreito no header mobile.
- **Solução Adotada (`src/components/layout/site-header.tsx`):**
  - Substituição por `type="text"` mantendo apenas o botão `<X>` controlado pelo React.
  - No mobile (`< sm`), o header exibe um botão compacto `Buscar...` (`h-9 px-3 gap-2`) que abre um **modal overlay de largura total** (`fixed inset-x-3 top-16 z-50 rounded-xl border bg-popover p-3 shadow-2xl`).
  - No desktop (`>= sm`), o dropdown de resultados utiliza largura fixa confortável (`w-[420px] right-0`).
- **Regra de Prevenção & Gate Automatizado:**
  - **Proibido** `<input type="search">` e dropdowns de busca com largura acoplada ao botão mobile.
  - Coberto por testes E2E dedicados no projeto `mobile` (`tests/e2e/layout-and-snapshots.spec.ts` + snapshot `tests/e2e/__screenshots__/mobile/mobile-search-overlay.png`) e testes unitários em [`src/components/layout/site-header.test.tsx`](../../src/components/layout/site-header.test.tsx).

---

## 3. Redundância de Links no Header + Menu Lateral Pesado sem Animação

- **Problema Real:** O header superior duplicava links de ferramentas já presentes na sidebar/drawer, e a gaveta lateral mobile abria de forma abrupta, travando em dispositivos modestos e truncando nomes de ferramentas no desktop (`w-60`).
- **Causa Raiz:**
  1. Links extras competindo por espaço horizontal no `SiteHeader`.
  2. Abertura da `SidebarNav` com todas as categorias expandidas no mobile (dezenas de nós DOM montados no primeiro frame) e transição sem aceleração por GPU no `Sheet`.
  3. Largura de `w-60` (`240px`) na `<aside>` desktop insuficiente para nomes compostos ao lado de badges.
- **Solução Adotada:**
  - Remoção dos links redundantes no `SiteHeader`, mantendo apenas drawer mobile, marca, breadcrumb contextual (desktop), busca e alternância de tema.
  - `SheetOverlay` e `SheetContent` (`src/components/ui/sheet.tsx` + `src/app/globals.css`) com `@keyframes` acelerados por GPU (`translate3d` + `cubic-bezier(0.32, 0.72, 0, 1)` em `240ms` / `200ms`).
  - `SidebarNav` (`src/components/layout/sidebar-nav.tsx`) configurada com `defaultExpanded` (categorias abertas) no desktop dentro de `<aside className="... w-[268px] ...">` (`app-shell.tsx`) e `defaultExpanded={false}` (categorias colapsadas em acordeão) no `<Sheet>` mobile.
- **Regra de Prevenção & Gate Automatizado:**
  - Manter a largura canônica `w-[268px]` no desktop e `defaultExpanded={false}` no mobile.
  - Validado por [`src/components/layout/sidebar-nav.test.tsx`](../../src/components/layout/sidebar-nav.test.tsx) e snapshot `tests/e2e/__screenshots__/mobile/mobile-drawer.png`.

---

## 4. Inversão de Prioridade Above-the-Fold vs. Compressão Excessiva no Mobile

- **Problema Real:** Em um primeiro momento, controles secundários apareciam no DOM antes do resultado principal (jogando o documento gerado para fora da dobra mobile); posteriormente, ao tentar forçar toda a calculadora a caber em `667px`, inputs foram reduzidos para `h-8`, botões de ano (`1a`..`30a`) e incrementos para `px-1.5 py-0.5` (`~18px`–`20px`) com `gap-1`, e o status BCB foi truncado (`"Dól"`).
- **Causa Raiz:** Tratar o viewport `375×667` comprimindo alvos de toque e espaçamentos abaixo do limite ergonômico em vez de priorizar a ordem do DOM e o ritmo vertical limpo.
- **Solução Adotada:**
  - **Prioridade no DOM:** Ação/resultado principal sempre primeiro no JSX (`lg:col-span-8`), seguido de parâmetros secundários (`lg:col-span-4`).
  - **Ergonomia Preservada:** Inputs, selects e ações principais sempre em `h-10` (`40px`); chips de período (`grid-cols-5 gap-2`), presets e botão `Sincronizar` com ícone + texto legível em `h-8` (`32px`); incrementos inline em `h-7` (`28px`) com `gap-2` (`8px`); texto de status BCB com quebra natural (`leading-relaxed`, sem `whitespace-nowrap`).
- **Regra de Prevenção & Gate Automatizado:**
  - Seguir as alturas e espaçamentos de [`styleguide.md`](./styleguide.md) e [`mobile-ux-guidelines.md`](./mobile-ux-guidelines.md).
  - Gate em `tests/e2e/layout-and-snapshots.spec.ts` verificando no viewport `375×667` que `refresh-bcb-indicators` e chips de ano (`1a`, `10a`) possuem `height >= 30`, espaçamento horizontal `>= 6px`, `#mainValue` possui `height >= 38`, e `#amount` permanece visível sem overflow.

---

## 5. Espaçamentos e Tipografias Inconsistentes entre Módulos

- **Problema Real:** Cada ferramenta (`cpf`, `cnpj`, `compound-interest`) possuía seu próprio cabeçalho `<h1>` escrito à mão, paddings divergentes (`px-3 py-3` vs `p-4`), tamanhos de `CardTitle` diferentes e micro-textos com `text-[11px]`.
- **Causa Raiz:** Ausência de um componente único de cabeçalho de ferramenta e de uma escala tipográfica/espacial oficial documentada.
- **Solução Adotada:**
  - Criação do componente compartilhado `<ToolPageHeader />` (`src/components/layout/tool-page-header.tsx`) com testes unitários (`tool-page-header.test.tsx`).
  - Criação de [`styleguide.md`](./styleguide.md) unificando `AppShell` (`px-4 py-4 sm:px-6 sm:py-6 lg:px-8`), `space-y-4 sm:space-y-5`, `gap-4`, `p-4 sm:p-5`, hierarquia tipográfica única e proibição estrita de `text-[10px]` / `text-[11px]` (mínimo `text-xs`).
- **Regra de Prevenção & Gate Automatizado:**
  - Toda nova feature deve importar `<ToolPageHeader />` e seguir os tokens de [`styleguide.md`](./styleguide.md); revisões e auditorias visuais verificam consistência entre os snapshots de todas as rotas.

---

## 6. Piscada (*Flicker*) de Taxas CDI/Selic no Cliente

- **Problema Real:** Ao abrir `/calculadora-juros-compostos`, o usuário via inicialmente taxas estáticas antigas ou estados vazios que piscavam segundos depois quando o `fetch("/api/indicators")` no cliente concluía.
- **Causa Raiz:** Inicializar o estado do componente Client com valores hardcoded ou buscar indicadores apenas em `useEffect` pós-hidratação.
- **Solução Adotada (`src/app/calculadora-juros-compostos/page.tsx` + `compound-interest-skeleton.tsx`):**
  - A rota foi transformada em um **Server Component assíncrono** (`export const dynamic = "force-dynamic"`) envolto em `<React.Suspense fallback={<CompoundInterestSkeleton />}>`.
  - `CompoundInterestServer` resolve `await getMarketIndicators()` no servidor e injeta `initialIndicators` prontos diretamente na hidratação de `<CompoundInterestFeature />`, sem flicker no cliente.
- **Regra de Prevenção & Gate Automatizado:**
  - Dados de mercado iniciais devem sempre ser resolvidos via Server Component + `<Suspense>` + `<Skeleton>` espelhado nas dimensões finais.
  - Coberto por [`src/app/calculadora-juros-compostos/page.test.tsx`](../../src/app/calculadora-juros-compostos/page.test.tsx) e pelos testes de componente da feature.

---

## 7. HTTP `304` com Corpo Vazio da CDN Azure Front Door do BCB na Série `4389`

- **Problema Real:** Consultas à API SGS do Banco Central (`https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json`) retornavam intermitentemente HTTP `304 Not Modified` ou status `200` com corpo vazio a partir da CDN Azure Front Door, derrubando a taxa DI para o fallback estático.
- **Causa Raiz:** Chave de cache envenenada na borda da CDN do BCB para o endpoint `/ultimos/1` em determinadas séries.
- **Solução Adotada (`src/services/bcb/bcb-client.ts`):**
  - Detecção explícita de erro retentável (`BcbHttpError` com `status === 304` ou `BcbEmptyBodyError` via `isRetryableLatestError`).
  - `fetchLatestPointsWithRetry` executa retry automático consultando `ultimos/2` para contornar a chave de cache `/ultimos/1`.
  - `selectLatestBcbPoint` ordena os pontos retornados pela data `DD/MM/YYYY` (`parseBcbDateKey`) para escolher o registro mais recente, e cada série possui fallback isolado via `Promise.allSettled` + `unwrapIndicator`.
- **Regra de Prevenção & Gate Automatizado:**
  - Nunca assumir que `ultimos/1` ou a ordem do array da API externa são garantidos; sempre validar corpo não vazio, tratar `304`/empty body com retry (`ultimos/2`) e manter fallback granular por série.
  - Coberto por [`src/services/bcb/bcb-client.test.ts`](../../src/services/bcb/bcb-client.test.ts) e [`src/app/api/indicators/route.test.ts`](../../src/app/api/indicators/route.test.ts).

---

## 8. Persistência do Tema sem FOUC e Hidratação Limpa

- **Problema Real:** Alternar para Dark Mode causava flash branco (*FOUC*) no carregamento inicial ou warnings de hidratação no React (`hydration mismatch` / `setState` síncrono em `useEffect`).
- **Causa Raiz:** Ler `localStorage` somente após a montagem do componente React no cliente ou armazenar o tema apenas em `useState(false)`.
- **Solução Adotada:**
  - `THEME_INIT_SCRIPT` inline no `<head>` em [`src/app/layout.tsx`](../../src/app/layout.tsx) sincroniza `.dark` em `document.documentElement` antes da pintura inicial (`suppressHydrationWarning` em `<html>`).
  - [`src/components/layout/site-header.tsx`](../../src/components/layout/site-header.tsx) utiliza `React.useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getThemeServerSnapshot)` com evento customizado `"devtools-theme-change"` e `"storage"`.
- **Regra de Prevenção & Gate Automatizado:**
  - Qualquer leitura de preferência visual que afete o primeiro frame (tema, densidade) deve usar script pré-hidratação em `<head>` + `useSyncExternalStore` em vez de `useState` + `useEffect`.
  - Validado por [`src/components/layout/site-header.test.tsx`](../../src/components/layout/site-header.test.tsx) e pelos testes E2E sem erros de hidratação.

---

## 9. E2E Determinístico com Mock Server Local & CI

- **Problema Real:** Testes Playwright que dependiam da API pública do BCB falhavam de forma intermitente por latência, limite de rede ou alteração diária das taxas (quebrando assertions de cálculos e snapshots), além de timeouts no `webServer` quando o Playwright checava `url:` em portas isoladas.
- **Causa Raiz:** Acoplamento de E2E à rede externa e verificação de prontidão de servidores auxiliares via polling HTTP em vez de sinalização direta de stdout.
- **Solução Adotada:**
  - Servidor mock determinístico em [`tests/mocks/bcb-mock-server.mjs`](../../tests/mocks/bcb-mock-server.mjs) (porta `4100`, respondendo séries SGS como `4389` = `14.15`, `432` = `14.25`, `13522` = `4.50`, `1` = `5.7845`).
  - Configuração em [`playwright.config.ts`](../../playwright.config.ts) injetando `BCB_API_BASE_URL: "http://127.0.0.1:4100"` no `next start -p 3100 -H 127.0.0.1` e utilizando `wait: { stdout: /BCB SGS mock server listening on/ }` e `wait: { stdout: /Ready in/ }` com `reuseExistingServer: false`.
- **Regra de Prevenção & Gate Automatizado:**
  - Todo serviço externo integrado à aplicação deve possuir variável de ambiente de base URL (`BCB_API_BASE_URL`) e mock local determinístico para `test:e2e`.
  - O Playwright sempre sobe o mock + servidor Next.js em modo determinístico antes da suíte E2E.

---

## 10. Worktrees Git com `node_modules` Symlinkado, Turbopack & Pre-Commit Hook

- **Problema Real:** Ao executar `npm run build` dentro de uma worktree Git isolada (`.worktrees/*`) cujo `node_modules` é um symlink para a raiz do repositório, o bundler do Next.js/Turbopack (`@tailwindcss/postcss`) falhou ao resolver módulos fora do root da worktree. Adicionalmente, commits via CLI sem `asdf` no `PATH` falhavam no hook Husky.
- **Causa Raiz:**
  1. Resolução estrita de caminhos reais (*realpath*) pelo Turbopack ao atravessar symlinks que apontam para fora da worktree.
  2. Ambientes não-interativos de Git GUI/subshell sem os shims do `asdf` carregados no `PATH`.
- **Solução Adotada:**
  - Worktrees executam `npm run lint`, `npm run typecheck` e `vitest` isoladamente; o `npm run build` e a suíte `npm run test:e2e` / `npm run test:e2e:snapshots` rodam na worktree principal após o merge em `main`.
  - [`.husky/pre-commit`](../../.husky/pre-commit) inicia explicitamente com `export PATH="$HOME/.asdf/shims:$PATH"` e executa em sequência `npm run lint`, `npm run typecheck`, `npm run test:coverage` e `npm run build && npm run test:e2e`.
- **Regra de Prevenção & Gate Automatizado:**
  - Nunca bypassar o hook final na `main` com `--no-verify` ou `HUSKY=0`.
  - Gates contínuos: `@typescript-eslint/no-explicit-any: "error"` em [`eslint.config.mjs`](../../eslint.config.mjs), limiar `>= 90%` em [`vitest.config.ts`](../../vitest.config.ts) e [`scripts/check-e2e-coverage.mjs`](../../scripts/check-e2e-coverage.mjs) validando todas as rotas de `src/app/` e ferramentas `"ready"` em `src/config/tools-registry.ts`.
