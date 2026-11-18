# DevToolsBR — Suite 4Devs & Calculadoras Financeiras

Aplicação web moderna, responsiva (mobile-first) e 100% client-side construída com **Next.js (App Router)**, **TypeScript**, **Tailwind CSS** e **shadcn/ui**, replicando os geradores e validadores do [4Devs](https://www.4devs.com.br/) e a Calculadora de Juros Compostos do [Investidor10](https://investidor10.com.br/calculadoras/juros-compostos/).

## Ferramentas Principais (MVP)

- **Gerador e Validador de CPF (`/gerador-de-cpf`)**: Geração unitária e em lote com algoritmo oficial Módulo 11, filtro por estado de origem (UF — 9º dígito), máscara opcional e validador integrado.
- **Gerador e Validador de CNPJ (`/gerador-de-cnpj`)**: Geração e validação de CNPJ tradicional numérico e alfanumérico (IN RFB nº 2.229/2024), opção de matriz (`0001`) ou filial, e geração em lote.
- **Calculadora de Juros Compostos (`/calculadora-juros-compostos`)**: Simulação com aporte inicial, aporte mensal, conversão exata de taxas (anual/mensal), cards de resumo, gráfico interativo e tabela evolutiva período a período.

## Arquitetura Modular (Pronta para Git Worktrees)

Cada ferramenta reside em seu próprio diretório isolado em `src/features/<categoria>/<slug>/`, permitindo desenvolvimento paralelo via **Git Worktrees** sem conflitos de merge:

```text
src/
├── app/                                  # Rotas Next.js App Router
│   ├── gerador-de-cpf/page.tsx
│   ├── gerador-de-cnpj/page.tsx
│   └── calculadora-juros-compostos/page.tsx
├── components/
│   ├── layout/                           # AppShell, SiteHeader, SidebarNav
│   └── ui/                               # Componentes shadcn/ui
├── config/
│   └── tools-registry.ts                 # Catálogo declarativo de ferramentas
└── features/
    ├── generators/
    │   ├── cpf/                          # Módulo isolado: Gerador/Validador de CPF
    │   └── cnpj/                         # Módulo isolado: Gerador/Validador de CNPJ
    └── calculators/
        └── compound-interest/            # Módulo isolado: Calculadora de Juros Compostos
```

Consulte a documentação completa e o plano de execução em [`docs/README.md`](./docs/README.md).

## Como Executar

```bash
npm install
npm run dev
```

Para validar lint e build de produção:

```bash
npm run lint
npm run build
```
