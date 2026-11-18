# Especificação Funcional e Algorítmica — Gerador e Validador de CNPJ

- **Referência Original**: `https://www.4devs.com.br/gerador_de_cnpj` e `https://www.4devs.com.br/validador_cnpj`
- **Rota no Projeto**: `/gerador-de-cnpj` (com aba/modo integrado de Validação e rota `/validador-cnpj` opcional compartilhando o mesmo módulo)
- **Módulo Isolado (Worktree Target)**: `src/features/generators/cnpj/`
- **Prioridade**: **MVP — Epic 1 (Task P2)**

---

## 1. Visão Geral do Produto e Diferenciais (IN RFB nº 2.229/2024)

O Gerador e Validador de CNPJ gera inscrições válidas no Cadastro Nacional da Pessoa Jurídica para testes de software, homologação de ERPs, emissões fiscais (NF-e/NFS-e) e cadastros B2B.

Seguindo a atualização recente do próprio **4Devs**, nossa ferramenta suporta **ambos os padrões oficiais da Receita Federal**:
1. **Formato Numérico Clássico (Atual)**: 14 dígitos numéricos (`XX.XXX.XXX/0001-XX`).
2. **Formato Alfanumérico (IN RFB nº 2.229/2024 — vigência julho/2026)**: As 12 primeiras posições (8 da raiz + 4 da ordem do estabelecimento) aceitam caracteres alfanuméricos maiúsculos (`0-9` e `A-Z`, excluindo letras interditadas ou conforme tabela ASCII `- 48`), mantendo os 2 dígitos verificadores puramente numéricos (`0-9`) calculados por Módulo 11.
3. **Configuração de Matriz (`0001`) ou Filial Customizada (`0002`..`9999`)**, geração em lote (`1` a `100` CNPJs) com exportação (`.csv`, `.json`, `.txt`) e **Validador Integrado** em tempo real.

---

## 2. Entradas (Inputs) e Controles de Interface

### 2.1 Aba / Card: Gerador de CNPJ
| Campo | Componente `shadcn/ui` | Valores / Opções | Valor Padrão | Comportamento |
| :--- | :--- | :--- | :--- | :--- |
| **Gerar com pontuação?** | `Switch` ou `RadioGroup` | `Sim` (`XX.XXX.XXX/XXXX-XX`) / `Não` (`XXXXXXXXXXXXXX`) | `Sim` (`true`) | Alternar formata ou remove pontos, barra e hífen instantaneamente dos CNPJs já gerados |
| **Formato do CNPJ** | `Tabs` ou `RadioGroup` | `Numérico (Atual)` / `Alfanumérico (IN RFB 2.229/2024)` | `Numérico (Atual)` | Define se a raiz e a ordem usam apenas `0-9` ou combinação alfanumérica `[0-9A-Z]` |
| **Tipo de Estabelecimento** | `Select` ou `Input` | `Matriz (0001)` (padrão) / `Filial Aleatória (0002-0099)` / `Customizado` | `Matriz (0001)` | No 4Devs o padrão fixo é `0001`; oferecemos `0001` por padrão com opção de filial |
| **Quantidade em Lote** | `Select` / Pills (`1`, `5`, `10`, `25`, `50`, `100`) | Inteiro de `1` a `100` | `1` | Gera único em destaque ou lista com cópia e download em lote |
| **Botão Gerar CNPJ** | `Button` (primário, ícone `RefreshCw`) | Clique | — | Gera novo(s) CNPJ(s) instantaneamente |

### 2.2 Aba / Card: Validador de CNPJ
| Campo | Componente `shadcn/ui` | Valores / Opções | Comportamento |
| :--- | :--- | :--- | :--- |
| **Digite o CNPJ** | `Input` (`maxLength=18`) | Aceita máscara `XX.XXX.XXX/XXXX-XX` ou 14 caracteres limpos (numéricos ou alfanuméricos) | Valida em tempo real ou ao clicar em **Validar CNPJ** |
| **Resultado da Validação** | `Alert` / `Badge` | `Válido` (verde) ou `Inválido` (vermelho) | Exibe se é Válido/Inválido, se é **Numérico** ou **Alfanumérico**, se é **Matriz (`0001`)** ou **Filial**, e os DVs esperados |

---

## 3. Regra de Negócio e Algoritmo Matemático (Módulo 11 — Numérico e Alfanumérico)

Um CNPJ possui **14 posições**:
$$c_1 c_2 . c_3 c_4 c_5 . c_6 c_7 c_8 / c_9 c_{10} c_{11} c_{12} - dv_1 dv_2$$

- **Posições 1 a 8 ($c_1 \dots c_8$)**: Raiz / Inscrição base da empresa.
- **Posições 9 a 12 ($c_9 \dots c_{12}$)**: Ordem do estabelecimento (`0001` para Matriz, `0002` em diante para Filiais).
- **Posições 13 e 14 ($dv_1, dv_2$)**: Dígitos Verificadores (sempre numéricos de `0` a `9`).

### 3.1 Conversão de Caractere para Valor Numérico (Regra unificada Receita Federal)
Para suportar tanto o CNPJ Numérico quanto o CNPJ Alfanumérico (Nota Técnica Conjunta COCAD/SUARA / IN RFB 2.229/2024):
- Cada caractere $c_i$ (nas posições $1 \dots 12$) é convertido para seu valor de cálculo subtraindo **48** do seu código ASCII (`charCodeAt(0) - 48`):
  - Dígitos `'0'` (ASCII 48) a `'9'` (ASCII 57) $\implies$ valores **`0` a `9`**.
  - Letras `'A'` (ASCII 65) a `'Z'` (ASCII 90) $\implies$ valores **`17` a `42`**.
- **Nota**: Para dígitos puramente numéricos (`0-9`), `charCodeAt(0) - 48` produz exatamente o próprio dígito inteiro (`0-9`), tornando a fórmula 100% retrocompatível!

### 3.2 Cálculo do 1º Dígito Verificador ($dv_1$)
1. Multiplicam-se os 12 primeiros valores ($v_1 \dots v_{12}$) pelos pesos cíclicos de **2 a 9** (da direita para a esquerda), ou seja, da esquerda para a direita:
   $$\text{Pesos}_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]$$
2. Calcula-se o somatório ponderado:
   $$S_1 = \sum_{i=1}^{12} v_i \times \text{Pesos}_1[i]$$
3. Calcula-se o resto da divisão de $S_1$ por $11$:
   $$R_1 = S_1 \bmod 11$$
4. Define-se $dv_1$:
   $$dv_1 = \begin{cases} 0, & \text{se } R_1 < 2 \text{ (isto é, } R_1 = 0 \text{ ou } R_1 = 1\text{)} \\ 11 - R_1, & \text{se } R_1 \ge 2 \end{cases}$$

### 3.3 Cálculo do 2º Dígito Verificador ($dv_2$)
1. Incluindo $dv_1$ na 13ª posição ($v_{13} = dv_1$), multiplicam-se os 13 valores pelos pesos:
   $$\text{Pesos}_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]$$
2. Calcula-se o somatório ponderado:
   $$S_2 = \sum_{i=1}^{12} v_i \times \text{Pesos}_2[i] + (dv_1 \times 2)$$
3. Calcula-se o resto da divisão de $S_2$ por $11$:
   $$R_2 = S_2 \bmod 11$$
4. Define-se $dv_2$:
   $$dv_2 = \begin{cases} 0, & \text{se } R_2 < 2 \\ 11 - R_2, & \text{se } R_2 \ge 2 \end{cases}$$

### 3.4 Regras de Validação de CNPJ
Um CNPJ é considerado **válido** se e somente se:
1. Após remover os separadores de máscara (`.`, `/`, `-`, espaços) e converter para maiúsculas, possuir exatamente **14 caracteres**.
2. Os 12 primeiros caracteres pertencerem ao conjunto `[0-9A-Z]` e os 2 últimos pertencerem estritamente a `[0-9]`.
3. **Não** for uma sequência de caracteres idênticos (ex.: `00000000000000`, `11111111111111`, ..., `99999999999999`) nem tiver raiz/ordem zerada (`00000000000000`).
4. Os dígitos verificadores calculados ($dv_1, dv_2$) coincidirem exatamente com os dígitos nas posições 13 e 14.

---

## 4. Contrato de Código TypeScript (`src/features/generators/cnpj/`)

Estrutura sugerida para o módulo:
```text
src/features/generators/cnpj/
├── cnpj-utils.ts          # Funções puras: generateCnpj, validateCnpj, formatCnpj
├── cnpj-utils.test.ts     # Testes unitários (numérico, alfanumérico IN 2229/2024, matriz/filial, inválidos)
├── cnpj-generator.tsx     # Componente client-side principal (Gerador + Lote + Validador)
└── index.ts               # Barrel export
```

### Assinaturas Esperadas em `cnpj-utils.ts`:
```typescript
export type CnpjFormatMode = 'numeric' | 'alphanumeric';

export interface GenerateCnpjOptions {
  formatted?: boolean;
  mode?: CnpjFormatMode;
  branch?: string; // default '0001'
}

export interface CnpjValidationResult {
  isValid: boolean;
  cleanCnpj: string;
  formattedCnpj: string;
  mode: CnpjFormatMode;
  isHeadquarters: boolean; // true se ordem === '0001'
  branchCode: string;
  reason?: 'INVALID_LENGTH' | 'INVALID_CHARS' | 'REPEATED_DIGITS' | 'INVALID_CHECK_DIGITS';
}

export function generateCnpj(options?: GenerateCnpjOptions): string;
export function generateCnpjBatch(count: number, options?: GenerateCnpjOptions): string[];
export function validateCnpj(input: string): CnpjValidationResult;
export function formatCnpj(cnpj: string): string;
```

---

## 5. Critérios de Aceite (Checklist para `@verifier`)
- [ ] Gerar CNPJ no modo **Numérico** produz 14 dígitos (`XX.XXX.XXX/0001-XX`) válidos segundo o Módulo 11 clássico.
- [ ] Gerar CNPJ no modo **Alfanumérico (IN RFB 2.229/2024)** produz raiz alfanumérica + DVs numéricos calculados via `ASCII - 48`.
- [ ] Alternar o switch de pontuação formata/desformata instantaneamente os CNPJs na tela.
- [ ] O validador reconhece e valida corretamente tanto CNPJs numéricos quanto alfanuméricos e rejeita sequências repetidas (`00.000.000/0000-00`, `11.111.111/1111-11`).
- [ ] Interface responsiva e amigável para uso em telas móveis.
