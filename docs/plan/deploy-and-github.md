# Versionamento GitHub, CI/CD e Deploy na Vercel (`deploy-and-github.md`)

Este documento descreve o fluxo completo de configuração do repositório Git/GitHub, integração contínua (GitHub Actions) e publicação em produção na **Vercel**.

---

## 1. Inicialização do Git e Criação do Repositório no GitHub

O ambiente local já possui chave SSH e GitHub CLI (`gh`) configurados para acesso à conta do usuário.

### 1.1. Comandos de Inicialização e Primeiro Push

```bash
cd /home/denis/dev/developertools

# 1. Inicializar repositório com branch principal 'main'
git init -b main

# 2. Adicionar todos os arquivos (respeitando .gitignore do Next.js)
git add .

# 3. Realizar o commit inicial da fundação + documentação
git commit -m "feat: initial Next.js scaffold, shadcn/ui layout and complete project documentation"

# 4. Criar o repositório remoto no GitHub via GitHub CLI e fazer o push inicial
# (Caso o repositório 'developertools' ainda não exista na conta)
gh repo create developertools --public --source=. --remote=origin --push
```

Caso o repositório remoto já tenha sido criado manualmente ou via SSH:

```bash
git remote add origin git@github.com:<SEU_USUARIO>/developertools.git
git push -u origin main
```

---

## 2. Gate Local Obrigatório: Git Pre-Commit (`.husky/pre-commit`)

Todo commit no repositório é validado automaticamente pelo hook Husky (`.husky/pre-commit`), garantindo que nenhum código fora do padrão chegue ao histórico:

1. **Política Zero `any` & Strict TypeScript:**
   - `tsconfig.json` exige `"strict": true`.
   - `eslint.config.mjs` configura `"@typescript-eslint/no-explicit-any": "error"`.
2. **Sequência Executada pelo `.husky/pre-commit` (saída `0` obrigatória):**
   1. `npm run lint` — ESLint em todo o projeto (falha em qualquer `any` explícito ou violação de regra).
   2. `npm run typecheck` — `tsc --noEmit` validando tipagem estrita.
   3. `npm run test:coverage` — Vitest com provedor V8 exigindo **>= 90%** em **lines, branches, functions e statements** em cada módulo (`src/features/<category>/<slug>/`).
   4. `npm run test:e2e:coverage` — `node scripts/check-e2e-coverage.mjs` garantindo que toda página em `src/app/` e toda ferramenta `"ready"` em `src/config/tools-registry.ts` esteja registrada em cenários funcionais e snapshots.
   5. `npm run test:e2e` (sobre build atualizado com `npm run build`) — executa `tests/e2e/functional-scenarios.spec.ts` e `tests/e2e/layout-and-snapshots.spec.ts` (checks geométricos de bounding-box + snapshots Desktop `1440x900` e Mobile `375x667`).

> **Regra de Governança:** Não usar `--no-verify` nem `HUSKY=0` em commits de entrega; qualquer ajuste visual exige atualização dos snapshots (`npm run test:e2e:snapshots`) e inspeção visual via `read_file` pelo agente Verifier.

---

## 3. Estratégia de Branches e Proteção de Repositório

Para manter a branch `main` sempre pronta para produção (Continuous Deployment na Vercel):

1. **Branch Principal (`main`):**
   - Representa o estado de produção atual.
   - Todo push ou merge na `main` dispara automaticamente o deploy de produção na Vercel.
2. **Branches de Features / Worktrees (`feat/task-XXX-<slug>`):**
   - Criadas para cada ferramenta individual (`TASK-001`, `TASK-002`, etc.).
   - Quando enviadas ao GitHub (`git push origin feat/task-XXX-<slug>`), a Vercel gera automaticamente uma **Preview URL exclusiva** para validação visual e mobile.
3. **Regras Recomendadas de Branch Protection no GitHub (`Settings -> Branches`):**
   - Exigir que todos os status checks do CI passem antes do merge (`CI / quality-and-e2e`).
   - Impedir `force push` na branch `main`.

---

## 4. Pipeline de CI/CD com GitHub Actions (`.github/workflows/ci.yml`)

O pipeline abaixo espelha exatamente os gates locais do `.husky/pre-commit` para garantir que nenhuma branch quebre lint, tipagem estrita (Zero `any`), cobertura unitária (`>= 90%`), cobertura E2E de rotas, build Next.js ou suíte Playwright (Desktop & Mobile):

```yaml
name: CI - Quality Gates, Coverage & E2E

on:
  push:
    branches: [main, "feat/**"]
  pull_request:
    branches: [main]

jobs:
  quality-and-e2e:
    name: Lint, Typecheck, Coverage >= 90%, Build & Playwright E2E
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint (Zero any policy)
        run: npm run lint

      - name: Run TypeScript Strict Check
        run: npm run typecheck

      - name: Run Unit & Component Tests with V8 Coverage (>= 90%)
        run: npm run test:coverage

      - name: Verify E2E Route & Registry Coverage
        run: npm run test:e2e:coverage

      - name: Build Next.js Production Bundle
        run: npm run build

      - name: Install Playwright Chromium
        run: npx playwright install --with-deps chromium

      - name: Run Playwright E2E (Functional Scenarios & Desktop/Mobile Snapshots)
        run: npm run test:e2e
```

---

## 5. Configuração de Prontidão para a Vercel (Vercel-Ready)

O projeto Next.js (App Router) é nativamente otimizado para a infraestrutura da Vercel sem necessidade de adaptadores externos:

- **Zero variáveis de ambiente obrigatórias no MVP:** Todas as ferramentas prioritárias (Gerador de CPF, Gerador de CNPJ, Calculadora de Juros Compostos) rodam 100% client-side / server-rendered sem dependência de banco de dados externo, tornando o deploy imediato e com custo zero de infraestrutura.
- **Cabeçalhos de Segurança e Cache (`next.config.ts` / `vercel.json` opcional):**
  - Páginas de ferramentas pré-renderizadas no build para **Time to First Byte (TTFB) < 50ms** na Edge Network da Vercel.

### 5.1. Deploy via Integração GitHub (1-Click / Automático)

1. Acesse [https://vercel.com/new](https://vercel.com/new) autenticado com sua conta GitHub.
2. Selecione o repositório **`developertools`**.
3. Mantenha os padrões detectados automaticamente pela Vercel:
   - **Framework Preset:** `Next.js`
   - **Build Command:** `next build` (ou `npm run build`)
   - **Output Directory:** `.next`
   - **Install Command:** `npm install` (ou `npm ci`)
4. Clique em **Deploy**.
5. A partir desse momento:
   - Cada `git push origin main` atualiza o domínio principal de produção.
   - Cada Pull Request abre um ambiente de homologação isolado com link compartilhável.

### 5.2. Deploy via Vercel CLI (Alternativa via Terminal)

```bash
# 1. Executar preview deploy via npx (usando Node gerenciado pelo asdf)
npx vercel

# 2. Publicar diretamente em produção
npx vercel --prod
```

---

## 6. Checklist Pós-Deploy (Produção)

- [ ] **Lighthouse Mobile >= 95:** Verificar Performance, Acessibilidade, Boas Práticas e SEO nas rotas `/`, `/gerador-de-cpf`, `/gerador-de-cnpj` e `/calculadora-juros-compostos`.
- [ ] **OpenGraph e Meta Tags:** Testar compartilhamento de link no WhatsApp/Telegram/Twitter para validar título e descrição de cada calculadora/gerador.
- [ ] **Teste em Dispositivo Móvel Real:** Abrir a URL da Vercel no smartphone, testar o menu lateral (`Sheet`), gerar CPF/CNPJ, copiar com 1 toque e simular evolução de Juros Compostos.
