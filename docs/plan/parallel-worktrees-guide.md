# Guia de Orquestração Paralela com Git Worktrees (`parallel-worktrees-guide.md`)

Este guia define o fluxo operacional para executar múltiplos agentes simultaneamente no desenvolvimento do **DeveloperTools**, utilizando **Git Worktrees** nativos (`git worktree`) ou o isolamento de workspace do Swarm (`workspace: "share"` / `workspace: "branch"`).

---

## 1. Por Que Usar Git Worktrees para Este Projeto?

O portal possui dezenas de ferramentas independentes (Geradores de Documentos, Validadores, Calculadoras Financeiras, Utilitários de Texto/Dev). Desenvolvê-las em série em uma única árvore de trabalho criaria um gargalo desnecessário.

Com **Git Worktrees** combinado à nossa arquitetura `src/features/<category>/<tool-slug>/`:
- Cada agente trabalha em seu próprio diretório físico e em sua própria branch Git.
- O repositório `.git` (objetos, histórico, refs) é compartilhado, economizando espaço em disco e tornando a criação de uma worktree instantânea (`< 1s`).
- Nenhum agente bloqueia outro durante builds, testes ou edições de arquivos.
- Como cada agente edita apenas sua pasta isolada (`src/features/...`), o merge de volta para a `main` ocorre **sem conflitos**.

---

## 2. Convenção de Nomenclatura de Branches e Worktrees

| Tipo de Tarefa | Padrão da Branch | Diretório da Worktree (Manual) | Escopo Exclusivo de Edição |
| :--- | :--- | :--- | :--- |
| **Fundação / Shell** | `main` ou `chore/scaffold` | `/home/denis/dev/developertools` | `src/app/`, `src/components/`, `src/config/` |
| **Gerador de CPF** | `feat/task-001-cpf-generator` | `../wt-cpf-generator` | `src/features/generators/cpf/**` |
| **Gerador de CNPJ** | `feat/task-002-cnpj-generator` | `../wt-cnpj-generator` | `src/features/generators/cnpj/**` |
| **Juros Compostos** | `feat/task-003-compound-interest` | `../wt-compound-interest` | `src/features/calculators/compound-interest/**` |
| **Qualquer Ferramenta N** | `feat/task-<ID>-<tool-slug>` | `../wt-<tool-slug>` | `src/features/<category>/<tool-slug>/**` |

---

## 3. Fluxo de Execução Paralela Passo a Passo

### Opção A: Usando Swarm Nativo (`workspace: "share"`)
No ambiente Antigravity Swarm, o coordenador instancia agentes paralelos passando `workspace: "share"`. O ambiente cria automaticamente uma cópia de trabalho isolada para cada agente:

```json
{
  "action": "add",
  "name": "worker-cpf",
  "workspace": "share",
  "brief": "Implemente TASK-001 (Gerador e Validador Integrado de CPF) estritamente dentro de src/features/generators/cpf/ e conecte em src/app/gerador-de-cpf/page.tsx."
}
```

### Opção B: Usando `git worktree` via CLI (Para ondas de Tasks ou automação CI/Local)

A partir do repositório principal (`/home/denis/dev/developertools`) já inicializado na branch `main`:

```bash
# 1. Garantir que a branch main está limpa e com o scaffold base commitado
git status

# 2. Criar as worktrees paralelas da Onda 1 (MVP Prioritário)
git worktree add -b feat/task-001-cpf-generator ../developertools-wt-cpf main
git worktree add -b feat/task-002-cnpj-generator ../developertools-wt-cnpj main
git worktree add -b feat/task-003-compound-interest ../developertools-wt-juros main

# 3. Listar worktrees ativas
git worktree list
```

> **Dica de Performance (`node_modules`):** Em worktrees manuais fora do Swarm, caso `node_modules` não esteja presente na worktree, crie um symlink rápido (`ln -s /home/denis/dev/developertools/node_modules ../developertools-wt-cpf/node_modules`) ou execute `npm ci --prefer-offline`.

---

## 4. Regras de Ouro Anti-Conflito e Gates de Qualidade para Agentes de Feature

Para garantir **Zero Merge Conflicts** e **100% de Conformidade com os Gates de Qualidade** quando 3 a 10 agentes terminarem suas tarefas simultaneamente:

1. **Proibido editar arquivos globais sem coordenação:**
   - Agentes de feature **NÃO** devem editar `package.json`, `.husky/`, `src/app/layout.tsx`, `src/components/layout/*` ou `src/config/tools-registry.ts` (salvo quando o escopo da tarefa exigir explicitamente promover uma ferramenta para `status: "ready"`).
   - Todas as dependências necessárias (`lucide-react`, componentes `shadcn/ui`, Vitest, Playwright, utilitários de formatação) já são instaladas na infraestrutura base.
2. **Escopo restrito à pasta da Feature, sua Page e seus Testes:**
   - Cada agente de feature entrega seu código com **tipagem estrita (`"strict": true` em `tsconfig.json`) e Zero `any` (`"@typescript-eslint/no-explicit-any": "error"`)**.
   - Cada módulo `src/features/<category>/<slug>/` deve incluir testes unitários (`<slug>-utils.test.ts` / `<slug>-math.test.ts`) e testes de componente (`<slug>.test.tsx`) atingindo **>= 90% de cobertura V8 em lines, branches, functions e statements** (`npm run test:coverage`).
   - Cada nova rota em `src/app/` e ferramenta `"ready"` em `src/config/tools-registry.ts` deve possuir registro em `scripts/check-e2e-coverage.mjs`, cenários funcionais em `tests/e2e/functional-scenarios.spec.ts` e checks geométricos + snapshots Desktop/Mobile em `tests/e2e/layout-and-snapshots.spec.ts` (quando múltiplas worktrees rodam em paralelo, um agente integrador/E2E dedicado ou a etapa de merge consolida os arquivos compartilhados de `tests/e2e/` e `scripts/check-e2e-coverage.mjs` sem conflitos).
   - Exemplos de escopo isolado de feature:
     - `TASK-001` (CPF): `src/features/generators/cpf/*` e `src/app/gerador-de-cpf/page.tsx`
     - `TASK-002` (CNPJ): `src/features/generators/cnpj/*` e `src/app/gerador-de-cnpj/page.tsx`
     - `TASK-003` (Juros Compostos): `src/features/calculators/compound-interest/*` e `src/app/calculadora-juros-compostos/page.tsx`
3. **Commits Atômicos e Padronizados (Conventional Commits + Pre-Commit Gate):**
   - O hook `.husky/pre-commit` executa `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run test:e2e:coverage` e `npm run test:e2e` antes de aprovar qualquer commit.
   - Cada agente realiza commit seguindo o padrão:
     - `feat(cpf): implement CPF generator with UF selector, bulk export and >=90% tests (TASK-001)`
     - `feat(cnpj): implement numeric and alphanumeric CNPJ generator and tests (TASK-002)`
     - `feat(compound-interest): implement compound interest calculator with chart, table and tests (TASK-003)`

---

## 5. Estratégia de Integração (Merge Train) e Limpeza

Assim que os agentes paralelos concluírem suas implementações e reportarem no board:

```bash
# No diretório principal (/home/denis/dev/developertools) na branch main:
git checkout main

# 1. Merge sequencial limpo (sem conflitos pois os diretórios são disjuntos)
git merge --no-ff feat/task-001-cpf-generator -m "Merge feat/task-001-cpf-generator into main"
git merge --no-ff feat/task-002-cnpj-generator -m "Merge feat/task-002-cnpj-generator into main"
git merge --no-ff feat/task-003-compound-interest -m "Merge feat/task-003-compound-interest into main"

# 2. Validação integrada na main (Gates Obrigatórios: Lint, Typecheck, Coverage >= 90%, E2E Coverage, Build & E2E)
npm run lint
npm run typecheck
npm run test:coverage
npm run test:e2e:coverage
npm run build
npm run test:e2e

# 3. Remoção das worktrees concluídas e limpeza de branches locais
git worktree remove ../developertools-wt-cpf
git worktree remove ../developertools-wt-cnpj
git worktree remove ../developertools-wt-juros
git branch -d feat/task-001-cpf-generator feat/task-002-cnpj-generator feat/task-003-compound-interest

# 4. Push para o GitHub (dispara deploy automático na Vercel)
git push origin main
```

---

## 6. Checklist de Verificação por Agente (`@verifier`)

Antes de aprovar o merge de qualquer worktree, o agente `@verifier` executa o checklist abaixo:

- [ ] **Isolamento de Arquivos:** `git diff --name-only main...feat/task-XXX` toca apenas `src/features/<category>/<slug>/` e `src/app/<rota>/page.tsx`?
- [ ] **Precisão Algorítmica / Matemática:**
  - CPF gera 11 dígitos válidos no Mod-11, respeita o 9º dígito da UF selecionada e rejeita sequências repetidas (`111.111.111-11`)?
  - CNPJ gera 14 caracteres válidos no Mod-11 (incluindo matriz `0001` ou filial customizada) e valida dígitos verificadores corretamente?
  - Calculadora de Juros Compostos converte taxa anual para mensal via taxa equivalente $(1 + i_{anual})^{1/12} - 1$ (igual ao Investidor10) e bate os valores de *Total Final*, *Total Investido* e *Total em Juros* centavo a centavo?
- [ ] **Responsividade Mobile & Contenção Geométrica:** Layout funciona em `375x667` (Mobile) e `1440x900` (Desktop) sem barra de rolagem horizontal (`scrollWidth <= innerWidth`), sem vazamento de badges/títulos para fora de `[data-slot="card"]`, e com controles principais acima da dobra (`bottom <= 667` no mobile)?
- [ ] **Política Zero `any` & Strict TypeScript:** `tsconfig.json` mantém `"strict": true`, ESLint aplica `"@typescript-eslint/no-explicit-any": "error"`, e `npm run lint` + `npm run typecheck` passam com código de saída `0`?
- [ ] **Cobertura Unitária & Componentes >= 90% (Vitest V8):** O módulo `src/features/<category>/<slug>/` possui testes unitários e de componente atingindo **>= 90%** em **lines, branches, functions e statements** via `npm run test:coverage`?
- [ ] **Cobertura E2E Obrigatória (Rotas + Cenários Funcionais + Snapshots + Inspeção Visual):**
  - Toda nova página em `src/app/` e toda ferramenta `"ready"` em `src/config/tools-registry.ts` está registrada em `scripts/check-e2e-coverage.mjs` (`npm run test:e2e:coverage`)?
  - Possui cenários funcionais interativos em `tests/e2e/functional-scenarios.spec.ts`?
  - O worker adicionou/atualizou a rota em `tests/e2e/layout-and-snapshots.spec.ts` (checks geométricos de bounding-box + snapshots) e atualizou os snapshots (`npm run test:e2e:snapshots`)?
  - `npm run test:e2e` passa 100% nos projetos `desktop` (`1440x900`) e `mobile` (`375x667`) após `npm run build`?
  - O agente `@verifier` inspecionou visualmente cada imagem `.png` em `tests/e2e/__screenshots__/desktop/` e `tests/e2e/__screenshots__/mobile/` utilizando a ferramenta `read_file` para confirmar ausência total de sobreposição, truncamento indevido ou colisão visual?
- [ ] **Hook Git Pre-Commit Ativo:** `.husky/pre-commit` está configurado e todas as verificações passam sem bypass (`--no-verify` / `HUSKY=0`)?
