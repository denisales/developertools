# Especificação Funcional e Algorítmica — Gerador e Validador de CPF

- **Referência Original**: `https://www.4devs.com.br/gerador_de_cpf` e `https://www.4devs.com.br/validador_cpf`
- **Rota no Projeto**: `/gerador-de-cpf` (com aba/modo integrado de Validação e rota `/validador-cpf` opcional compartilhando o mesmo módulo)
- **Módulo Isolado (Worktree Target)**: `src/features/generators/cpf/`
- **Prioridade**: **MVP — Epic 1 (Task P1)**

---

## 1. Visão Geral do Produto e Melhorias de UX (Mobile-First)

O Gerador e Validador de CPF permite a estudantes, engenheiros de software e QAs gerar CPFs matematicamente válidos para testes de sistemas ou validar números de CPF existentes.

Além de replicar 100% das opções do 4Devs (**Pontuação Sim/Não** e **Filtro por Estado de Origem — 27 UFs**), nossa implementação moderna com `shadcn/ui` adiciona:
1. **Geração Instantânea & Cópia em 1 Toque**: Ao abrir a página, um CPF válido já aparece pré-gerado no visor principal com botão grande de copiar (`Toast` de confirmação via `sonner`) e botão de regerar.
2. **Modo de Geração em Lote (Bulk Mode)**: Slider/Seletor para gerar de `1` a `100` CPFs simultaneamente, com ações de "Copiar Todos", "Baixar CSV", "Baixar JSON" ou "Baixar TXT".
3. **Validador Integrado em Tempo Real**: Aba ou card lateral/inferior onde o usuário digita ou cola um ou múltiplos CPFs e recebe feedback instantâneo (Válido/Inválido, Região Fiscal identificada pelo 9º dígito e motivo da invalidez).

---

## 2. Entradas (Inputs) e Controles de Interface

### 2.1 Aba / Card: Gerador de CPF
| Campo | Componente `shadcn/ui` | Valores / Opções | Valor Padrão | Comportamento |
| :--- | :--- | :--- | :--- | :--- |
| **Gerar com pontuação?** | `Switch` ou `RadioGroup` | `Sim` (`XXX.XXX.XXX-XX`) / `Não` (`XXXXXXXXXXX`) | `Sim` (`true`) | Alternar atualiza imediatamente a formatação do(s) CPF(s) já exibido(s) na tela sem precisar regerar |
| **Estado de Origem (UF)** | `Select` | `Indiferente (Aleatório)` + `AC, AL, AM, AP, BA, CE, DF, ES, GO, MA, MG, MS, MT, PA, PB, PE, PI, PR, RJ, RN, RO, RR, RS, SC, SE, SP, TO` | `Indiferente` | Define o 9º dígito do CPF conforme a tabela oficial de Regiões Fiscais da Receita Federal |
| **Quantidade** | `Select` ou `Input[type=number]` / Pills rápidos (`1`, `5`, `10`, `25`, `50`, `100`) | Inteiro de `1` a `100` | `1` | Se `1`, exibe visor de destaque grande; se `> 1`, exibe também lista com cópia individual e em lote |
| **Botão Gerar CPF** | `Button` (primário, ícone `RefreshCw`) | Clique ou atalho `Espaço`/`Enter` | — | Gera novo(s) CPF(s) instantaneamente no cliente |

### 2.2 Aba / Card: Validador de CPF
| Campo | Componente `shadcn/ui` | Valores / Opções | Comportamento |
| :--- | :--- | :--- | :--- |
| **Digite o CPF** | `Input` (com máscara opcional/flexível, `maxLength=14`, `inputMode="numeric"`) | Aceita `000.000.000-00` ou `00000000000` | Valida em tempo real ao atingir 11 dígitos numéricos ou ao clicar em **Validar CPF** |
| **Resultado da Validação** | `Alert` / `Badge` | `Válido` (verde) ou `Inválido` (vermelho) | Exibe o status, a Região Fiscal (estados correspondentes ao 9º dígito) e os dígitos verificadores calculados |

---

## 3. Regra de Negócio e Algoritmo Matemático (Módulo 11)

Um número de CPF possui **11 dígitos decimais**:
$$d_1 d_2 d_3 . d_4 d_5 d_6 . d_7 d_8 d_9 - dv_1 dv_2$$

### 3.1 Mapeamento do 9º Dígito ($d_9$) — Região Fiscal de Origem (UF)
A Receita Federal do Brasil define o **9º dígito** ($d_9$) de acordo com a Região Fiscal onde o CPF foi emitido:

| 9º Dígito ($d_9$) | Região Fiscal | Estados (UFs) Correspondentes |
| :---: | :---: | :--- |
| **1** | 1ª Região | `DF`, `GO`, `MS`, `MT`, `TO` |
| **2** | 2ª Região | `AC`, `AM`, `AP`, `PA`, `RO`, `RR` |
| **3** | 3ª Região | `CE`, `MA`, `PI` |
| **4** | 4ª Região | `AL`, `PB`, `PE`, `RN` |
| **5** | 5ª Região | `BA`, `SE` |
| **6** | 6ª Região | `MG` |
| **7** | 7ª Região | `ES`, `RJ` |
| **8** | 8ª Região | `SP` |
| **9** | 9ª Região | `PR`, `SC` |
| **0** | 10ª Região | `RS` |

- Se o usuário selecionar `Indiferente`, $d_9$ é sorteado uniformemente entre `0` e `9`.
- Se o usuário selecionar uma UF (ex.: `SP`), $d_9$ é fixado no dígito daquela UF (`8`).
- Os dígitos $d_1 \dots d_8$ são sorteados aleatoriamente entre `0` e `9`, garantindo que $d_1 \dots d_9$ **não sejam todos iguais** (ex.: `111.111.111` é proibido e rejeitado).

### 3.2 Cálculo do 1º Dígito Verificador ($dv_1$)
1. Multiplicam-se os 9 primeiros dígitos ($d_1$ a $d_9$) pelos pesos decrescentes de **10 a 2**:
   $$S_1 = \sum_{i=1}^{9} d_i \times (11 - i) = (d_1 \times 10) + (d_2 \times 9) + \dots + (d_9 \times 2)$$
2. Calcula-se o resto da divisão de $S_1$ por $11$:
   $$R_1 = S_1 \bmod 11$$
3. Se $R_1 < 2$, então $dv_1 = 0$. Caso contrário ($R_1 \ge 2$), $dv_1 = 11 - R_1$.
   *(Equivalentemente: $dv_1 = (S_1 \times 10) \bmod 11$, onde resultado $10 \implies 0$).*

### 3.3 Cálculo do 2º Dígito Verificador ($dv_2$)
1. Incluindo $dv_1$ como o 10º dígito, multiplicam-se os 10 dígitos pelos pesos decrescentes de **11 a 2**:
   $$S_2 = \sum_{i=1}^{9} d_i \times (12 - i) + (dv_1 \times 2) = (d_1 \times 11) + (d_2 \times 10) + \dots + (d_9 \times 3) + (dv_1 \times 2)$$
2. Calcula-se o resto da divisão de $S_2$ por $11$:
   $$R_2 = S_2 \bmod 11$$
3. Se $R_2 < 2$, então $dv_2 = 0$. Caso contrário ($R_2 \ge 2$), $dv_2 = 11 - R_2$.

### 3.4 Regras de Validação de CPF
Um CPF informado é considerado **válido** se e somente se:
1. Após remover caracteres não numéricos (`replace(/\D/g, '')`), possuir exatamente **11 dígitos**.
2. **Não** for uma sequência de 11 dígitos repetidos (`00000000000`, `11111111111`, ..., `99999999999`), pois embora passem na equação aritmética do Mod-11, são inválidos perante a Receita Federal.
3. Os dígitos verificadores calculados ($dv_1, dv_2$) sobre os 9 primeiros dígitos coincidirem exatamente com os dígitos nas posições 10 e 11 do input.

---

## 4. Contrato de Código TypeScript (`src/features/generators/cpf/`)

Estrutura sugerida para o módulo:
```text
src/features/generators/cpf/
├── cpf-utils.ts          # Funções puras: generateCpf, validateCpf, formatCpf, getCpfRegion
├── cpf-utils.test.ts     # Testes unitários cobrindo todas as UFs, sequências repetidas e Mod-11
├── cpf-generator.tsx     # Componente client-side principal (Gerador + Lote + Validador)
└── index.ts              # Barrel export
```

### Assinaturas Esperadas em `cpf-utils.ts`:
```typescript
export type BrazilianState =
  | 'AC' | 'AL' | 'AM' | 'AP' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO'
  | 'MA' | 'MG' | 'MS' | 'MT' | 'PA' | 'PB' | 'PE' | 'PI' | 'PR'
  | 'RJ' | 'RN' | 'RO' | 'RR' | 'RS' | 'SC' | 'SE' | 'SP' | 'TO';

export interface GenerateCpfOptions {
  formatted?: boolean;
  state?: BrazilianState | '';
}

export interface CpfValidationResult {
  isValid: boolean;
  cleanCpf: string;
  formattedCpf: string;
  regionDigit: number | null;
  states: BrazilianState[];
  reason?: 'INVALID_LENGTH' | 'REPEATED_DIGITS' | 'INVALID_CHECK_DIGITS';
}

export function generateCpf(options?: GenerateCpfOptions): string;
export function generateCpfBatch(count: number, options?: GenerateCpfOptions): string[];
export function validateCpf(input: string): CpfValidationResult;
export function formatCpf(cpf: string): string;
```

---

## 5. Critérios de Aceite (Checklist para `@verifier`)
- [ ] Gerar CPF com e sem pontuação funciona instantaneamente e alternar o switch re-formata o valor exibido.
- [ ] Selecionar qualquer uma das 27 UFs gera sempre um CPF cujo 9º dígito corresponde exatamente à Região Fiscal daquela UF.
- [ ] Todo CPF gerado passa em `validateCpf(cpf).isValid === true`.
- [ ] Sequências como `111.111.111-11` ou `000.000.000-00` são rejeitadas como `REPEATED_DIGITS` no validador.
- [ ] Layout 100% responsivo no celular (botões grandes, `inputMode="numeric"` no validador, cópia em 1 toque com feedback visual).
