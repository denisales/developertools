# Documentação do Projeto — DeveloperTools (4Devs + Investidor10)

Bem-vindo à documentação oficial do projeto **DeveloperTools**, uma plataforma moderna de geradores, validadores, calculadoras financeiras e utilitários para desenvolvedores, inspirada nas funcionalidades do [4Devs](https://www.4devs.com.br/) e na calculadora de juros compostos do [Investidor10](https://investidor10.com.br/calculadoras/juros-compostos/).

---

## 1. Visão Geral do Projeto

- **Framework & Stack:** Next.js (App Router) + TypeScript + ESLint + Tailwind CSS + `shadcn/ui` + `lucide-react`.
- **Experiência Mobile-First:** Interface projetada desde o início para uso ágil no celular (navegação via *Bottom Sheet / Drawer*, alvos de toque de `48px+`, cópia com 1 toque, geração instantânea client-side, suporte a Dark/Light Mode).
- **Arquitetura Paralela (Git Worktrees Ready):** Cada ferramenta vive de forma 100% independente em `src/features/<category>/<tool-slug>/`, permitindo que múltiplos agentes autônomos desenvolvam ferramentas em paralelo sem conflitos de merge.
- **Deploy & Versionamento:** Pronto para deploy contínuo na **Vercel** e versionado no **GitHub** com validação automatizada de ESLint, TypeScript e Build.

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

### Arquitetura e Design System (`docs/architecture/`)
- [**Estrutura do Projeto e Arquitetura Modular (`architecture/project-structure.md`)**](./architecture/project-structure.md)
  Organização de pastas `src/features/<category>/<tool-slug>/`, funcionamento do registro central `src/config/tools-registry.ts` livre de conflitos e diretrizes de UI/UX Mobile-First com `shadcn/ui`.

### Plano de Implementação, Épicos, Worktrees e Deploy (`docs/plan/`)
- [**Épicos e Tarefas — Backlog Completo (`plan/epics-and-tasks.md`)**](./plan/epics-and-tasks.md)
  Divisão estratégica em **8 Épicos (`Epic 0` a `Epic 7`)** e **96 Tarefas (`TASK-000` a `TASK-095`)**, sincronizadas 1:1 com as 91 ferramentas principais do catálogo, atribuindo agente responsável, branch/worktree, diretório isolado e critérios de aceite para cada ferramenta.
- [**Guia de Execução Paralela com Git Worktrees (`plan/parallel-worktrees-guide.md`)**](./plan/parallel-worktrees-guide.md)
  Como orquestrar agentes paralelos via `git worktree add` ou Swarm `workspace: "share"`, convenções de branches, regras anti-conflito e checklist de verificação.
- [**Versionamento GitHub, CI/CD e Deploy na Vercel (`plan/deploy-and-github.md`)**](./plan/deploy-and-github.md)
  Passo a passo de inicialização do repositório GitHub, workflow de CI com GitHub Actions (ESLint + Typecheck + Next Build) e publicação na Vercel.

---

## 3. Prioridades do MVP (Onda 1 — Execução Imediata)

| Prioridade | Task ID | Ferramenta | Rota da Aplicação | Módulo Isolado | Especificação |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | `TASK-001` | **Gerador de CPF** | `/gerador-de-cpf` | `src/features/generators/cpf/` | [`specs/cpf-generator.md`](./specs/cpf-generator.md) |
| **2** | `TASK-002` | **Gerador de CNPJ** | `/gerador-de-cnpj` | `src/features/generators/cnpj/` | [`specs/cnpj-generator.md`](./specs/cnpj-generator.md) |
| **3** | `TASK-003` | **Calculadora de Juros Compostos** | `/calculadora-juros-compostos` | `src/features/calculators/compound-interest/` | [`specs/compound-interest.md`](./specs/compound-interest.md) |
