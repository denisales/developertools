# Especificação Funcional e Matemática — Tabela de IR (Renda Fixa) e Visão de Valor Líquido

- **Rota no Projeto**: `/calculadora-juros-compostos`
- **Módulo Isolado**: `src/features/calculators/compound-interest/`
- **Especificação Base**: [`docs/specs/compound-interest.md`](./compound-interest.md)
- **Task Relacionada**: `TASK-003B` (Extensão de `TASK-003` no **Epic 1**)
- **Base Legal**: Lei nº 11.033/2004 (Tabela Regressiva de Imposto de Renda sobre Rendimentos de Renda Fixa) e Lei nº 12.431/2011 / legislação de isenção para Pessoa Física (`LCI`, `LCA`, `CRI`, `CRA`, `Debêntures Incentivadas`, `Poupança`).

---

## 1. Visão Geral da Evolução

Esta especificação define a inclusão do **cálculo regressivo de Imposto de Renda (IR) da Renda Fixa brasileira** e da **Visão de Valor Líquido** na Calculadora de Juros Compostos (`/calculadora-juros-compostos`), permitindo ao investidor comparar instantaneamente o rendimento **Bruto** versus o rendimento **Líquido após IR**, ou simular aplicações **Isentas de IR**.

### Objetivos Principais
1. **Precisão Tributária (Lei nº 11.033/2004):** Aplicar a alíquota regressiva correta de acordo com o prazo da aplicação, incidindo exclusivamente sobre os **rendimentos (juros)** e nunca sobre o capital principal investido.
2. **Alternância Instantânea de Visão e Regime:** Permitir alternar com um toque entre **`Valor Bruto`** e **`Valor Líquido`**, bem como entre **`Tabela IR (Renda Fixa)`** e **`Isento (LCI/LCA)`**.
3. **Transparência nos Resultados:** Refletir a visão ativa nos 3 Cards de Resumo, nos Gráficos (Rosca e Barras Empilhadas), na Tabela de Evolução, na Exportação CSV, na Cópia de Resumo e em um card educativo dedicado com a **Tabela Oficial de Alíquotas** destacando a faixa vigente para o prazo simulado.
4. **Preservação de Ergonomia Mobile (`375x667`):** Manter o resultado principal (`#amount` / `Valor Total Final`) integralmente visível acima da dobra (`bottom <= 667px`) e garantir zero overflow horizontal ou vazamento de cards.

---

## 2. Regras Tributárias e Tabela de Alíquotas (Lei nº 11.033/2004)

### 2.1 Tabela Regressiva de Renda Fixa (Tributável)
Nos investimentos de Renda Fixa tributáveis (ex.: **Tesouro Direto**, **CDB**, **RDB**, **LC**, **Fundos de Renda Fixa de Longo Prazo**), a alíquota de Imposto de Renda retido na fonte diminui conforme o prazo de permanência da aplicação:

| Faixa de Prazo em Dias | Equivalência em Meses (`days = m * 30`) | Alíquota de IR | Rótulo de Exibição |
| :--- | :--- | :---: | :--- |
| **Até 180 dias** | `<= 6 meses` (`1` a `6` meses) | **22,5%** | `Até 180 dias (até 6 meses)` |
| **De 181 a 360 dias** | `7 a 12 meses` | **20,0%** | `De 181 a 360 dias (7 a 12 meses)` |
| **De 361 a 720 dias** | `13 a 24 meses` | **17,5%** | `De 361 a 720 dias (13 a 24 meses)` |
| **Acima de 720 dias** | `> 24 meses` (`>= 25` meses) | **15,0%** | `Acima de 720 dias (acima de 24 meses)` |

### 2.2 Regime Isento de IR (`0%`)
Para aplicações com isenção de Imposto de Renda para Pessoa Física (**LCI**, **LCA**, **CRI**, **CRA**, **Debêntures Incentivadas** e **Poupança**):
- **Regime**: `"exempt"` (`Isento de IR`)
- **Alíquota aplicada**: **`0,0%`** para qualquer prazo $m \ge 0$.
- **Consequência matemática**: $\text{IR}_m = 0$, $\text{JurosLiquidos}_m = \text{JurosBrutos}_m$ e $\text{ValorLiquidoFinal}_m = \text{TotalBruto}_m$.

### 2.3 Regras de Incidência e Convenções
1. **Base de cálculo do IR:** O imposto incide **somente sobre o rendimento bruto acumulado** ($\text{JurosBrutos}_m$), jamais sobre o principal desembolsado ($\text{TotalInvestido}_m = P_0 + m \cdot PMT$).
2. **Conversão de meses para dias:** Como a simulação evolui em passos mensais inteiros $m \in [0, N]$, adota-se a convenção comercial padrão de $30$ dias por mês (`estimatedDays = m * 30`):
   - $m = 6 \implies 180\text{ dias} \implies 22,5\%$
   - $m = 7 \implies 210\text{ dias} \implies 20,0\%$
   - $m = 12 \implies 360\text{ dias} \implies 20,0\%$
   - $m = 13 \implies 390\text{ dias} \implies 17,5\%$
   - $m = 24 \implies 720\text{ dias} \implies 17,5\%$
   - $m = 25 \implies 750\text{ dias} \implies 15,0\%$
3. **Marco inicial ($m = 0$) e rendimento nulo:** Para $m = 0$ ou quando $\text{JurosBrutos}_m \le 0$, define-se $\text{IR}_m = 0$, $\text{JurosLiquidos}_m = 0$ e $\text{ValorLiquidoFinal}_m = \text{TotalBruto}_m$.
4. **Premissa de modelo simplificado:** A simulação aplica a alíquota correspondente ao prazo acumulado $m$ da carteira para estimar o resgate líquido naquele horizonte, oferecendo uma visão clara e determinística do impacto tributário sem depender de calendário de come-cotas ou IOF regressivo (< 30 dias).

---

## 3. Fórmulas Matemáticas de Valor Líquido

Partindo da evolução bruta definida em [`docs/specs/compound-interest.md`](./compound-interest.md):
- $\text{TotalBruto}_m = \text{Saldo}_m$
- $\text{TotalInvestido}_m = P_0 + m \cdot PMT$
- $\text{JurosBrutos}_m = \text{TotalBruto}_m - \text{TotalInvestido}_m$

Para cada período $m$ em meses (`days = m * 30`), definimos a alíquota aplicável $\text{Aliquota}_m = \text{getIrRate}(m)$ (ou `0` quando o regime for **Isento**):

$$\text{IR}_m = \text{roundCents}\!\left(\text{JurosBrutos}_m \times \frac{\text{Aliquota}_m}{100}\right)$$

$$\text{JurosLiquidos}_m = \text{roundCents}\!\left(\text{JurosBrutos}_m - \text{IR}_m\right)$$

$$\text{ValorLiquidoFinal}_m = \text{roundCents}\!\left(\text{TotalInvestido}_m + \text{JurosLiquidos}_m\right) = \text{roundCents}\!\left(\text{TotalBruto}_m - \text{IR}_m\right)$$

Onde $\text{roundCents}(x) = \frac{\text{Math.round}((x + \varepsilon) \times 100)}{100}$ garante consistência exata em centavos (`R$ #.##0,00`) e invariância da identidade contábil:

$$\text{TotalInvestido}_m + \text{JurosLiquidos}_m + \text{IR}_m = \text{TotalBruto}_m$$

### 3.1 Percentuais de Composição na Visão Líquida
No modo de visualização líquida, a composição do patrimônio líquido final (`netFinalAmount`) é calculada como:
- $\text{netInvestedPercentage} = \text{roundCents}\!\left(\frac{\text{TotalInvestido}_N}{\text{ValorLiquidoFinal}_N} \times 100\right)$ (ou `100` se $\text{ValorLiquidoFinal}_N \le 0$)
- $\text{netInterestPercentage} = \text{roundCents}\!\left(100 - \text{netInvestedPercentage}\right)$ (ou `0` se $\text{ValorLiquidoFinal}_N \le 0$)

---

## 4. Casos de Teste Padrão (Golden Tests)

Todos os valores abaixo foram validados centavo a centavo com a iteração composta mês a mês de `calculateCompoundInterest`:

| Cenário | Entradas ($P_0$, $PMT$, Taxa, Prazo) | Regime / Faixa IR | Total Investido | Total Bruto | Juros Brutos | IR Descontado (`R$`) | Juros Líquidos (`R$`) | Valor Líquido Final (`R$`) |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **GT-1 (6 meses)** | $P_0 = 10.000,00$, $PMT = 1.000,00$, `1,00% a.m.`, `6 meses` | Regressivo (`22,5%`) | `R$ 16.000,00` | `R$ 16.767,22` | `R$ 767,22` | `R$ 172,62` | `R$ 594,60` | **`R$ 16.594,60`** |
| **GT-2A (12 meses — taxa anual)** | $P_0 = 1.000,00$, $PMT = 500,00$, `12,00% a.a.`, `12 meses` | Regressivo (`20,0%`) | `R$ 7.000,00` | `R$ 7.443,25` | `R$ 443,25` | `R$ 88,65` | `R$ 354,60` | **`R$ 7.354,60`** |
| **GT-2B (12 meses — taxa mensal)** | $P_0 = 10.000,00$, $PMT = 1.000,00$, `1,00% a.m.`, `12 meses` | Regressivo (`20,0%`) | `R$ 22.000,00` | `R$ 23.950,75` | `R$ 1.950,75` | `R$ 390,15` | `R$ 1.560,60` | **`R$ 23.560,60`** |
| **GT-3 (24 meses)** | $P_0 = 10.000,00$, $PMT = 1.000,00$, `1,00% a.m.`, `24 meses` | Regressivo (`17,5%`) | `R$ 34.000,00` | `R$ 39.670,81` | `R$ 5.670,81` | `R$ 992,39` | `R$ 4.678,42` | **`R$ 38.678,42`** |
| **GT-4A (36 meses)** | $P_0 = 10.000,00$, $PMT = 1.000,00$, `1,00% a.m.`, `36 meses` | Regressivo (`15,0%`) | `R$ 46.000,00` | `R$ 57.384,57` | `R$ 11.384,57` | `R$ 1.707,69` | `R$ 9.676,88` | **`R$ 55.676,88`** |
| **GT-4B (10 anos / 120m — padrão)** | $P_0 = 1.000,00$, $PMT = 500,00$, `14,15% a.a.`, `10 anos` | Regressivo (`15,0%`) | `R$ 61.000,00` | `R$ 128.029,52` | `R$ 67.029,52` | `R$ 10.054,43` | `R$ 56.975,09` | **`R$ 117.975,09`** |
| **GT-5 (Isento — LCI/LCA)** | $P_0 = 1.000,00$, $PMT = 500,00$, `14,15% a.a.`, `10 anos` | Isento (`0,0%`) | `R$ 61.000,00` | `R$ 128.029,52` | `R$ 67.029,52` | `R$ 0,00` | `R$ 67.029,52` | **`R$ 128.029,52`** |

---

## 5. Contrato de Código TypeScript (`compound-interest-utils.ts`)

Extensão retrocompatível das interfaces e funções existentes em `src/features/calculators/compound-interest/compound-interest-utils.ts` (Zero `any`, `strict: true`):

```typescript
export type TaxRegime = "regressive" | "exempt";
export type ResultViewMode = "gross" | "net";

export interface IncomeTaxBracket {
  id: "up-to-180" | "181-to-360" | "361-to-720" | "over-720" | "exempt";
  minDays: number;
  maxDays: number | null;
  minMonths: number;
  maxMonths: number | null;
  ratePercent: number;
  label: string;
  shortLabel: string;
}

export interface EvolutionRow {
  month: number;
  year: number;
  periodInterest: number;
  totalInvested: number;
  totalInterest: number;
  totalAmount: number;
  // Campos líquidos / tributação (novos)
  irRatePercent: number;
  irAmount: number;
  netInterest: number;
  netAmount: number;
}

export interface CompoundInterestResult {
  // Campos brutos existentes preservados
  finalAmount: number;
  totalInvested: number;
  totalInterest: number;
  investedPercentage: number;
  interestPercentage: number;
  effectiveMonthlyRate: number;
  effectiveAnnualRate: number;
  totalMonths: number;
  monthlyEvolution: EvolutionRow[];
  yearlyEvolution: EvolutionRow[];
  // Campos de IR e valor líquido (novos)
  taxRegime: TaxRegime;
  irRatePercent: number;
  irBracketLabel: string;
  irAmount: number;
  netFinalAmount: number;
  netTotalInterest: number;
  netInvestedPercentage: number;
  netInterestPercentage: number;
}

export const INCOME_TAX_BRACKETS: readonly IncomeTaxBracket[];

export function getIncomeTaxBracket(
  totalMonths: number,
  taxRegime?: TaxRegime
): IncomeTaxBracket;

export function calculateCompoundInterest(
  input: CompoundInterestInput,
  taxRegime?: TaxRegime
): CompoundInterestResult;

export function generateEvolutionCsv(
  rows: EvolutionRow[],
  mode: "monthly" | "yearly",
  viewMode?: ResultViewMode
): string;
```

> **Compatibilidade:** O parâmetro `taxRegime` em `calculateCompoundInterest` assume `"regressive"` por padrão, e `viewMode` em `generateEvolutionCsv` assume `"gross"` por padrão, preservando 100% da compatibilidade com chamadas existentes.

---

## 6. Arquitetura de UI/UX (Desktop & Mobile Above-the-Fold)

### 6.1 Controles de Visão e Regime Tributário
Na interface de `/calculadora-juros-compostos` (`src/features/calculators/compound-interest/index.tsx`):
1. **Seletor de Visão (`ResultViewMode`)**:
   - Segmentos: **`Valor Bruto`** | **`Valor Líquido`** (`Valor Líquido (IR)`).
   - Alterna imediatamente o modo de exibição de todos os cards de resumo, gráficos, tabela de evolução, exportação CSV e resumo copiado.
2. **Seletor de Regime Tributário (`TaxRegime`)**:
   - Segmentos: **`Tabela IR (Renda Fixa)`** | **`Isento (LCI/LCA)`**.
   - Quando **`Isento (LCI/LCA)`** está ativo, a alíquota de IR é `0,0%` e o Valor Líquido iguala-se ao Valor Bruto.

### 6.2 Cards de Resumo Adaptativos (`#result`)
- **Card 1 — Valor Total Final (`#amount`)**:
  - Exibe `result.finalAmount` na visão bruta ou `result.netFinalAmount` na visão líquida.
  - Exibe multiplicador sobre o total investido e um indicador claro do desconto de IR (em `R$` e alíquota `%` aplicada, ex.: `-R$ 10.054,43 (IR 15,0%)` ou `Isento de IR`), além da referência complementar quando em visão bruta para facilitar a leitura rápida.
- **Card 2 — Total Investido (`#invested`)**:
  - Exibe `result.totalInvested` (inalterado pelo IR, pois o imposto incide apenas sobre o rendimento) e o percentual correspondente na visão ativa (`investedPercentage` ou `netInvestedPercentage`).
- **Card 3 — Total em Juros (`#interest`)**:
  - Exibe `result.totalInterest` (Bruto) ou `result.netTotalInterest` (Juros Líquidos após IR), com badge percentual atualizado e indicação do IR descontado sobre os rendimentos.

### 6.3 Gráficos (`#resultGraphic`)
- **Gráfico de Rosca (Donut)**: Reflete a proporção da visão ativa (`Valor Investido` vs `Juros Brutos` ou `Juros Líquidos`, podendo exibir a fatia/legenda de IR descontado).
- **Gráfico de Barras Empilhadas**: Atualiza a altura das barras, o painel de inspeção (`tooltip` interativo por período) e a legenda da escala conforme a visão ativa (`Bruto` vs `Líquido` e destaque do `IR`).

### 6.4 Tabela de Evolução (`#evolutionTable`) e Exportação
- **Visão Bruta**: Mantém as 5 colunas (`Meses/Anos`, `Juros`, `Total Investido`, `Total Juros`, `Acumulado`).
- **Visão Líquida**: Adiciona/exibe as colunas tributárias e líquidas de forma legível com scroll horizontal suave no mobile (`IR (%)`, `IR (R$)`, `Juros Líquidos`, `Acumulado Líquido`).
- **Exportação CSV (`generateEvolutionCsv`)**: Inclui colunas `Alíquota IR (%)`, `Imposto de Renda (R$)`, `Juros Líquidos (R$)` e `Total Líquido (R$)` quando exportado no modo líquido (ou resumo completo), mantendo separador `;` e BOM UTF-8 compatível com Excel/Google Sheets.
- **Copiar Resumo (`handleCopySummary`)**: Inclui `Regime Tributário`, `Alíquota de IR`, `IR Estimado` e `Valor Líquido Final`.

### 6.5 Card da Tabela Oficial de Alíquotas de IR (Renda Fixa)
- Card informativo posicionado na área de análise/guia educativo (abaixo dos gráficos/tabela para não impactar a dobra inicial), listando as **4 faixas regressivas da Lei nº 11.033/2004** (`22,5%`, `20,0%`, `17,5%`, `15,0%`) e os **investimentos isentos (`0%`)**.
- Destaca visualmente (badge + borda/fundo em destaque) a **faixa ativa** correspondente ao prazo simulado (ou o status `Isento` quando o regime isento estiver selecionado), exibindo o valor estimado de IR retido para a simulação atual.

### 6.6 Regras Obrigatórias Mobile-First (`375x667`) e Linguagem Limpa
Conforme [`docs/architecture/mobile-ux-guidelines.md`](../architecture/mobile-ux-guidelines.md):
1. **Above-the-Fold (`375x667`)**: Os novos controles (`Bruto | Líquido` e `Tabela IR | Isento`) devem ser compactos e posicionados sem empurrar o card principal de resultado (`#amount`) para fora da dobra inicial (`boundingBox.y + boundingBox.height <= 667` em `375x667`).
2. **Contenção Geométrica (`[data-slot="card"]`)**: Todo `Card` usa `min-w-0 overflow-hidden`; nenhum filho (`button`, `badge`, `tabs`, `span`, tabela) pode ultrapassar a borda do card ou causar scroll horizontal na página (`scrollWidth <= innerWidth`).
3. **Linguagem Limpa**: Zero menções a sites externos ou jargões de engenharia na UI (`"Investidor10"`, `"4Devs"`, `"Módulo 11"`, `"Motor"`, `"Client-side"`).

---

## 7. Plano de Execução e Quality Gates

### 7.1 Backlog e Rastreabilidade
- Registrado como **`TASK-003B`** em [`docs/plan/epics-and-tasks.md`](../plan/epics-and-tasks.md) (extensão do **Epic 1** para `/calculadora-juros-compostos`).
- Referenciado no índice mestre em [`docs/README.md`](../README.md).

### 7.2 Testes Unitários e de Componente (Vitest V8 `>= 90%`)
1. `src/features/calculators/compound-interest/compound-interest-utils.test.ts`:
   - Testar todas as 4 faixas da tabela regressiva (`<= 6m` $\to 22,5\%$, `7..12m` $\to 20,0\%$, `13..24m` $\to 17,5\%$, `> 24m` $\to 15,0\%$) e limites exatos (`0m`, `6m`, `7m`, `12m`, `13m`, `24m`, `25m`, `120m`).
   - Testar o regime `"exempt"` (`0%`, `irAmount === 0`, `netFinalAmount === finalAmount`).
   - Validar os Golden Tests (`GT-1` a `GT-5`) no centavo e a invariante `totalInvested + netInterest + irAmount === totalAmount`.
   - Testar `generateEvolutionCsv` nos modos `"gross"` e `"net"` (`"monthly"` e `"yearly"`).
2. `src/features/calculators/compound-interest/index.test.tsx`:
   - Alternância entre **`Valor Bruto`** e **`Valor Líquido`**, validando atualização de `#amount`, `#interest`, gráfico e tabela.
   - Alternância entre **`Tabela IR (Renda Fixa)`** e **`Isento (LCI/LCA)`**.
   - Destaque da faixa ativa na **Tabela Regressiva de IR** conforme mudança de prazo.
   - Conteúdo do resumo copiado (`handleCopySummary`) e exportação CSV.
3. Comando obrigatório de cobertura (`>= 90%` em lines, branches, functions e statements):
   ```bash
   npx vitest run src/features/calculators/compound-interest/ --coverage --coverage.include='src/features/calculators/compound-interest/**' --coverage.exclude='**/*.test.*'
   ```

### 7.3 Testes E2E (Playwright) e Snapshots Visuais
1. **`tests/e2e/functional-scenarios.spec.ts`**:
   - Alternar `Valor Bruto` $\leftrightarrow$ `Valor Líquido` em `/calculadora-juros-compostos`.
   - Simular `6 meses` (`22,5%`), `12 meses` (`20,0%`), `24 meses` (`17,5%`) e `10 anos` (`15,0%`), conferindo alíquota, `#amount`, `#interest` e faixa destacada na tabela de IR.
   - Alternar para `Isento (LCI/LCA)` e validar `0,0%` de IR (`Valor Líquido === Valor Bruto`).
   - Verificar colunas de IR / Valor Líquido na `#evolutionTable` em visão líquida.
2. **`tests/e2e/layout-and-snapshots.spec.ts`**:
   - Validar contenção geométrica dos cards, zero scroll horizontal e asserção **Above-the-Fold Mobile (`375x667`)** garantindo que `#amount` permaneça integralmente visível (`bottom <= 667`).
   - Atualizar e inspecionar visualmente via `read_file` os snapshots Desktop (`1440x900`) e Mobile (`375x667`) gerados com `npm run test:e2e:snapshots`.
3. **Validação de cobertura de rotas**: `npm run test:e2e:coverage`.

### 7.4 Gate de Pre-Commit (`.husky/pre-commit`)
Antes de qualquer commit final na branch principal, todos os checks abaixo devem passar sem erros ou avisos bloqueantes:
- `npm run lint` (`@typescript-eslint/no-explicit-any: "error"`)
- `npm run typecheck` (`tsc --noEmit` com `"strict": true`)
- `npm run test:coverage` (`>= 90%` V8)
- `npm run build && npm run test:e2e` (`check-e2e-coverage.mjs && playwright test`)
