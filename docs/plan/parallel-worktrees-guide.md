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

## 4. Regras de Ouro Anti-Conflito para Agentes de Feature

Para garantir **Zero Merge Conflicts** quando 3 a 10 agentes terminarem suas tarefas simultaneamente:

1. **Proibido editar arquivos globais sem coordenação:**
   - Agentes de feature **NÃO** devem editar `package.json`, `src/app/layout.tsx`, `src/components/layout/*` ou `src/config/tools-registry.ts`.
   - Todas as dependências necessárias (`lucide-react`, componentes `shadcn/ui`, utilitários de formatação) já são instaladas na **Epic 0 (Scaffold)**.
2. **Escopo restrito à pasta da Feature e sua Page:**
   - O agente responsável por `TASK-001` (CPF) só pode criar/modificar arquivos em:
     - `src/features/generators/cpf/*`
     - `src/app/gerador-de-cpf/page.tsx`
   - O agente responsável por `TASK-002` (CNPJ) só pode criar/modificar arquivos em:
     - `src/features/generators/cnpj/*`
     - `src/app/gerador-de-cnpj/page.tsx`
   - O agente responsável por `TASK-003` (Juros Compostos) só pode criar/modificar arquivos em:
     - `src/features/calculators/compound-interest/*`
     - `src/app/calculadora-juros-compostos/page.tsx`
3. **Commits Atômicos e Padronizados (Conventional Commits):**
   - Cada agente realiza commit na sua própria branch seguindo o padrão:
     - `feat(cpf): implement Mod-11 CPF generator with UF selector and bulk export (TASK-001)`
     - `feat(cnpj): implement numeric and alphanumeric CNPJ generator (TASK-002)`
     - `feat(compound-interest): implement Investidor10 calculator with chart and evolution table (TASK-003)`

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

# 2. Validação integrada na main
npm run lint
npm run build

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
- [ ] **Responsividade Mobile:** Layout funciona em `375px` (iPhone SE / celulares compactos) sem barra de rolagem horizontal quebrada, com botões de fácil toque e cópia com 1 clique?
- [ ] **Qualidade Estática:** `npm run lint` e `npm run build` executam com código de saída `0` sem erros de TypeScript ou ESLint?
