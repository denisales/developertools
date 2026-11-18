# Arquitetura do Projeto e Design System (`project-structure.md`)

Este documento define a arquitetura modular do projeto **DeveloperTools (4Devs + Investidor10 Clone)**, projetada especificamente para **desenvolvimento altamente paralelizado com Git Worktrees** e múltiplos agentes autônomos sem conflitos de merge.

---

## 1. Stack Tecnológica Principal

| Camada | Tecnologia | Justificativa |
| :--- | :--- | :--- |
| **Framework** | Next.js 15+ (App Router) | Server Components por padrão, roteamento baseado em arquivos, geração estática (SSG) e SEO nativo por rota (`Metadata` API). |
| **Linguagem** | TypeScript 5+ (Strict Mode) | Tipagem estática rigorosa para algoritmos de validação, geração de documentos e cálculos financeiros. |
| **Estilização** | Tailwind CSS + `shadcn/ui` | Componentes acessíveis (Radix UI), customizáveis, suporte nativo a Dark/Light mode e foco em responsividade mobile-first. |
| **Ícones** | `lucide-react` | Biblioteca de ícones leve, consistente e tree-shakable. |
| **Qualidade & Linter** | ESLint + TypeScript Check | Validação estática contínua em pre-commit e GitHub Actions CI. |
| **Deploy & Hosting** | Vercel | Deploy contínuo integrado ao GitHub com Preview URLs por branch/PR e Edge Network global. |

---

## 2. Arquitetura Modular Orientada a Features (Feature-First / Plugin)

Para permitir que dezenas de agentes trabalhem simultaneamente em diferentes ferramentas usando **Git Worktrees** (`git worktree add` ou `workspace: "share"` no Swarm), o código de cada ferramenta é **100% isolado** em seu próprio diretório dentro de `src/features/<category>/<tool-slug>/`.

### Árvore de Diretórios do Projeto

```text
/home/denis/dev/developertools/
├── docs/                                  # Documentação completa do projeto
│   ├── README.md                          # Índice mestre da documentação
│   ├── catalog/
│   │   └── 4devs-complete-map.md          # Mapeamento completo do 4Devs + Investidor10
│   ├── specs/
│   │   ├── cpf-generator.md               # Especificação funcional e algorítmica: CPF
│   │   ├── cnpj-generator.md              # Especificação funcional e algorítmica: CNPJ
│   │   └── compound-interest.md           # Especificação funcional e matemática: Juros Compostos
│   ├── architecture/
│   │   └── project-structure.md           # Este documento (Arquitetura e UI/UX)
│   └── plan/
│       ├── epics-and-tasks.md             # Backlog completo de Épicos e Tasks (TASK-001..N)
│       ├── parallel-worktrees-guide.md    # Guia de orquestração paralela com Git Worktrees
│       └── deploy-and-github.md           # Setup do GitHub, CI/CD e deploy na Vercel
├── public/                                # Assets estáticos, ícones PWA, opengraph images
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
│   │   └── tools-registry.ts              # Registro declarativo central de todas as ferramentas
│   ├── features/                          # MÓDULOS ISOLADOS POR FERRAMENTA (Zero conflito entre Worktrees)
│   │   ├── generators/                    # Categoria: Geradores (Documentos, Pessoas, Veículos, Dados)
│   │   │   ├── cpf/                       # Worktree isolada: feat/tool-cpf-generator
│   │   │   │   ├── index.ts               # Public API da feature
│   │   │   │   ├── cpf-utils.ts           # Lógica pura Mod-11, máscara, estados fiscais (9º dígito)
│   │   │   │   ├── cpf-utils.test.ts      # Testes unitários da lógica pura
│   │   │   │   ├── use-cpf-generator.ts   # Hook de estado (opções, histórico local, geração em lote)
│   │   │   │   └── cpf-generator-view.tsx # Componente visual principal (shadcn/ui)
│   │   │   ├── cnpj/                      # Worktree isolada: feat/tool-cnpj-generator
│   │   │   │   ├── index.ts
│   │   │   │   ├── cnpj-utils.ts          # Lógica pura Mod-11 (numérico e alfanumérico), matriz/filial
│   │   │   │   ├── cnpj-utils.test.ts
│   │   │   │   ├── use-cnpj-generator.ts
│   │   │   │   └── cnpj-generator-view.tsx
│   │   │   └── ...                        # Demais geradores (rg, cnh, pis, titulo-eleitor, pessoa, etc.)
│   │   ├── validators/                    # Categoria: Validadores
│   │   │   ├── cpf/
│   │   │   ├── cnpj/
│   │   │   └── ...
│   │   ├── calculators/                   # Categoria: Calculadoras Financeiras e Matemáticas
│   │   │   ├── compound-interest/         # Worktree isolada: feat/tool-compound-interest
│   │   │   │   ├── index.ts
│   │   │   │   ├── compound-interest-math.ts      # Motor matemático de juros compostos e conversão de taxas
│   │   │   │   ├── compound-interest-math.test.ts # Testes de precisão financeira
│   │   │   │   ├── compound-interest-cards.tsx    # 3 Cards de resumo (Total Final, Investido, Total Juros)
│   │   │   │   ├── compound-interest-chart.tsx    # Gráfico interativo (Patrimônio vs Juros ao longo do tempo)
│   │   │   │   ├── compound-interest-table.tsx    # Tabela detalhada mês a mês / ano a ano
│   │   │   │   └── compound-interest-view.tsx     # View completa integrada
│   │   │   └── ...
│   │   └── utilities/                     # Categoria: Texto, Dev, Rede, Conversores e Sorteadores
│   │       └── ...
│   ├── hooks/                             # Hooks globais (use-clipboard, use-local-history, use-media-query)
│   └── lib/                               # Utilitários puros globais (cn, formatters de moeda/número, mod11)
└── package.json
```

---

## 3. Anatomia Interna de um Módulo (`src/features/<category>/<tool-slug>/`)

Cada ferramenta segue um contrato de arquivos padronizado para garantir consistência arquitetural e independência total:

1. **`<slug>-utils.ts` ou `<slug>-math.ts` (Pure Domain Logic)**
   - Funções 100% puras em TypeScript, sem dependência de React ou DOM.
   - Facilita testes automatizados instantâneos e reutilização entre Gerador e Validador (ex.: `generateCpf()`, `validateCpf()`, `formatCpf()`).
2. **`<slug>-utils.test.ts` (Unit Tests)**
   - Testes de casos de borda, dígitos verificadores Mod-11, formatação com/sem pontuação e precisão decimal.
3. **`use-<slug>.ts` (State & Interaction Hook)**
   - Encapsula estados de formulário, geração instantânea, histórico recente em `localStorage` e atalhos de teclado.
4. **`<slug>-view.tsx` (Client UI Component)**
   - Interface construída com componentes `shadcn/ui`, responsiva e otimizada para toque em dispositivos móveis.
5. **`index.ts` (Barrel Export)**
   - Exporta apenas o componente principal e metadados necessários para a rota em `src/app/`.

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
  - Seção explicativa inferior em cada ferramenta ("Como funciona o cálculo de CPF Mod-11", "Fórmula dos Juros Compostos", aviso legal de uso exclusivo para testes de software).
