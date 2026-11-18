# Documentação do Projeto — DeveloperTools (4Devs + Investidor10)

Bem-vindo à documentação oficial do projeto **DeveloperTools**, uma plataforma moderna de geradores, validadores, calculadoras financeiras e utilitários para desenvolvedores, inspirada nas funcionalidades do [4Devs](https://www.4devs.com.br/) e na calculadora de juros compostos do [Investidor10](https://investidor10.com.br/calculadoras/juros-compostos/).

---

## 1. Visão Geral do Projeto

- **Framework & Stack:** Next.js (App Router) + TypeScript (`strict: true`, Zero `any`) + ESLint (`@typescript-eslint/no-explicit-any: "error"`) + Tailwind CSS + `shadcn/ui` + `lucide-react`.
- **Qualidade & Testes Automatizados:** Vitest com cobertura V8 obrigatória (`>= 90%` em linhas, branches, funções e statements), Playwright E2E (cenários funcionais + contenção geométrica + snapshots Desktop/Mobile) e gate local de pre-commit via Husky (`.husky/pre-commit`).
- **Experiência Mobile-First:** Interface projetada desde o início para uso ágil no celular (navegação via *Bottom Sheet / Drawer*, alvos de toque de `48px+`, cópia com 1 toque, geração instantânea no navegador, suporte a Dark/Light Mode).
- **Arquitetura Paralela (Git Worktrees Ready):** Cada ferramenta vive de forma 100% independente em `src/features/<category>/<tool-slug>/`, permitindo que múltiplos agentes autônomos desenvolvam ferramentas em paralelo sem conflitos de merge.
- **Deploy & Versionamento:** Pronto para deploy contínuo na **Vercel** e versionado no **GitHub** com validação automatizada em pre-commit e GitHub Actions CI (`lint`, `typecheck`, `test:coverage`, `test:e2e:coverage`, `build` e `test:e2e`).

---

## 2. Índice Mestre da Documentação (`docs/`)

### Catálogo e Mapeamento Completo (`docs/catalog/`)
- [**Catálogo Completo 4Devs + Investidor10 (`catalog/4devs-complete-map.md`)**](./catalog/4devs-complete-map.md)
  Mapeamento exaustivo de todos os Geradores, Validadores, Calculadoras e Utilitários de Texto/Dev/Rede/Imagem, com *slugs*, entradas, saídas e estimativa de complexidade.

### Especificações Funcionais e Algorítmicas (`docs/specs/`)
- [**Especificação: Gerador e Validador de CPF (`specs/cpf-generator.md`)**](./specs/cpf-generator.md)
  Regras do algoritmo Mod-11, seletor de Estado de Origem (9º dígito fiscal por UF), formatação com/sem pontuação, geração em lote e exportação.
- [**Especificação: Gerador e Validador de CNPJ (`specs/cnpj-generator.md`)**](./specs/cnpj-generator.md)
  Regras do algoritmo Mod-11 (pesos de 1º e 2º dígitos verificadores), suporte a Matriz (`0001`)/Filial, suporte numérico e alfanumérico (padrão RFB 2026) e geração em lote.
- [**Especificação: Calculadora de Juros Compostos (`specs/compound-interest.md`)**](./specs/compound-interest.md)
  Mapeamento completo da calculadora do Investidor10: Valor Inicial, Aporte Mensal, conversão exata de Taxa Anual/Mensal $(1 + i_a)^{1/12} - 1$, Período, 3 Cards de Resumo, Gráfico evolutivo e Tabela mês a mês.
- [**Especificação: Tabela de IR (Renda Fixa) e Visão de Valor Líquido (`specs/compound-interest-net-ir.md`)**](./specs/compound-interest-net-ir.md)
  Regras tributárias da Lei nº 11.033/2004 (`22,5%` a `15,0%` regressivo) + opção Isento (`0%` para LCI/LCA/CRI/CRA/Poupança), fórmulas de valor líquido, Golden Tests, UX Mobile Above-the-Fold (`TASK-003B`) e gates de qualidade.

### Arquitetura e Design System (`docs/architecture/`)
- [**Styleguide Oficial e Design System (`architecture/styleguide.md`)**](./architecture/styleguide.md)
  Tokens canônicos de paleta Light/Dark (`src/app/globals.css`), escala tipográfica única (proibindo `< 12px` / `text-[10px]` / `text-[11px]`), espaçamentos e grids (`w-[268px]`, `px-4 py-4 sm:px-6 sm:py-6 lg:px-8`, `space-y-4 sm:space-y-5`, `gap-4`, `p-4 sm:p-5`), alturas de controles (`h-10`, `h-8`), anatomia obrigatória de tela com `<ToolPageHeader />` e checklist anti-desvio.
- [**Registro de Aprendizados e Prevenção de Erros (`architecture/lessons-learned.md`)**](./architecture/lessons-learned.md)
  Post-mortems estruturados dos incidentes reais do projeto (overflow de badges em `CardHeader`, busca mobile `type="text"`, sidebar e drawer 60fps, prioridade vs. compressão mobile, padronização tipográfica, flicker BCB, HTTP `304` na série `4389`, tema sem FOUC via `useSyncExternalStore`, mock server E2E e worktrees + Husky) com regras de prevenção e gates automatizados.
- [**Diretrizes Obrigatórias de UX Mobile-First (`architecture/mobile-ux-guidelines.md`)**](./architecture/mobile-ux-guidelines.md)
  Regras inegociáveis para viewport móvel (`375x667`): regra Above-the-Fold (`< 600px`), ordem do DOM = prioridade mobile, abas compactas `grid-cols-3` em linha única, botões lado a lado (`grid-cols-2 gap-2.5`), overlay de busca mobile, gaveta animada a 60fps, linguagem limpa sem jargões e gate E2E (cobertura de rotas, cenários funcionais, contenção geométrica e snapshots).
- [**Estrutura do Projeto e Arquitetura Modular (`architecture/project-structure.md`)**](./architecture/project-structure.md)
  Organização de pastas `src/features/<category>/<tool-slug>/`, funcionamento do registro central `src/config/tools-registry.ts` livre de conflitos, componente unificado `<ToolPageHeader />`, política Zero `any`, cobertura Vitest V8 >= 90% e diretrizes de UI/UX Mobile-First com `shadcn/ui`.

### Plano de Implementação, Épicos, Worktrees e Deploy (`docs/plan/`)
- [**Épicos e Tarefas — Backlog Completo (`plan/epics-and-tasks.md`)**](./plan/epics-and-tasks.md)
  Divisão estratégica em **8 Épicos (`Epic 0` a `Epic 7`)** e **96 Tarefas (`TASK-000` a `TASK-095`)**, sincronizadas 1:1 com as 91 ferramentas principais do catálogo, atribuindo agente responsável, branch/worktree, diretório isolado e critérios de aceite e gates de qualidade para cada ferramenta.
- [**Guia de Execução Paralela com Git Worktrees (`plan/parallel-worktrees-guide.md`)**](./plan/parallel-worktrees-guide.md)
  Como orquestrar agentes paralelos via `git worktree add` ou Swarm `workspace: "share"`, convenções de branches, regras anti-conflito e checklist obrigatório de verificação (`@verifier`).
- [**Versionamento GitHub, CI/CD e Deploy na Vercel (`plan/deploy-and-github.md`)**](./plan/deploy-and-github.md)
  Passo a passo de inicialização do repositório GitHub, gate local Husky (`.husky/pre-commit`), workflow de CI com GitHub Actions (`lint`, `typecheck`, `test:coverage`, `test:e2e:coverage`, `build`, `test:e2e`) e publicação na Vercel.

---

## 3. Gates Obrigatórios de Qualidade (Governança Contínua)

Toda entrega atual e futura no repositório está sujeita a quatro gates automatizados e inegociáveis:

1. **Git Pre-Commit Quality Gate (`.husky/pre-commit`):** Todo `git commit` executa obrigatoriamente `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run test:e2e:coverage` e `npm run test:e2e` antes de ser aceito.
2. **Cobertura Unitária e de Componentes `>= 90%` (Vitest V8):** Todo módulo de ferramenta (`src/features/<category>/<slug>/`) deve incluir testes unitários e de componente atingindo no mínimo **90%** em **lines, branches, functions e statements**.
3. **Cobertura E2E Obrigatória (Rotas + Cenários Funcionais + Snapshots):** Toda nova página em `src/app/` e toda ferramenta com `status: "ready"` em `src/config/tools-registry.ts` deve possuir:
   - Registro validado em `scripts/check-e2e-coverage.mjs` (`npm run test:e2e:coverage`);
   - Cenários funcionais interativos em `tests/e2e/functional-scenarios.spec.ts`;
   - Verificações geométricas de bounding-box + snapshots visuais Desktop (`1440x900`) e Mobile (`375x667`) em `tests/e2e/layout-and-snapshots.spec.ts`, auditados visualmente por um agente Verifier.
4. **Política Zero `any` em TypeScript:** `"strict": true` em `tsconfig.json` combinado com `"@typescript-eslint/no-explicit-any": "error"` no ESLint.

---

## 4. Prioridades do MVP (Onda 1 — Execução Imediata)

| Prioridade | Task ID | Ferramenta | Rota da Aplicação | Módulo Isolado | Especificação |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | `TASK-001` | **Gerador de CPF** | `/gerador-de-cpf` | `src/features/generators/cpf/` | [`specs/cpf-generator.md`](./specs/cpf-generator.md) |
| **2** | `TASK-002` | **Gerador de CNPJ** | `/gerador-de-cnpj` | `src/features/generators/cnpj/` | [`specs/cnpj-generator.md`](./specs/cnpj-generator.md) |
| **3** | `TASK-003` | **Calculadora de Juros Compostos** | `/calculadora-juros-compostos` | `src/features/calculators/compound-interest/` | [`specs/compound-interest.md`](./specs/compound-interest.md) |
