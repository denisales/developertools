# Arquitetura do Projeto e Design System (`project-structure.md`)

Este documento define a arquitetura modular do projeto **DeveloperTools (4Devs + Investidor10 Clone)**, projetada especificamente para **desenvolvimento altamente paralelizado com Git Worktrees** e múltiplos agentes autônomos sem conflitos de merge.

---

## 1. Stack Tecnológica Principal

| Camada | Tecnologia | Justificativa |
| :--- | :--- | :--- |
| **Framework** | Next.js 15+ (App Router) | Server Components por padrão, roteamento baseado em arquivos, geração estática (SSG) e SEO nativo por rota (`Metadata` API). |
| **Linguagem** | TypeScript 5+ (`"strict": true`, Zero `any`) | Tipagem estática rigorosa com `"strict": true` em `tsconfig.json` e `"@typescript-eslint/no-explicit-any": "error"` no ESLint para proibir qualquer uso de `any`. |
| **Estilização** | Tailwind CSS + `shadcn/ui` | Componentes acessíveis (Radix UI), customizáveis, suporte nativo a Dark/Light mode e foco em responsividade mobile-first. |
| **Ícones** | `lucide-react` | Biblioteca de ícones leve, consistente e tree-shakable. |
| **Testes Unitários & Componentes** | Vitest (`@vitest/coverage-v8`) + Testing Library | Suíte rápida com cobertura mínima obrigatória de **90%** (`lines`, `branches`, `functions`, `statements`) em cada módulo de ferramenta. |
| **Testes E2E & Visuais** | Playwright + `scripts/check-e2e-coverage.mjs` | Verificação obrigatória de cobertura de rotas, cenários funcionais (`functional-scenarios.spec.ts`), contenção geométrica e snapshots Desktop (`1440x900`) / Mobile (`375x667`). |
| **Qualidade & Pre-Commit Gate** | ESLint + TypeScript Check + Husky (`.husky/pre-commit`) | Bloqueio automático em pre-commit e GitHub Actions CI exigindo `lint`, `typecheck`, `test:coverage`, `test:e2e:coverage` e `test:e2e`. |
| **Deploy & Hosting** | Vercel | Deploy contínuo integrado ao GitHub com Preview URLs por branch/PR e Edge Network global. |

---

## 2. Arquitetura Modular Orientada a Features (Feature-First / Plugin)

Para permitir que dezenas de agentes trabalhem simultaneamente em diferentes ferramentas usando **Git Worktrees** (`git worktree add` ou `workspace: "share"` no Swarm), o código de cada ferramenta é **100% isolado** em seu próprio diretório dentro de `src/features/<category>/<tool-slug>/`.

### Árvore de Diretórios do Projeto

```text
/home/denis/dev/developertools/
├── .husky/
│   └── pre-commit                         # Gate Git obrigatório (lint, typecheck, coverage >= 90%, e2e coverage, e2e)
├── docs/                                  # Documentação completa do projeto
│   ├── README.md                          # Índice mestre da documentação e gates de qualidade
│   ├── catalog/
│   │   └── 4devs-complete-map.md          # Mapeamento completo do 4Devs + Investidor10
│   ├── specs/
│   │   ├── cpf-generator.md               # Especificação funcional e algorítmica: CPF
│   │   ├── cnpj-generator.md              # Especificação funcional e algorítmica: CNPJ
│   │   └── compound-interest.md           # Especificação funcional e matemática: Juros Compostos
│   ├── architecture/
│   │   ├── mobile-ux-guidelines.md        # Diretrizes obrigatórias Mobile-First e gate visual Playwright
│   │   └── project-structure.md           # Este documento (Arquitetura, UI/UX e Governança de Qualidade)
│   └── plan/
│       ├── epics-and-tasks.md             # Backlog completo de Épicos e Tasks (TASK-000..TASK-095)
│       ├── parallel-worktrees-guide.md    # Guia de orquestração paralela com Git Worktrees
│       └── deploy-and-github.md           # Pre-commit, GitHub Actions CI/CD e deploy na Vercel
├── public/                                # Assets estáticos, ícones PWA, opengraph images
├── scripts/
│   └── check-e2e-coverage.mjs             # Verificador obrigatório de cobertura de rotas e ferramentas "ready"
├── tests/
│   └── e2e/
│       ├── functional-scenarios.spec.ts   # Cenários interativos E2E por rota/ferramenta
│       ├── layout-and-snapshots.spec.ts   # Checks geométricos + snapshots Desktop (1440x900) e Mobile (375x667)
│       └── __screenshots__/               # Snapshots visuais versionados (desktop/ e mobile/)
├── src/
│   ├── app/                               # Next.js App Router (Camada fina de roteamento e SEO)
│   │   ├── layout.tsx                     # Root Layout (Providers, Sidebar, Header Mobile, Toaster)
│   │   ├── page.tsx                       # Home Dashboard (Busca rápida, Favoritos, Grid por Categoria)
│   │   ├── gerador-de-cpf/
│   │   │   └── page.tsx                   # Rota fina -> importa <CpfGeneratorFeature />
│   │   ├── gerador-de-cnpj/
│   │   │   └── page.tsx                   # Rota fina -> importa <CnpjGeneratorFeature />
│   │   ├── calculadora-juros-compostos/
│   │   │   └── page.tsx                   # Rota fina -> importa <CompoundInterestFeature />
│   │   └── [toolSlug]/                    # (Opcional/Escalável) Roteamento dinâmico para ferramentas do registro
│   ├── components/
│   │   ├── ui/                            # Primitivos shadcn/ui (button, card, input, sheet, tabs, table, etc.)
│   │   ├── layout/                        # Shell da aplicação
│   │   │   ├── app-header.tsx             # Header fixo com busca global (Cmd+K) e menu mobile
│   │   │   ├── app-sidebar.tsx            # Sidebar categorizada para desktop
│   │   │   ├── mobile-nav-sheet.tsx       # Drawer/Bottom Sheet responsivo para navegação no celular
│   │   │   └── tool-page-shell.tsx        # Wrapper padrão de ferramenta (Título, Breadcrumb, Descrição, FAQ/SEO)
│   │   └── shared/                        # Componentes reutilizáveis entre ferramentas
│   │       ├── copy-button.tsx            # Botão de cópia rápida com feedback visual + toast
│   │       ├── result-box.tsx             # Caixa de exibição de resultado com fonte mono e ações rápidas
│   │       └── bulk-export-actions.tsx    # Ações de exportar TXT, CSV, JSON ou copiar lista
│   ├── config/
│   │   ├── tools-registry.ts              # Registro declarativo central de todas as ferramentas
│   │   └── tools-registry.test.ts         # Testes unitários do catálogo central
│   ├── features/                          # MÓDULOS ISOLADOS POR FERRAMENTA (Zero conflito entre Worktrees)
│   │   ├── generators/                    # Categoria: Geradores (Documentos, Pessoas, Veículos, Dados)
│   │   │   ├── cpf/                       # Worktree isolada: feat/task-001-cpf-generator
│   │   │   │   ├── index.tsx              # Componente principal e public API da feature
│   │   │   │   ├── cpf-utils.ts           # Lógica pura Mod-11, máscara, estados fiscais (9º dígito)
│   │   │   │   ├── cpf-utils.test.ts      # Testes unitários da lógica pura
│   │   │   │   ├── cpf-generator.test.tsx # Testes de componente (>= 90% coverage combinado)
│   │   │   │   └── ...
│   │   │   ├── cnpj/                      # Worktree isolada: feat/task-002-cnpj-generator
│   │   │   │   ├── index.tsx
│   │   │   │   ├── cnpj-utils.ts          # Lógica pura Mod-11 (numérico e alfanumérico), matriz/filial
│   │   │   │   ├── cnpj-utils.test.ts
│   │   │   │   ├── cnpj-generator.test.tsx
│   │   │   │   └── ...
│   │   │   └── ...                        # Demais geradores (rg, cnh, pis, titulo-eleitor, pessoa, etc.)
│   │   ├── validators/                    # Categoria: Validadores
│   │   │   ├── cpf/
│   │   │   ├── cnpj/
│   │   │   └── ...
│   │   ├── calculators/                   # Categoria: Calculadoras Financeiras e Matemáticas
│   │   │   ├── compound-interest/         # Worktree isolada: feat/task-003-compound-interest
│   │   │   │   ├── index.tsx              # View completa integrada
│   │   │   │   ├── compound-interest-math.ts      # Lógica matemática de juros compostos e conversão de taxas
│   │   │   │   ├── compound-interest-math.test.ts # Testes de precisão financeira
│   │   │   │   ├── compound-interest.test.tsx     # Testes de componente (>= 90% coverage combinado)
│   │   │   │   └── ...
│   │   │   └── ...
│   │   └── utilities/                     # Categoria: Texto, Dev, Rede, Conversores e Sorteadores
│   │       └── ...
│   ├── hooks/                             # Hooks globais (use-clipboard, use-local-history, use-media-query)
│   └── lib/                               # Utilitários puros globais (cn, formatters de moeda/número, mod11)
├── eslint.config.mjs                      # ESLint com "@typescript-eslint/no-explicit-any": "error"
├── playwright.config.ts                   # Projetos desktop (1440x900) e mobile (375x667)
├── tsconfig.json                          # TypeScript com "strict": true
├── vitest.config.ts                       # Vitest V8 com thresholds >= 90% (lines/branches/functions/statements)
├── vitest.setup.ts                        # Setup de testes unitários e de componente
└── package.json
```

---

## 3. Anatomia Interna de um Módulo (`src/features/<category>/<tool-slug>/`)

Cada ferramenta segue um contrato de arquivos padronizado para garantir consistência arquitetural e independência total:

1. **`<slug>-utils.ts` ou `<slug>-math.ts` (Pure Domain Logic)**
   - Funções 100% puras em TypeScript (`"strict": true`, zero `any`), sem dependência de React ou DOM.
   - Facilita testes automatizados instantâneos e reutilização entre Gerador e Validador (ex.: `generateCpf()`, `validateCpf()`, `formatCpf()`).
2. **`<slug>-utils.test.ts` e `<slug>.test.tsx` (Unit & Component Tests >= 90%)**
   - Testes unitários de lógica pura (casos de borda, dígitos verificadores, formatação com/sem pontuação, precisão decimal) e testes de componente React (interação de usuário, abas, botões, estados de erro/cópia).
   - **Meta obrigatória:** Todo módulo `src/features/<category>/<slug>/` deve atingir **>= 90% de cobertura** em **lines, branches, functions e statements** medidos pelo Vitest V8 (`npm run test:coverage`).
3. **`use-<slug>.ts` (State & Interaction Hook — quando aplicável)**
   - Encapsula estados de formulário, geração instantânea, histórico recente em `localStorage` e atalhos de teclado.
4. **`<slug>-view.tsx` / `index.tsx` (Client UI Component & Barrel Export)**
   - Interface construída com componentes `shadcn/ui`, responsiva e otimizada para toque em dispositivos móveis, exportando o componente principal e metadados necessários para a rota em `src/app/`.

---

## 4. Funcionamento do Registro Central (`src/config/tools-registry.ts`) sem Conflitos de Merge

Em projetos tradicionais, adicionar uma nova ferramenta exige editar a Sidebar, a Home, o Sitemap e o arquivo de rotas simultaneamente — o que gera **conflitos de merge constantes** quando múltiplos agentes trabalham em paralelo.

Para eliminar esse gargalo, adotamos o padrão **Pre-Seeded Declarative Tool Registry**:

1. **Pré-cadastro no Scaffold Inicial (Epic 0):**
   - O arquivo `src/config/tools-registry.ts` já nasce populado na branch `main` com o catálogo completo de ferramentas mapeadas do 4Devs e Investidor10.
   - Cada entrada possui o contrato `ToolDefinition`:
     ```ts
     export type ToolCategory =
       | 'generators'
       | 'validators'
       | 'calculators'
       | 'utilities';

     export interface ToolDefinition {
       id: string;                // ex: 'cpf-generator'
       slug: string;              // ex: '/gerador-de-cpf'
       title: string;             // ex: 'Gerador de CPF'
       shortTitle: string;        // ex: 'CPF'
       description: string;       // Descrição curta para cards e SEO meta description
       category: ToolCategory;
       iconName: string;          // Nome do ícone lucide-react
       status: 'ready' | 'priority' | 'planned';
       featured?: boolean;        // Destaque na Home (CPF, CNPJ, Juros Compostos)
       keywords: string[];        // Tags para busca instantânea no Header / Command Palette
     }
     ```
2. **Isolamento Total durante as Worktrees:**
   - Como o `tools-registry.ts` já contém os metadados de todas as ferramentas e as rotas prioritárias (`src/app/gerador-de-cpf/page.tsx`, `src/app/gerador-de-cnpj/page.tsx`, `src/app/calculadora-juros-compostos/page.tsx`) já apontam para suas respectivas pastas em `src/features/`, **cada agente de feature modifica exclusivamente os arquivos dentro de `src/features/<category>/<tool-slug>/`**.
   - **Resultado:** `git merge` de 3, 5 ou 10 worktrees paralelas ocorre de forma 100% limpa (`fast-forward` ou merge ortogonal sem sobreposição de arquivos).

---

## 5. Design System Mobile-First e UI/UX (`shadcn/ui`)

O site original do 4Devs possui layout legado focado em desktop. Nossa releitura utiliza uma estética moderna inspirada em **Vercel / Linear / Raycast / Investidor10**, priorizando usabilidade no celular (uma mão / polegar) e produtividade para desenvolvedores.

### 5.1. Diretrizes Mobile-First (Responsividade no Celular — ver [`mobile-ux-guidelines.md`](./mobile-ux-guidelines.md))
- **Regra Above-the-Fold (`375x667`)**: O resultado principal da ferramenta, os botões de ação (`Copiar` / `Gerar Novo`) e os controles essenciais devem caber integralmente na primeira tela do celular (`< 600px` de altura) sem necessidade de scroll.
- **Ordem do DOM = Prioridade Mobile**: O card do valor gerado e seus botões de ação vêm **sempre antes** dos controles secundários e seções explicativas no JSX.
- **Abas em Linha Única (`grid-cols-3`)**: Usar rótulos curtos (`Gerar CPF`, `Validar`, `Em Lote`) em `grid w-full grid-cols-3 h-10 p-1` para nunca quebrar linha nem sobrepor textos em `375px`.
- **Botões Lado a Lado (`grid-cols-2 gap-2.5`)**: Botões `Copiar` e `Gerar Novo` dispostos lado a lado no mobile (`h-10 sm:h-11`), evitando empilhamento vertical excessivo.
- **Busca Mobile em Overlay de Largura Total & Gaveta 60fps**:
  - Usar sempre `type="text"` (nunca `type="search"`, evitando duplo ícone `x`).
  - No mobile (`< sm`), a busca abre um modal/popover de largura total (`fixed inset-x-3 top-16`), e a gaveta lateral (`Sheet`) usa animações aceleradas por hardware com categorias futuras colapsadas por padrão.
- **Linguagem Limpa**: Proibido citar sites externos ou jargões como *"Módulo 11"*, *"Motor"* ou *"Client-Side"* na interface do usuário.

### 5.2. Temas (Dark / Light Mode) e Acessibilidade
- Suporte nativo a **Dark Mode** e **Light Mode** via variáveis CSS em HSL no `globals.css`.
- Contraste WCAG AA em todos os badges, textos secundários (`muted-foreground`) e gráficos financeiros (cores distintas para *Valor Investido* vs *Total em Juros*).
- Navegação completa por teclado (`Tab`, `Enter` para gerar/calcular, `Cmd/Ctrl + K` para buscar qualquer ferramenta instantaneamente).

### 5.3. SEO Técnico por Rota
- Cada ferramenta possui `Metadata` estática ou gerada via `generateMetadata`:
  - `title`: `"Gerador de CPF Válido Online (Com e Sem Pontuação) | DevTools"`
  - `description` otimizada para intenção de busca no Google.
  - Seção explicativa inferior em cada ferramenta ("Como funciona o cálculo de CPF", "Fórmula dos Juros Compostos", aviso legal de uso exclusivo para testes de software).

---

## 6. Governança de Qualidade, Cobertura e Política Zero `any`

Todas as alterações atuais e futuras no código-fonte estão sujeitas a quatro requisitos técnicos obrigatórios e automatizados:

1. **Política Zero `any` em TypeScript:**
   - `tsconfig.json` mantém `"strict": true`.
   - `eslint.config.mjs` configura `"@typescript-eslint/no-explicit-any": "error"`, bloqueando qualquer uso explícito de `any` em `src/` e `tests/`.
   - Use tipos explícitos, genéricos ou `unknown` com *type narrowing* seguro.
2. **Cobertura Unitária e de Componentes >= 90% (Vitest V8):**
   - Configurado em `vitest.config.ts` com `@vitest/coverage-v8` exigindo limiar mínimo de **90%** para **lines, branches, functions e statements**.
   - Cada módulo de ferramenta em `src/features/<category>/<slug>/` deve conter testes unitários da lógica de domínio e testes de componente cobrindo fluxos e ramos principais.
3. **Cobertura Obrigatória E2E (Rotas + Cenários Funcionais + Snapshots):**
   - Toda nova página/tela em `src/app/` e toda ferramenta com `status: 'ready'` em `src/config/tools-registry.ts` **deve obrigatoriamente** possuir:
     1. Registro validado pelo verificador de cobertura de rotas (`scripts/check-e2e-coverage.mjs` via `npm run test:e2e:coverage`);
     2. Cenários E2E funcionais e interativos em `tests/e2e/functional-scenarios.spec.ts`;
     3. Verificações geométricas de bounding-box (`[data-slot="card"]`, zero overflow) e snapshots visuais Desktop (`1440x900`) e Mobile (`375x667`) em `tests/e2e/layout-and-snapshots.spec.ts`, auditados visualmente por um agente Verifier.
4. **Git Pre-Commit Quality Gate (`.husky/pre-commit`):**
   - O hook `.husky/pre-commit` exige que todos os comandos abaixo passem com código de saída `0` antes que qualquer commit seja concluído:
     - `npm run lint`
     - `npm run typecheck`
     - `npm run test:coverage` (`>= 90%`)
     - `npm run test:e2e:coverage`
     - `npm run test:e2e` (executado sobre build atualizado)
