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

## 2. Estratégia de Branches e Proteção de Repositório

Para manter a branch `main` sempre pronta para produção (Continuous Deployment na Vercel):

1. **Branch Principal (`main`):**
   - Representa o estado de produção atual.
   - Todo push ou merge na `main` dispara automaticamente o deploy de produção na Vercel.
2. **Branches de Features / Worktrees (`feat/task-XXX-<slug>`):**
   - Criadas para cada ferramenta individual (`TASK-001`, `TASK-002`, etc.).
   - Quando enviadas ao GitHub (`git push origin feat/task-XXX-<slug>`), a Vercel gera automaticamente uma **Preview URL exclusiva** para validação visual e mobile.
3. **Regras Recomendadas de Branch Protection no GitHub (`Settings -> Branches`):**
   - Exigir que os status checks passem antes do merge (`CI / lint-and-typecheck`, `CI / build`).
   - Impedir `force push` na branch `main`.

---

## 3. Pipeline de CI/CD com GitHub Actions (`.github/workflows/ci.yml`)

O pipeline abaixo garante que nenhuma branch quebre a tipagem TypeScript, as regras do ESLint ou o build estático/SSR do Next.js:

```yaml
name: CI - Lint, Typecheck & Build

on:
  push:
    branches: [main, "feat/**"]
  pull_request:
    branches: [main]

jobs:
  quality-and-build:
    name: ESLint, TypeScript & Next.js Build
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

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript Compiler Check
        run: npx tsc --noEmit

      - name: Build Next.js Production Bundle
        run: npm run build
```

---

## 4. Configuração de Prontidão para a Vercel (Vercel-Ready)

O projeto Next.js (App Router) é nativamente otimizado para a infraestrutura da Vercel sem necessidade de adaptadores externos:

- **Zero variáveis de ambiente obrigatórias no MVP:** Todas as ferramentas prioritárias (Gerador de CPF, Gerador de CNPJ, Calculadora de Juros Compostos) rodam 100% client-side / server-rendered sem dependência de banco de dados externo, tornando o deploy imediato e com custo zero de infraestrutura.
- **Cabeçalhos de Segurança e Cache (`next.config.ts` / `vercel.json` opcional):**
  - Páginas de ferramentas pré-renderizadas no build para **Time to First Byte (TTFB) < 50ms** na Edge Network da Vercel.

### 4.1. Deploy via Integração GitHub (1-Click / Automático)

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

### 4.2. Deploy via Vercel CLI (Alternativa via Terminal)

```bash
# 1. Executar preview deploy via npx (usando Node gerenciado pelo asdf)
npx vercel

# 2. Publicar diretamente em produção
npx vercel --prod
```

---

## 5. Checklist Pós-Deploy (Produção)

- [ ] **Lighthouse Mobile >= 95:** Verificar Performance, Acessibilidade, Boas Práticas e SEO nas rotas `/`, `/gerador-de-cpf`, `/gerador-de-cnpj` e `/calculadora-juros-compostos`.
- [ ] **OpenGraph e Meta Tags:** Testar compartilhamento de link no WhatsApp/Telegram/Twitter para validar título e descrição de cada calculadora/gerador.
- [ ] **Teste em Dispositivo Móvel Real:** Abrir a URL da Vercel no smartphone, testar o menu lateral (`Sheet`), gerar CPF/CNPJ, copiar com 1 toque e simular evolução de Juros Compostos.
