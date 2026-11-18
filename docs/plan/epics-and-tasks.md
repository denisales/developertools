# Plano Completo de Épicos e Tarefas (`epics-and-tasks.md`)

Este documento contém o plano mestre de execução do projeto **DeveloperTools**, sincronizado **1:1** com o [Catálogo Completo 4Devs + Investidor10 (`../catalog/4devs-complete-map.md`)](../catalog/4devs-complete-map.md).

O backlog está estruturado em **8 Épicos (`Epic 0` a `Epic 7`)** e decomposto em **96 Tarefas Atômicas (`TASK-000` a `TASK-095`)**, cobrindo a fundação do projeto, todas as **91 ferramentas principais** (e suas +34 sub-rotas de SEO) e o pipeline de busca/PWA/deploy.

Cada validador, gerador, calculadora e utilitário possui sua própria **Task ID**, **Agente/Role Responsável**, **Branch/Worktree isolada** e **Diretório exclusivo (`src/features/<category>/<tool-slug>/`)** para permitir desenvolvimento massivamente paralelo sem conflitos de merge.

> **Gate Obrigatório de Qualidade E2E & Snapshots Visuais (Todas as Tasks `TASK-000` a `TASK-095`):**
> Nenhuma tarefa é considerada concluída sem:
> 1. Cobertura da rota em `tests/e2e/layout-and-snapshots.spec.ts` validando **Zero Page Overflow**, **Contenção Geométrica de Cards (`[data-slot="card"]`)**, **Zero Colisão de Abas/Botões** e **Usabilidade Above-the-Fold no Mobile (`375x667`)**.
> 2. Geração e commit dos snapshots visuais determinísticos (`npm run test:e2e:snapshots`) para **Desktop (`1440x900`)** e **Mobile (`375x667`)**.
> 3. Execução de `npm run test:e2e` com 100% de aprovação + **inspeção visual obrigatória das imagens PNG geradas usando `read_file`** pelo agente `@verifier` antes do merge/deploy.

---

## Visão Geral dos Épicos e Ondas de Execução Paralela

| Épico | Nome do Épico | Escopo Sincronizado com o Catálogo | Tasks | Qtd Tasks | Paralelismo |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Epic 0** | **Foundation & App Shell** | Next.js App Router, TypeScript, Tailwind, `shadcn/ui`, Layout Mobile-First, `tools-registry.ts`, Git & GitHub | `TASK-000` | 1 | Sequencial (Base obrigatória) |
| **Epic 1** | **MVP Priority Tools (Onda 1)** | **Gerador de CPF**, **Gerador de CNPJ**, **Calculadora de Juros Compostos (Investidor10)** | `TASK-001` a `TASK-003` | 3 | **100% Paralelo (3 Worktrees)** |
| **Epic 2** | **Document Generators (Onda 2)** | Geradores de documentos brasileiros, bancários e registros oficiais do 4Devs (Catálogo 1.3 a 1.11) | `TASK-004` a `TASK-012` | 9 | **100% Paralelo (9 Worktrees)** |
| **Epic 3** | **Document Validators (Onda 3)** | Todos os 11 Validadores oficiais do 4Devs (Catálogo 2.1 a 2.11) | `TASK-013` a `TASK-023` | 11 | **100% Paralelo (11 Worktrees)** |
| **Epic 4** | **People, Company, Vehicle & Test Data Generators (Onda 4)** | Geradores de Entidades, Veículos, CEP, Nomes, Nicks, Letras, Símbolos, Senhas, Sorteios, Lorem Ipsum, Imagem e Currículo (Catálogo 1.12 a 1.26) | `TASK-024` a `TASK-038` | 15 | **100% Paralelo (15 Worktrees)** |
| **Epic 5** | **Financial, Labor & Math Calculators (Onda 5)** | Utilidades Trabalhistas/Bancárias (Catálogo 3.1 a 3.3), Calculadoras Matemáticas & Datas (Catálogo 8.1 a 8.10) e Geometria/Áreas (Catálogo 9.1 a 9.13) | `TASK-039` a `TASK-064` | 26 | **100% Paralelo (26 Worktrees)** |
| **Epic 6** | **Text, Dev, Encoders & Network Utilities (Onda 6)** | Funções String (Catálogo 4.1 a 4.14), Rede/Internet (Catálogo 5.1 a 5.3), Encodes/Hashes/QR Code (Catálogo 6.1 a 6.7) e SEO/Tabelas (Catálogo 7.1 a 7.3) | `TASK-065` a `TASK-091` | 27 | **100% Paralelo (27 Worktrees)** |
| **Epic 7** | **SEO, Command Palette, PWA & Vercel Deploy** | Busca global `Cmd+K`, Sitemap.xml + Sub-rotas UFs, PWA manifest, CI/CD GitHub Actions e Deploy Vercel | `TASK-092` a `TASK-095` | 4 | Paralelo por subsistema |

---

## Epic 0: Foundation, Design System & App Shell

> **Objetivo:** Criar a base sólida do projeto Next.js com `shadcn/ui`, layout responsivo mobile-first, registro central de ferramentas (`tools-registry.ts`) e repositório Git inicializado no GitHub para habilitar todas as worktrees paralelas.

| Task ID | Ferramenta / Entrega | Agente Responsável | Branch / Worktree | Diretório / Escopo | Dependências | Critérios de Aceite |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-000` | **Scaffold Next.js + shadcn/ui + Layout Mobile + Git Setup** | `@scaffold` | `main` | `src/app/`, `src/components/ui/`, `src/components/layout/`, `src/config/tools-registry.ts` | Nenhuma | 1. Next.js + TS + ESLint + Tailwind + `shadcn/ui` configurados.<br>2. Header fixo, Sidebar desktop e Drawer (`Sheet`) mobile funcionando.<br>3. `tools-registry.ts` populado e páginas de rota `/gerador-de-cpf`, `/gerador-de-cnpj`, `/calculadora-juros-compostos` criadas.<br>4. `npm run lint` e `npm run build` passando; commit inicial e push para o GitHub concluídos. |

---

## Epic 1: MVP Priority Tools (Onda Prioritária — Execução Imediata)

> **Objetivo:** Implementar com excelência visual, precisão matemática e usabilidade mobile-first as 3 ferramentas prioritárias solicitadas pelo usuário ([`specs/cpf-generator.md`](../specs/cpf-generator.md), [`specs/cnpj-generator.md`](../specs/cnpj-generator.md), [`specs/compound-interest.md`](../specs/compound-interest.md)).

| Task ID | Ref Catálogo | Ferramenta | Rota (`src/app/...`) | Agente Responsável | Branch / Worktree | Diretório Isolado (`src/features/...`) | Dependências | Critérios de Aceite Detalhados |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-001` | **P1 / 1.1** | **Gerador de CPF (com Validador Integrado)** | `/gerador-de-cpf` | `@worker-cpf` | `feat/task-001-cpf-generator` | `src/features/generators/cpf/` | `TASK-000` | 1. Algoritmo Mod-11 exato gerando CPFs válidos de 11 dígitos.<br>2. Toggle de formatação Com Pontuação (`000.000.000-00`) vs Sem Pontuação.<br>3. Seletor de Estado de Origem (UF / 9º dígito fiscal das 10 regiões da RFB ou Indiferente).<br>4. Geração unitária instantânea + Geração em lote (`1` a `100` CPFs) com exportação TXT/CSV/JSON e cópia com 1 toque.<br>5. Aba/Seção rápida de Validação de CPF integrada. |
| `TASK-002` | **P2 / 1.2** | **Gerador de CNPJ (Numérico e Alfanumérico + Validador)** | `/gerador-de-cnpj` | `@worker-cnpj` | `feat/task-002-cnpj-generator` | `src/features/generators/cnpj/` | `TASK-000` | 1. Algoritmo Mod-11 exato com pesos `[5,4,3,2,9,8,7,6,5,4,3,2]` e `[6,5,4,3,2,9,8,7,6,5,4,3,2]`.<br>2. Toggle de formatação Com Pontuação (`00.000.000/0001-00`) vs Sem Pontuação.<br>3. Opção de fixar Matriz (`0001`) ou gerar Filial customizada/aleatória.<br>4. Suporte ao padrão tradicional numérico e ao novo CNPJ Alfanumérico (IN RFB 2.229/2024, conversão ASCII `- 48`).<br>5. Geração em lote (`1` a `100` CNPJs) + Validador de CNPJ integrado. |
| `TASK-003` | **P3** | **Calculadora de Juros Compostos (Padrão Investidor10)** | `/calculadora-juros-compostos` | `@worker-juros` | `feat/task-003-compound-interest` | `src/features/calculators/compound-interest/` | `TASK-000` | 1. Inputs idênticos ao Investidor10 com máscara BRL: **Valor Inicial (R$)**, **Valor Mensal (R$)**, **Taxa de Juros (% Mensal ou % Anual)** e **Período (Meses ou Anos)**.<br>2. Conversão exata de taxa anual para mensal por equivalência composta: $i_m = (1 + i_a)^{1/12} - 1$.<br>3. **3 Cards de Destaque:** Valor Total Final, Valor Total Investido e Total em Juros.<br>4. **Gráfico Interativo Responsivo:** Composição e evolução patrimonial (*Valor Investido* vs *Total em Juros*).<br>5. **Tabela Detalhada Mês a Mês / Ano a Ano:** Evolução completa por período com exportação CSV. |

---

## Epic 2: Document Generators (Geradores de Documentos Oficiais e Bancários — Catálogo 1.3 a 1.11)

> **Objetivo:** Implementar todos os geradores de documentos brasileiros e bancários do 4Devs em módulos isolados.

| Task ID | Ref Catálogo | Ferramenta | Rota (`slug`) | Agente Role | Branch / Worktree | Diretório Isolado (`src/features/...`) | Dependências | Critérios de Aceite |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-004` | **1.3** | **Gerador de RG** | `/gerador-de-rg` | `@worker-gen-rg` | `feat/task-004-rg-generator` | `src/features/generators/rg/` | `TASK-000` | Geração de RG válido (padrão SSP-SP Mod-11 com dígito `0-9` ou `X`), toggle com/sem pontuação e lote. |
| `TASK-005` | **1.4** | **Gerador de CNH** | `/gerador-de-cnh` | `@worker-gen-cnh` | `feat/task-005-cnh-generator` | `src/features/generators/cnh/` | `TASK-000` | Geração de CNH válida de 11 dígitos seguindo algoritmo de 2 DVs do DENATRAN, com/sem pontuação e lote. |
| `TASK-006` | **1.5** | **Gerador de PIS/PASEP** | `/gerador-de-pis-pasep` | `@worker-gen-pis` | `feat/task-006-pis-generator` | `src/features/generators/pis-pasep/` | `TASK-000` | Cálculo Mod-11 com pesos `3,2,9,8,7,6,5,4,3,2`, toggle de pontuação (`000.00000.00-0`) e geração em lote. |
| `TASK-007` | **1.6** | **Gerador de Título de Eleitor** | `/gerador-de-titulo-de-eleitor` | `@worker-gen-titulo` | `feat/task-007-titulo-generator` | `src/features/generators/titulo-eleitor/` | `TASK-000` | Geração de 12 dígitos com seletor de UF (código `01` SP a `28` Exterior nos dígitos 9-10) e DV duplo do TSE. |
| `TASK-008` | **1.7** | **Gerador de Inscrição Estadual (+ 27 sub-rotas UF)** | `/gerador-de-inscricao-estadual` | `@worker-gen-ie` | `feat/task-008-ie-generator` | `src/features/generators/inscricao-estadual/` | `TASK-000` | Geração de Inscrição Estadual válida para todas as 27 UFs (regras oficiais SEFAZ de cada estado) + suporte a sub-rotas por UF. |
| `TASK-009` | **1.8** | **Gerador de Certidões (Nascimento, Casamento, Óbito)** | `/gerador-de-certidoes` | `@worker-gen-certidoes` | `feat/task-009-certidoes-generator` | `src/features/generators/certidoes/` | `TASK-000` | Matrícula padrão CNJ de 32 dígitos (Serventia, Acervo, Ano, Tipo `1`/`2`/`3`, Livro, Folha, Termo e 2 DVs). |
| `TASK-010` | **1.9** | **Gerador de Conta Bancária** | `/gerador-conta-bancaria` | `@worker-gen-conta` | `feat/task-010-bank-generator` | `src/features/generators/conta-bancaria/` | `TASK-000` | Gera Agência e Conta Corrente com DV oficial por banco (Banco do Brasil, Bradesco, Itaú, Santander, Caixa, Citibank) e UF. |
| `TASK-011` | **1.10** | **Gerador de Cartão de Crédito** | `/gerador-cartao-de-credito` | `@worker-gen-cartao` | `feat/task-011-cc-generator` | `src/features/generators/cartao-credito/` | `TASK-000` | Algoritmo de Luhn válido, 10 bandeiras (Visa, Master, Amex, Elo, Hipercard, Diners, Discover, JCB, Aura, Voyager), validade e CVV. |
| `TASK-012` | **1.11** | **Gerador de RENAVAM** | `/gerador-de-renavam` | `@worker-gen-renavam` | `feat/task-012-renavam-generator` | `src/features/generators/renavam/` | `TASK-000` | Código RENAVAM de 11 dígitos válido com cálculo de dígito verificador Mod-11 e cópia rápida. |

---

## Epic 3: Document Validators (Validadores de Documentos — Catálogo 2.1 a 2.11)

> **Objetivo:** Implementar todas as 11 ferramentas dedicadas de validação do 4Devs com diagnóstico visual detalhado.

| Task ID | Ref Catálogo | Ferramenta | Rota (`slug`) | Agente Role | Branch / Worktree | Diretório Isolado (`src/features/...`) | Dependências | Critérios de Aceite |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-013` | **2.1** | **Validador de CPF** | `/validador-cpf` | `@worker-val-cpf` | `feat/task-013-cpf-validator` | `src/features/validators/cpf/` | `TASK-001` | Valida CPF com/sem máscara, exibe região fiscal de origem (9º dígito) e suporta validação em lote. |
| `TASK-014` | **2.2** | **Validador de CNPJ** | `/validador-cnpj` | `@worker-val-cnpj` | `feat/task-014-cnpj-validator` | `src/features/validators/cnpj/` | `TASK-002` | Valida CNPJ Numérico e Alfanumérico, identifica Matriz (`0001`) ou Filial e mostra DVs esperados vs informados. |
| `TASK-015` | **2.3** | **Validador de RG** | `/validador-rg` | `@worker-val-rg` | `feat/task-015-rg-validator` | `src/features/validators/rg/` | `TASK-004` | Verifica dígito verificador Mod-11 (`0-9` e `X`) do RG com feedback instantâneo. |
| `TASK-016` | **2.4** | **Validador de CNH** | `/validador-cnh` | `@worker-val-cnh` | `feat/task-016-cnh-validator` | `src/features/validators/cnh/` | `TASK-005` | Verifica os 11 dígitos da CNH e os 2 DVs segundo algoritmo do DENATRAN. |
| `TASK-017` | **2.5** | **Validador de PIS/PASEP** | `/validador-pis-pasep` | `@worker-val-pis` | `feat/task-017-pis-validator` | `src/features/validators/pis-pasep/` | `TASK-006` | Verifica o dígito verificador Mod-11 do PIS/PASEP/NIT de 11 dígitos. |
| `TASK-018` | **2.6** | **Validador de Título de Eleitor** | `/validador-titulo-de-eleitor` | `@worker-val-titulo` | `feat/task-018-titulo-validator` | `src/features/validators/titulo-eleitor/` | `TASK-007` | Verifica os 12 dígitos, identifica a UF emissora pelos dígitos 9-10 e valida os 2 DVs do TSE. |
| `TASK-019` | **2.7** | **Validar Inscrição Estadual** | `/validador-inscricao-estadual` | `@worker-val-ie` | `feat/task-019-ie-validator` | `src/features/validators/inscricao-estadual/` | `TASK-008` | Valida Inscrição Estadual para qualquer uma das 27 UFs segundo as regras estaduais da SEFAZ. |
| `TASK-020` | **2.8** | **Validador de Certidões** | `/validador-certidoes` | `@worker-val-certidoes` | `feat/task-020-certidoes-validator` | `src/features/validators/certidoes/` | `TASK-009` | Valida os 32 dígitos da matrícula CNJ e identifica o tipo de certidão (Nascimento, Casamento, Óbito) e ano. |
| `TASK-021` | **2.9** | **Validador de Cartão de Crédito** | `/validador-cartao-de-credito` | `@worker-val-cartao` | `feat/task-021-cc-validator` | `src/features/validators/cartao-credito/` | `TASK-011` | Executa check de Luhn, detecta bandeira automaticamente pelo BIN/IIN e valida quantidade de dígitos. |
| `TASK-022` | **2.10** | **Validador de Conta Bancária** | `/validador-conta-bancaria` | `@worker-val-conta` | `feat/task-022-bank-validator` | `src/features/validators/conta-bancaria/` | `TASK-010` | Valida o par Agência/Conta Corrente segundo o cálculo de DV de cada banco (BB, Bradesco, Itaú, Santander, Caixa, Citibank). |
| `TASK-023` | **2.11** | **Validador de RENAVAM** | `/validador-renavam` | `@worker-val-renavam` | `feat/task-023-renavam-validator` | `src/features/validators/renavam/` | `TASK-012` | Valida códigos RENAVAM de 9 ou 11 dígitos verificando o dígito verificador Mod-11. |

---

## Epic 4: People, Company, Vehicle & Test Data Generators (Geradores Compostos — Catálogo 1.12 a 1.26)

> **Objetivo:** Implementar todos os 15 geradores de veículos, entidades completas, texto estilizado, senhas, sorteios, imagens e currículo do 4Devs.

| Task ID | Ref Catálogo | Ferramenta | Rota (`slug`) | Agente Role | Branch / Worktree | Diretório Isolado (`src/features/...`) | Dependências | Critérios de Aceite |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-024` | **1.12** | **Gerador Placa de Veículos** | `/gerador-placa-veiculos` | `@worker-gen-placa` | `feat/task-024-placa-veiculos` | `src/features/generators/placa-veiculos/` | `TASK-000` | Gera placas automotivas no padrão Mercosul (`LLLNLNN`) e Antigo (`LLL-NNNN`) respeitando faixas de prefixo por UF. |
| `TASK-025` | **1.13** | **Gerador de Veículos** | `/gerador-de-veiculos` | `@worker-gen-veiculos` | `feat/task-025-veiculos` | `src/features/generators/veiculos/` | `TASK-012`, `TASK-024` | Ficha completa: Marca, Modelo, Ano, RENAVAM válido, Placa válida para a UF, Cor e Combustível. |
| `TASK-026` | **1.14** | **Gerador de CEP** | `/gerador-de-cep` | `@worker-gen-cep` | `feat/task-026-cep` | `src/features/generators/cep/` | `TASK-000` | Gera CEP válido dentro da faixa postal da UF escolhida com Logradouro, Bairro, Cidade e Estado. |
| `TASK-027` | **1.15** | **Gerador de Pessoas** | `/gerador-de-pessoas` | `@worker-gen-pessoas` | `feat/task-027-pessoas` | `src/features/generators/pessoas/` | `TASK-001`, `TASK-004`, `TASK-026` | Perfil completo (Nome, CPF, RG, Nasc, Signo, Filiação, Email, Senha, CEP/Endereço, Telefone, Celular, Altura, Peso, Tipo Sanguíneo) + lote (`1-30`) e export JSON/CSV/XML. |
| `TASK-028` | **1.16** | **Gerador de Empresas** | `/gerador-de-empresas` | `@worker-gen-empresas` | `feat/task-028-empresas` | `src/features/generators/empresas/` | `TASK-002`, `TASK-008`, `TASK-026` | Ficha completa (Razão Social, CNPJ válido, Inscrição Estadual válida para a UF, Abertura, Site, Email, Endereço, Telefones) + export JSON. |
| `TASK-029` | **1.17** | **Gerador de Nomes** | `/gerador-de-nomes` | `@worker-gen-nomes` | `feat/task-029-nomes` | `src/features/generators/nomes/` | `TASK-000` | Gera listas de nomes e sobrenomes completos filtráveis por gênero e quantidade. |
| `TASK-030` | **1.18** | **Gerador de Nicks** | `/gerador-de-nicks` | `@worker-gen-nicks` | `feat/task-030-nicks` | `src/features/generators/nicks/` | `TASK-000` | Gera nicknames criativos por combinação fonética/palavras e limite de caracteres (`4` a `15`). |
| `TASK-031` | **1.19** | **Gerador de Letras Diferentes** | `/letras-diferentes` | `@worker-gen-letras` | `feat/task-031-letras-diferentes` | `src/features/generators/letras-diferentes/` | `TASK-000` | Converte texto digitado em dezenas de variações Unicode estilizadas (cursiva, gótica, negrito, circulada, estética) com botão Copiar. |
| `TASK-032` | **1.20** | **Símbolos para Copiar** | `/simbolos-para-copiar` | `@worker-gen-simbolos` | `feat/task-032-simbolos` | `src/features/generators/simbolos/` | `TASK-000` | Grade interativa com busca por categoria (Estrelas, Corações, Setas, Jogos, Moedas, Matemática, Emojis) e cópia ao clicar. |
| `TASK-033` | **1.21** | **Gerador de Senha** | `/gerador-de-senha` | `@worker-gen-senha` | `feat/task-033-senha` | `src/features/generators/senha/` | `TASK-000` | Tamanho (`4` a `128`), maiúsculas, minúsculas, números, símbolos, evitar ambíguos, `crypto.getRandomValues` e barra de entropia. |
| `TASK-034` | **1.22** | **Gerador de Números Aleatórios** | `/gerador-numeros-aleatorios` | `@worker-gen-random` | `feat/task-034-numeros-aleatorios` | `src/features/generators/numeros-aleatorios/` | `TASK-000` | Gera números entre Mínimo e Máximo com controle de quantidade, repetição e ordenação. |
| `TASK-035` | **1.23** | **Sorteador de Números** | `/sorteador-de-numeros` | `@worker-gen-sorteador` | `feat/task-035-sorteador` | `src/features/generators/sorteador/` | `TASK-000` | Sorteio de números em intervalo (`De`/`Até`) com animação de resultado, sem repetição e timestamp de auditoria. |
| `TASK-036` | **1.24** | **Gerador de Lorem Ipsum** | `/gerador-lorem-ipsum` | `@worker-gen-lorem` | `feat/task-036-lorem-ipsum` | `src/features/generators/lorem-ipsum/` | `TASK-000` | Gera parágrafos, palavras, frases ou bytes com opção de começar com *"Lorem ipsum..."* e envolver em tags `<p>`. |
| `TASK-037` | **1.25** | **Gerador de Imagem (Lorem Pixel)** | `/gerador-de-imagem` | `@worker-gen-imagem` | `feat/task-037-imagem-placeholder` | `src/features/generators/imagem-placeholder/` | `TASK-000` | Gera imagens placeholder via Canvas/SVG com largura, altura, cores e texto customizáveis + download `PNG`/`SVG`/`WebP`. |
| `TASK-038` | **1.26** | **Gerador de Currículo** | `/gerador-de-curriculo` | `@worker-gen-curriculo` | `feat/task-038-curriculo` | `src/features/generators/curriculo/` | `TASK-000` | Formulário dinâmico completo com preview A4 em tempo real e exportação/impressão direta para PDF (`@media print`). |

---

## Epic 5: Financial, Labor & Math Calculators (Calculadoras Trabalhistas, Matemáticas, Datas & Áreas — Catálogo 3, 8 e 9)

> **Objetivo:** Implementar todas as 26 calculadoras trabalhistas, bancárias, aritméticas, de datas e de geometria plana mapeadas no 4Devs.

| Task ID | Ref Catálogo | Ferramenta | Rota (`slug`) | Agente Role | Branch / Worktree | Diretório Isolado (`src/features/...`) | Dependências | Critérios de Aceite |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-039` | **3.1** | **Calculadora de Rescisão de Contrato CLT** | `/calculadora-rescisao-clt` | `@worker-calc-rescisao` | `feat/task-039-rescisao-clt` | `src/features/calculators/rescisao-contrato/` | `TASK-000` | Calcula saldo de salário, aviso prévio, 13º proporcional, férias proporcionais + 1/3, multa FGTS (40%/20%) e descontos INSS/IRRF. |
| `TASK-040` | **3.2** | **Cálculo de Férias** | `/calculadora-de-ferias` | `@worker-calc-ferias` | `feat/task-040-calculo-ferias` | `src/features/calculators/calculo-ferias/` | `TASK-000` | Calcula férias brutas, 1/3 constitucional, abono pecuniário (venda de 1/3), adiantamento do 13º e descontos progressivos INSS/IRRF. |
| `TASK-041` | **3.3** | **Consulta Número do Banco** | `/consulta-numero-banco` | `@worker-util-banco` | `feat/task-041-consulta-banco` | `src/features/utilities/consulta-banco/` | `TASK-000` | Busca instantânea por Nome do Banco, Código COMPE (3 dígitos) ou ISPB (8 dígitos) com cópia rápida. |
| `TASK-042` | **8.1** | **Regra de 3 Simples** | `/calculadora-regra-de-3` | `@worker-math-regra3` | `feat/task-042-regra-de-tres` | `src/features/math/regra-de-tres/` | `TASK-000` | Calcula `X` para grandezas diretamente ou inversamente proporcionais com resolução algébrica passo a passo. |
| `TASK-043` | **8.2** | **Calculadora de Porcentagem** | `/calculadora-porcentagem` | `@worker-math-pct` | `feat/task-043-porcentagem` | `src/features/math/porcentagem/` | `TASK-000` | 4 calculadoras simultâneas (`X%` de `Y`, `X` é qual `%` de `Y`, aumento percentual e desconto percentual). |
| `TASK-044` | **8.3** | **Calculadora de MMC** | `/calculadora-mmc` | `@worker-math-mmc` | `feat/task-044-mmc` | `src/features/math/mmc/` | `TASK-000` | Calcula o Mínimo Múltiplo Comum de 2 ou mais inteiros com decomposição visual em fatores primos. |
| `TASK-045` | **8.4** | **Calculadora de MDC** | `/calculadora-mdc` | `@worker-math-mdc` | `feat/task-045-mdc` | `src/features/math/mdc/` | `TASK-000` | Calcula o Máximo Divisor Comum de 2 ou mais inteiros exibindo divisores e método de fatoração. |
| `TASK-046` | **8.5** | **Fatorar Número** | `/fatorar-numero` | `@worker-math-fatorar` | `feat/task-046-fatorar-numero` | `src/features/math/fatorar-numero/` | `TASK-000` | Decomposição em fatores primos (`2² × 3 × 5`), lista completa de divisores e teste de primalidade. |
| `TASK-047` | **8.6** | **Resto da Divisão (+ Operações Passo a Passo)** | `/resto-da-divisao` | `@worker-math-divisao` | `feat/task-047-resto-divisao` | `src/features/math/resto-divisao/` | `TASK-000` | Calcula quociente inteiro, resto (`mod`), resultado decimal e monta visualmente as 4 operações (`como somar/subtrair/multiplicar/dividir`). |
| `TASK-048` | **8.7** | **Conversor de Números Romanos** | `/conversor-numeros-romanos` | `@worker-math-romanos` | `feat/task-048-numeros-romanos` | `src/features/math/numeros-romanos/` | `TASK-000` | Conversão bidirecional entre números arábicos e algarismos romanos + tabela de referência. |
| `TASK-049` | **8.8** | **Contador de Dias entre Datas** | `/diferenca-entre-datas` | `@worker-math-datas` | `feat/task-049-diferenca-datas` | `src/features/math/diferenca-datas/` | `TASK-000` | Diferença entre duas datas em dias corridos, semanas, meses, anos, horas e dias úteis estimados. |
| `TASK-050` | **8.9** | **Somar Dias em Datas** | `/somar-dias-data` | `@worker-math-somar-data` | `feat/task-050-somar-dias-data` | `src/features/math/somar-dias-data/` | `TASK-000` | Soma dias, semanas, meses ou anos a uma data base exibindo a data final e o dia da semana. |
| `TASK-051` | **8.10** | **Subtrair Dias em Datas** | `/subtrair-dias-data` | `@worker-math-sub-data` | `feat/task-051-subtrair-dias-data` | `src/features/math/subtrair-dias-data/` | `TASK-000` | Subtrai dias, semanas, meses ou anos de uma data base exibindo a data resultante e o dia da semana. |
| `TASK-052` | **9.1** | **Área do Círculo** | `/area-circulo` | `@worker-area-circulo` | `feat/task-052-area-circulo` | `src/features/math/areas/circulo/` | `TASK-000` | Calcula área ($A = \pi r^2$) e circunferência ($C = 2\pi r$) com diagrama SVG interativo. |
| `TASK-053` | **9.2** | **Área do Quadrado** | `/area-quadrado` | `@worker-area-quadrado` | `feat/task-053-area-quadrado` | `src/features/math/areas/quadrado/` | `TASK-000` | Calcula área ($A = L^2$), perímetro ($4L$) e diagonal ($L\sqrt{2}$) com diagrama SVG. |
| `TASK-054` | **9.3** | **Área do Retângulo** | `/area-retangulo` | `@worker-area-retangulo` | `feat/task-054-area-retangulo` | `src/features/math/areas/retangulo/` | `TASK-000` | Calcula área ($A = b \cdot h$), perímetro e diagonal com diagrama SVG. |
| `TASK-055` | **9.4** | **Área do Triângulo** | `/area-triangulo` | `@worker-area-triangulo` | `feat/task-055-area-triangulo` | `src/features/math/areas/triangulo/` | `TASK-000` | Calcula área por base/altura ($b \cdot h / 2$) ou pelos 3 lados (Fórmula de Heron) com diagrama SVG. |
| `TASK-056` | **9.5** | **Área do Pentágono** | `/area-pentagono` | `@worker-area-pentagono` | `feat/task-056-area-pentagono` | `src/features/math/areas/pentagono/` | `TASK-000` | Calcula área, apótema e perímetro do pentágono regular a partir do lado $L$. |
| `TASK-057` | **9.6** | **Área do Hexágono** | `/area-hexagono` | `@worker-area-hexagono` | `feat/task-057-area-hexagono` | `src/features/math/areas/hexagono/` | `TASK-000` | Calcula área ($3\sqrt{3}L^2 / 2$), apótema e perímetro do hexágono regular. |
| `TASK-058` | **9.7** | **Área do Polígono Regular** | `/area-poligono-regular` | `@worker-area-poligono` | `feat/task-058-area-poligono` | `src/features/math/areas/poligono-regular/` | `TASK-000` | Calcula área e perímetro para qualquer polígono regular de $n \ge 3$ lados. |
| `TASK-059` | **9.8** | **Área do Losango** | `/area-losango` | `@worker-area-losango` | `feat/task-059-area-losango` | `src/features/math/areas/losango/` | `TASK-000` | Calcula área ($D \cdot d / 2$), lado e perímetro a partir das diagonais maior e menor. |
| `TASK-060` | **9.9** | **Área do Trapézio** | `/area-trapezio` | `@worker-area-trapezio` | `feat/task-060-area-trapezio` | `src/features/math/areas/trapezio/` | `TASK-000` | Calcula área ($(B + b) \cdot h / 2$) a partir da base maior, base menor e altura. |
| `TASK-061` | **9.10** | **Área do Paralelogramo** | `/area-paralelogramo` | `@worker-area-paralelogramo` | `feat/task-061-area-paralelogramo` | `src/features/math/areas/paralelogramo/` | `TASK-000` | Calcula área ($b \cdot h$) e perímetro do paralelogramo com diagrama SVG. |
| `TASK-062` | **9.11** | **Área da Elipse** | `/area-elipse` | `@worker-area-elipse` | `feat/task-062-area-elipse` | `src/features/math/areas/elipse/` | `TASK-000` | Calcula área ($A = \pi \cdot a \cdot b$) a partir dos semi-eixos maior e menor. |
| `TASK-063` | **9.12** | **Área da Coroa Circular** | `/area-coroa-circular` | `@worker-area-coroa` | `feat/task-063-area-coroa` | `src/features/math/areas/coroa-circular/` | `TASK-000` | Calcula área ($A = \pi(R^2 - r^2)$) validando $R > r$ com diagrama concêntrico SVG. |
| `TASK-064` | **9.13** | **Área do Setor Circular** | `/area-setor-circular` | `@worker-area-setor` | `feat/task-064-area-setor` | `src/features/math/areas/setor-circular/` | `TASK-000` | Calcula área ($\alpha \cdot \pi r^2 / 360^\circ$) e comprimento do arco a partir do raio e ângulo. |

---

## Epic 6: Text, Dev, Encoders & Network Utilities (Utilitários de String, Rede, Hashes e SEO — Catálogo 4, 5, 6 e 7)

> **Objetivo:** Implementar todas as 27 ferramentas de manipulação de strings, diagnóstico de rede, codificação/hashes, QR Code e utilitários web do 4Devs.

| Task ID | Ref Catálogo | Ferramenta | Rota (`slug`) | Agente Role | Branch / Worktree | Diretório Isolado (`src/features/...`) | Dependências | Critérios de Aceite |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-065` | **4.1** | **Contador de Caracteres** | `/contador-de-caracteres` | `@worker-txt-contador` | `feat/task-065-contador-caracteres` | `src/features/text/contador-caracteres/` | `TASK-000` | Contagem em tempo real de caracteres (com/sem espaços), palavras, linhas, parágrafos e tempo de leitura. |
| `TASK-066` | **4.2** | **Maiúsculas e Minúsculas** | `/maiusculas-e-minusculas` | `@worker-txt-case` | `feat/task-066-maiusculas-minusculas` | `src/features/text/maiusculas-minusculas/` | `TASK-000` | Converte para `MAIÚSCULAS`, `minúsculas`, `Primeira Letra Da Frase`, `Title Case`, `iNVERTER`, `aLtErNaDo` e cases de programação. |
| `TASK-067` | **4.3** | **Inverter Texto** | `/inverter-texto` | `@worker-txt-inverter` | `feat/task-067-inverter-texto` | `src/features/text/inverter-texto/` | `TASK-000` | Inverte todo o texto, ordem das palavras ou letras de cada palavra + detector de palíndromo. |
| `TASK-068` | **4.4** | **Remover Acentos do Texto** | `/remover-acentos` | `@worker-txt-acentos` | `feat/task-068-remover-acentos` | `src/features/text/remover-acentos/` | `TASK-000` | Normaliza texto via Unicode `NFD` removendo diacríticos e cedilha, com opção de gerar slug. |
| `TASK-069` | **4.5** | **Remover ou Trocar `\n` (Quebra de Linha)** | `/remover-quebra-de-linha` | `@worker-txt-quebra` | `feat/task-069-remover-quebra-linha` | `src/features/text/remover-quebra-linha/` | `TASK-000` | Remove quebras de linha ou substitui por espaço, vírgula, `<br>` ou delimitador customizado. |
| `TASK-070` | **4.6** | **Colocar em Ordem Alfabética** | `/ordem-alfabetica` | `@worker-txt-ordem` | `feat/task-070-ordem-alfabetica` | `src/features/text/ordem-alfabetica/` | `TASK-000` | Ordena lista de itens (`A-Z` ou `Z-A`) por quebra de linha/vírgula, com opção de remover duplicados. |
| `TASK-071` | **4.7** | **Contador de Ocorrência de Palavra** | `/contador-ocorrencia-palavra` | `@worker-txt-ocorrencia` | `feat/task-071-contador-ocorrencia` | `src/features/text/contador-ocorrencia/` | `TASK-000` | Conta ocorrências exatas de uma palavra/expressão e exibe ranking de frequência de palavras do texto. |
| `TASK-072` | **4.8** | **Converter Texto to HTML** | `/converter-texto-html` | `@worker-txt-html` | `feat/task-072-converter-texto-html` | `src/features/text/converter-texto-html/` | `TASK-000` | Converte quebras de linha em parágrafos `<p>` e `<br>` e escapa entidades HTML especiais. |
| `TASK-073` | **4.9** | **Cortar Textos (`x` letras)** | `/cortar-textos` | `@worker-txt-cortar` | `feat/task-073-cortar-textos` | `src/features/text/cortar-textos/` | `TASK-000` | Trunca texto a partir de uma posição inicial até `N` caracteres ou fatia em blocos de tamanho fixo. |
| `TASK-074` | **4.10** | **Dividir String (Split)** | `/dividir-string` | `@worker-txt-split` | `feat/task-074-dividir-string` | `src/features/text/dividir-string/` | `TASK-000` | Divide texto por delimitador customizado exibindo array indexado e total de partes. |
| `TASK-075` | **4.11** | **Informações de Caracter** | `/informacoes-caracter` | `@worker-txt-charinfo` | `feat/task-075-informacoes-caracter` | `src/features/text/informacoes-caracter/` | `TASK-000` | Exibe código Decimal, Hex, Octal, Binário, Entidade HTML, Code Point Unicode (`U+XXXX`) e URL Escape. |
| `TASK-076` | **4.12** | **Letras Personalizadas** | `/letras-personalizadas` | `@worker-txt-fontes` | `feat/task-076-letras-personalizadas` | `src/features/text/letras-personalizadas/` | `TASK-000` | Gera banners e textos em fontes decorativas / ASCII Art prontos para copiar. |
| `TASK-077` | **4.13** | **Número por Extenso** | `/numero-por-extenso` | `@worker-txt-extenso` | `feat/task-077-numero-por-extenso` | `src/features/text/numero-por-extenso/` | `TASK-000` | Escreve valores numéricos ou em Moeda (`R$ Reais e Centavos`) por extenso com opção de gênero e capitalização. |
| `TASK-078` | **4.14** | **Corretor Ortográfico** | `/corretor-ortografico` | `@worker-txt-corretor` | `feat/task-078-corretor-ortografico` | `src/features/text/corretor-ortografico/` | `TASK-000` | Higieniza espaçamentos duplos, pontuação, palavras repetidas, capitalização pós-ponto e erros comuns em PT-BR. |
| `TASK-079` | **5.1** | **Meu IP** | `/meu-ip` | `@worker-net-ip` | `feat/task-079-meu-ip` | `src/features/network/meu-ip/` | `TASK-000` | Exibe endereço IPv4/IPv6 público do cliente, informações de rede e botão de cópia rápida. |
| `TASK-080` | **5.2** | **Meu Navegador** | `/meu-navegador` | `@worker-net-browser` | `feat/task-080-meu-navegador` | `src/features/network/meu-navegador/` | `TASK-000` | Exibe Nome/Versão do Browser, Engine, User-Agent, Idioma, Cookies, Resolução de tela/viewport e status online. |
| `TASK-081` | **5.3** | **Meu Sistema Operacional** | `/meu-sistema-operacional` | `@worker-net-os` | `feat/task-081-meu-so` | `src/features/network/meu-sistema-operacional/` | `TASK-000` | Detecta Sistema Operacional, plataforma/arquitetura, núcleos lógicos de CPU e suporte a touch. |
| `TASK-082` | **6.1** | **Base64 Decodificar e Codificar** | `/base64` | `@worker-enc-base64` | `feat/task-082-base64` | `src/features/encoders/base64/` | `TASK-000` | Codifica e decodifica strings UTF-8 para Base64 com tratamento de erros e cópia rápida. |
| `TASK-083` | **6.2** | **URL Encode / Decode** | `/url-encode-decode` | `@worker-enc-url` | `feat/task-083-url-encode` | `src/features/encoders/url-encode/` | `TASK-000` | Codifica e decodifica URLs (`encodeURIComponent` / `encodeURI`) com preview instantâneo. |
| `TASK-084` | **6.3** | **Tradutor de Código Binário** | `/tradutor-codigo-binario` | `@worker-enc-binario` | `feat/task-084-codigo-binario` | `src/features/encoders/codigo-binario/` | `TASK-000` | Tradução bidirecional entre texto UTF-8/ASCII e sequência de octetos binários (`01000001`). |
| `TASK-085` | **6.4** | **Codificar MD5** | `/gerador-md5` | `@worker-enc-md5` | `feat/task-085-md5` | `src/features/encoders/md5/` | `TASK-000` | Gera hash MD5 de 128 bits (32 caracteres hexadecimais) em caixa baixa e alta. |
| `TASK-086` | **6.5** | **Codificar SHA1 (+ SHA-256 / SHA-512)** | `/gerador-sha1` | `@worker-enc-sha1` | `feat/task-086-sha1` | `src/features/encoders/sha1/` | `TASK-000` | Gera hash SHA-1 de 160 bits (e variantes SHA-256/SHA-512 via Web Crypto API). |
| `TASK-087` | **6.6** | **Calcular CRC32** | `/calcular-crc32` | `@worker-enc-crc32` | `feat/task-087-crc32` | `src/features/encoders/crc32/` | `TASK-000` | Calcula checksum CRC32 exibindo valores em Hexadecimal e Decimal. |
| `TASK-088` | **6.7** | **Gerador de QR Code** | `/gerador-de-qrcode` | `@worker-enc-qrcode` | `feat/task-088-qrcode` | `src/features/encoders/qrcode/` | `TASK-000` | Gera QR Code customizável (Texto, URL, Wi-Fi, PIX) com controle de tamanho, correção de erro e download `PNG`/`SVG`. |
| `TASK-089` | **7.1** | **Gerador de Meta Tags** | `/gerador-meta-tags` | `@worker-dev-metatags` | `feat/task-089-meta-tags` | `src/features/dev/gerador-meta-tags/` | `TASK-000` | Gera tags `<meta>` SEO, Open Graph e Twitter Cards com preview de snippet do Google e redes sociais. |
| `TASK-090` | **7.2** | **Color Picker** | `/color-picker` | `@worker-dev-color` | `feat/task-090-color-picker` | `src/features/dev/color-picker/` | `TASK-000` | Seletor visual de cores com conversão instantânea `HEX`, `RGB`, `HSL`, `CMYK`, paleta harmônica e contraste WCAG. |
| `TASK-091` | **7.3** | **Tabela ASCII** | `/tabela-ascii` | `@worker-dev-ascii` | `feat/task-091-tabela-ascii` | `src/features/dev/tabela-ascii/` | `TASK-000` | Tabela interativa e pesquisável com códigos ASCII de controle (`0-31`), imprimíveis (`32-127`) e estendidos (`128-255`). |

---

## Epic 7: SEO, Command Palette, PWA & Vercel Production Deploy

> **Objetivo:** Finalizar a plataforma com busca instantânea (`Cmd+K`), geração dinâmica de Sitemap/Sub-rotas de SEO, suporte PWA mobile e pipeline CI/CD GitHub + Vercel.

| Task ID | Entrega | Agente Role | Branch / Worktree | Diretório / Escopo | Dependências | Critérios de Aceite |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-092` | **Command Palette Global (`Cmd+K` / Busca Instantânea Mobile)** | `@worker-search` | `feat/task-092-command-palette` | `src/components/layout/command-search.tsx` | `TASK-000` | Busca rápida por teclado (`Cmd+K` / `Ctrl+K`) ou toque no Header mobile filtrando todas as 91 ferramentas por título, categoria ou palavras-chave. |
| `TASK-093` | **SEO Dinâmico (`sitemap.ts`, `robots.ts` & Sub-rotas Estaduais)** | `@worker-seo` | `feat/task-093-seo-sitemap` | `src/app/sitemap.ts`, `src/app/robots.ts` | `TASK-000` | Geração automática de `/sitemap.xml` cobrindo as 91 ferramentas e as +34 sub-rotas estaduais/temáticas mapeadas no catálogo. |
| `TASK-094` | **PWA Mobile Support (`manifest.ts` + Favoritos / Recentes)** | `@worker-pwa` | `feat/task-094-pwa-favorites` | `src/app/manifest.ts`, `src/hooks/use-favorites.ts` | `TASK-000` | Web App Manifest para instalação na tela inicial no Android/iOS + persistência de ferramentas favoritas e recentes no `localStorage`. |
| `TASK-095` | **GitHub Actions CI Workflow & Vercel Production Config** | `@scaffold` / `@devops` | `feat/task-095-ci-vercel` | `.github/workflows/ci.yml` | `TASK-001`..`TASK-003` | Pipeline de ESLint + TypeScript Check + Next.js Build validado no GitHub e pronto para deploy contínuo na Vercel. |
