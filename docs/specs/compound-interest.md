# Especificação Funcional e Matemática — Calculadora de Juros Compostos

- **Referência Original**: `https://investidor10.com.br/calculadoras/juros-compostos/`
- **Script Original Analisado**: `https://investidor10.com.br/assets/front/dist/js/compound-interest.js`
- **Rota no Projeto**: `/calculadora-juros-compostos`
- **Módulo Isolado (Worktree Target)**: `src/features/calculators/compound-interest/`
- **Prioridade**: **MVP — Epic 1 (Task P3)**

---

## 1. Visão Geral da Ferramenta

A Calculadora de Juros Compostos replica fielmente a experiência e a matemática exata da calculadora do **Investidor10**, permitindo simular a evolução patrimonial de um investimento com aporte inicial, aportes mensais recorrentes, taxa de juros (mensal ou anual) e prazo (em meses ou anos).

Nossa implementação moderna com `shadcn/ui` oferece:
1. **Inputs Financeiros com Máscara Monetária (`R$`) e Percentual (`%`)** amigáveis no celular (`inputMode="decimal"`).
2. **3 Cards de Destaque no Resultado**:
   - **Valor Total Final** (`Acumulado`)
   - **Valor Total Investido** (`Capital Inicial + Soma dos Aportes Mensais`)
   - **Total em Juros** (`Rendimento Composto Acumulado`)
3. **Visualização Gráfica Dupla (fiel ao Investidor10)**:
   - **Gráfico de Rosca (Donut/Pie)**: Proporção entre `Total Investido` vs `Total em Juros`.
   - **Gráfico de Barras Empilhadas (Stacked Bar / Area)**: Evolução período a período mostrando o crescimento exponencial dos juros sobre o capital investido.
4. **Tabela de Evolução Período a Período**:
   - 5 colunas idênticas ao Investidor10: `Mês/Ano`, `Juros (no período)`, `Total Investido`, `Total Juros`, `Acumulado`.

---

## 2. Mapeamento Exato de Inputs (`#feesCompostosForm` do Investidor10)

| Campo | ID no Investidor10 | Tipo / Máscara | Opções de Seletor | Valor Inicial / Padrão Sugerido | Obrigatoriedade |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Valor Inicial** | `#mainValue` | Moeda `R$ #.##0,00` | — | `R$ 1.000,00` (ou placeholder `0,00`) | Obrigatório (pode ser `0,00` se houver aporte mensal) |
| **Valor Mensal (Investimento Mensal)** | `#investment` | Moeda `R$ #.##0,00` | — | `R$ 500,00` (ou placeholder `0,00`) | Opcional (default `0,00`) |
| **Taxa de Juros** | `#rate` + `#select-rate` | Percentual `% 0,00` + `Select` | `Anual` (`ano`) / `Mensal` (`mes`) | `10,00%` `Anual` | Obrigatório ($> 0$) |
| **Período** | `#period` + `#select-period` | Número inteiro/decimal + `Select` | `Anos` (`ano`) / `Meses` (`mes`) | `10` `Anos` | Obrigatório ($\ge 1$) |
| **Botão Calcular** | `button[type=submit]` | Botão primário de ação | — | — | Dispara ou atualiza a simulação |
| **Botão Limpar** | `#btn-clear` | Botão secundário (`outline`/`ghost`) | — | — | Reseta os campos e oculta/reseta resultados |

---

## 3. Fórmulas Matemáticas Exatas (Extraídas de `compound-interest.js`)

Seja:
- $P_0 = \text{Valor Inicial}$ (`mainValue`, variável `d` no script original)
- $PMT = \text{Investimento Mensal}$ (`investment`, variável `y` no script original)
- $r = \frac{\text{Taxa de Juros informada}}{100}$ (`rate / 100`, variável `c` no script original)
- $T = \text{Período informado}$ (`period`, variável `p` no script original)

### 3.1 Conversão da Taxa de Juros para Taxa Efetiva Mensal ($i_m$)
No Investidor10 (`compound-interest.js`), o cálculo da evolução é sempre executado **mês a mês** usando equivalência composta de taxas quando a taxa informada é anual:
- Se o seletor de taxa for **Mensal** (`"mes"`):
  $$i_m = r$$
- Se o seletor de taxa for **Anual** (`"ano"`):
  $$i_m = (1 + r)^{\frac{1}{12}} - 1$$
  *(No código original: `u = Math.pow(1 + c, 1 / 12) - 1`)*.

> **Exemplo de Verificação**: Uma taxa anual de $12\% \text{ a.a.}$ ($r = 0.12$) resulta em:
> $$i_m = (1.12)^{1/12} - 1 \approx 0.0094887929 \text{ (ou } 0.948879\% \text{ ao mês)}$$
> *(Importante: **Nunca** dividir a taxa anual por 12 de forma linear; usar sempre equivalência exponencial $(1 + i_a)^{1/12} - 1$).*

### 3.2 Conversão do Período para Total de Meses ($N$)
- Se o seletor de período for **Meses** (`"mes"`):
  $$N = T$$
- Se o seletor de período for **Anos** (`"ano"`):
  $$N = \text{round}(12 \times T)$$

### 3.3 Iteração Mês a Mês (Mês $0$ até Mês $N$)
O Investidor10 constrói o vetor de evolução `w` começando no **Mês 0** (momento da aplicação inicial, antes de qualquer rendimento ou aporte mensal):

- **Estado Inicial ($m = 0$)**:
  - $\text{Saldo}_0 = P_0$
  - $\text{JurosMes}_0 = 0$
  - $\text{TotalInvestido}_0 = P_0$
  - $\text{TotalJuros}_0 = 0$

- **Para cada mês $m = 1, 2, \dots, N$**:
  1. Os juros do mês $m$ incidem sobre o saldo acumulado do mês anterior ($\text{Saldo}_{m-1}$):
     $$\text{JurosMes}_m = \text{Saldo}_{m-1} \times i_m$$
  2. O aporte mensal $PMT$ é somado ao final do mês (após o cálculo do juro sobre o saldo anterior):
     $$\text{Saldo}_m = \text{Saldo}_{m-1} + \text{JurosMes}_m + PMT$$
  3. Atualiza-se o acumulado investido e o acumulado de juros:
     $$\text{TotalInvestido}_m = \text{TotalInvestido}_{m-1} + PMT = P_0 + (m \times PMT)$$
     $$\text{TotalJuros}_m = \text{TotalJuros}_{m-1} + \text{JurosMes}_m = \text{Saldo}_m - \text{TotalInvestido}_m$$

### 3.4 Fórmula Fechada Equivalente (Para Teste Unitário de Sanidade)
Ao final do mês $N$, os valores totais convergem exatamente para a equação clássica de Valor Futuro ($FV$) com aportes postecipados:
$$\text{Valor Total Investido} = P_0 + (PMT \times N)$$
$$\text{Valor Total Final } (FV) = P_0 \cdot (1 + i_m)^N + PMT \cdot \frac{(1 + i_m)^N - 1}{i_m} \quad (\text{para } i_m > 0)$$
$$\text{Total em Juros} = FV - \text{Valor Total Investido}$$
*(Se $i_m = 0$, então $FV = P_0 + PMT \times N$ e $\text{Total em Juros} = 0$).*

---

## 4. Estrutura dos Resultados (Cards, Gráfico e Tabela)

### 4.1 Os 3 Cards de Destaque (`#result`)
Exibidos no topo da seção de resultados com formatação `R$ #.##0,00` (`Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`):
1. **Valor Total Final (`#amount`)**: Destaque principal (cor primária/esmeralda ou dourado), exibindo $\text{Saldo}_N$ e badge percentual de ganho total.
2. **Valor Total Investido (`#invested`)**: Exibindo $\text{TotalInvestido}_N$ ($P_0 + N \times PMT$) e qual `%` do montante final corresponde a esforço próprio.
3. **Total em Juros (`#interest`)**: Exibindo $\text{TotalJuros}_N$ e qual `%` do montante final veio do efeito bola de neve dos juros compostos.

### 4.2 Seção Gráfica (`#resultGraphic`)
1. **Composição Final (Donut / Barra de Proporção)**:
   - Mostra visualmente a fatia de **Total Investido** vs **Total em Juros**.
2. **Gráfico de Evolução Patrimonial no Tempo (Barras Empilhadas / Área Interativa)**:
   - **Eixo X**: Período (`Meses` de `0` a `N`, ou `Anos` quando agrupado para períodos longos $\ge 252$ meses ou quando o usuário alternar o filtro `Mensal / Anual`).
   - **Eixo Y**: Valor em `R$` abreviado (`R$ 10 mil`, `R$ 1,2 mi`).
   - **Série 1 (Base da pilha)**: `Total Investido` no período $m$.
   - **Série 2 (Topo da pilha)**: `Total em Juros` acumulado até o período $m$.
   - **Tooltip Interativo**: Ao passar o mouse ou tocar no celular sobre uma coluna $m$, exibe:
     - **Período**: Mês $m$ (ou Ano $a$)
     - **Total Final**: `R$ X.XXX,XX`
     - **Total Investido**: `R$ X.XXX,XX`
     - **Total em Juros**: `R$ X.XXX,XX`

### 4.3 Tabela de Evolução (`#evolutionTable`)
Tabela responsiva com cabeçalho fixo (`sticky`), scroll horizontal suave no celular e alternador opcional entre **Visão Mensal** e **Visão Anual**:

| Coluna | Cabeçalho (PT-BR) | Campo do Objeto | Descrição |
| :---: | :--- | :--- | :--- |
| **1** | **Meses** *(ou Anos)* | `month` (`0..N`) | Índice do período (`0` é o marco inicial) |
| **2** | **Juros** | `periodInterest` | Rendimento obtido exclusivamente naquele mês ($\text{JurosMes}_m$) |
| **3** | **Total Investido** | `totalInvested` | Soma acumulada desembolsada até aquele mês ($P_0 + m \times PMT$) |
| **4** | **Total Juros** | `totalInterest` | Soma acumulada de todos os juros ganhos do mês `1` até o mês $m$ |
| **5** | **Acumulado** *(Destaque)* | `totalAmount` | Patrimônio total acumulado ao final do mês $m$ ($\text{TotalInvestido}_m + \text{TotalJuros}_m$) |

---

## 5. Caso de Teste Padrão (Golden Test para `@verifier`)

Para validação automatizada em `compound-interest.test.ts`:
- **Cenário 1 (Taxa Anual + Prazo em Anos)**:
  - Valor Inicial ($P_0$) = `R$ 1.000,00`
  - Investimento Mensal ($PMT$) = `R$ 500,00`
  - Taxa de Juros = `12% Anual` $\implies i_m = (1.12)^{1/12} - 1 \approx 0.009488792934583046$
  - Período = `1 Ano` (`12 meses`)
  - **Resultados Esperados**:
    - `Valor Total Investido` = `R$ 7.000,00` ($1000 + 12 \times 500$)
    - `Valor Total Final` = `R$ 7.456,63` ($1000 \times 1.12 + 500 \times \frac{1.12 - 1}{i_m} = 1120 + 6336.63 = 7456.63$)
    - `Total em Juros` = `R$ 456,63`
    - Linha `Mês 0`: Juros = `R$ 0,00`, Total Investido = `R$ 1.000,00`, Total Juros = `R$ 0,00`, Acumulado = `R$ 1.000,00`.
    - Linha `Mês 1`: Juros = `R$ 9,49` ($1000 \times i_m$), Total Investido = `R$ 1.500,00`, Total Juros = `R$ 9,49`, Acumulado = `R$ 1.509,49`.

- **Cenário 2 (Taxa Mensal + Prazo em Meses)**:
  - Valor Inicial ($P_0$) = `R$ 10.000,00`
  - Investimento Mensal ($PMT$) = `R$ 1.000,00`
  - Taxa de Juros = `1% Mensal` ($i_m = 0.01$)
  - Período = `12 Meses`
  - **Resultados Esperados**:
    - `Valor Total Investido` = `R$ 22.000,00`
    - `Valor Total Final` = `R$ 23.950,75` ($10000 \times (1.01)^{12} + 1000 \times \frac{(1.01)^{12} - 1}{0.01} = 11268.2503 + 12682.5030 = 23950.75$)
    - `Total em Juros` = `R$ 1.950,75`

---

## 6. Contrato de Código TypeScript (`src/features/calculators/compound-interest/`)

Estrutura sugerida para o módulo:
```text
src/features/calculators/compound-interest/
├── compound-interest-utils.ts       # Funções matemáticas puras e formatação BRL
├── compound-interest-utils.test.ts  # Testes unitários cobrindo os Golden Tests acima
├── compound-interest-calculator.tsx # Componente principal (Form + 3 Cards + Gráfico + Tabela)
└── index.ts                         # Barrel export
```

### Assinaturas Esperadas em `compound-interest-utils.ts`:
```typescript
export type RatePeriodUnit = 'month' | 'year';
export type TimePeriodUnit = 'months' | 'years';

export interface CompoundInterestInput {
  initialValue: number;      // R$
  monthlyContribution: number; // R$
  interestRate: number;      // % (ex: 12 para 12%)
  rateUnit: RatePeriodUnit;  // 'month' | 'year'
  period: number;            // ex: 10
  periodUnit: TimePeriodUnit; // 'months' | 'years'
}

export interface EvolutionRow {
  month: number;
  year: number;
  periodInterest: number;
  totalInvested: number;
  totalInterest: number;
  totalAmount: number;
}

export interface CompoundInterestResult {
  finalAmount: number;
  totalInvested: number;
  totalInterest: number;
  effectiveMonthlyRate: number;
  effectiveAnnualRate: number;
  totalMonths: number;
  monthlyEvolution: EvolutionRow[];
  yearlyEvolution: EvolutionRow[];
}

export function calculateCompoundInterest(input: CompoundInterestInput): CompoundInterestResult;
```

---

## 7. Critérios de Aceite e UX Mobile-First (Checklist para `@verifier`)
- [ ] **Above-the-Fold Mobile (`375x667`)**: Presets de mercado integrados em uma **única faixa horizontal rolável** (`overflow-x-auto no-scrollbar`) no topo do card de simulação, seguidos imediatamente pelos 4 inputs compactos (`h-9 sm:h-10`) e pelos 3 cards de resumo (`Valor Total Final`, `Total Investido`, `Total em Juros`), sem que uma caixa gigante de presets empurre o formulário para fora da tela.
- [ ] **Zero Jargões/Referências**: Nenhuma menção a `"Investidor10"`, `"4Devs"`, `"Motor"` ou `"Client-side"` na UI.
- [ ] Conversão de taxa anual para mensal usa rigorosamente $(1 + i_a)^{1/12} - 1$.
- [ ] Os 3 cards de destaque (`Valor Total Final`, `Valor Total Investido`, `Total em Juros`) batem no centavo nos casos de teste.
- [ ] A tabela exibe o `Mês 0` inicial e todas as 5 colunas (`Meses/Anos`, `Juros`, `Total Investido`, `Total Juros`, `Acumulado`).
- [ ] O gráfico exibe a evolução empilhada (`Total Investido` + `Total em Juros`) com tooltip detalhado e responsividade mobile.
- [ ] Botão `Restaurar`/`Limpar` reseta o formulário e permite nova simulação limpa.
