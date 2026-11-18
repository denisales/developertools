export type BrazilianState =
  | "AC"
  | "AL"
  | "AM"
  | "AP"
  | "BA"
  | "CE"
  | "DF"
  | "ES"
  | "GO"
  | "MA"
  | "MG"
  | "MS"
  | "MT"
  | "PA"
  | "PB"
  | "PE"
  | "PI"
  | "PR"
  | "RJ"
  | "RN"
  | "RO"
  | "RR"
  | "RS"
  | "SC"
  | "SE"
  | "SP"
  | "TO";

export interface StateInfo {
  uf: BrazilianState;
  name: string;
  regionDigit: number;
  fiscalRegionName: string;
}

export interface FiscalRegionInfo {
  digit: number;
  name: string;
  states: BrazilianState[];
  description: string;
}

export const FISCAL_REGIONS: Record<number, FiscalRegionInfo> = {
  1: {
    digit: 1,
    name: "1ª Região Fiscal",
    states: ["DF", "GO", "MS", "MT", "TO"],
    description: "Distrito Federal, Goiás, Mato Grosso do Sul, Mato Grosso e Tocantins",
  },
  2: {
    digit: 2,
    name: "2ª Região Fiscal",
    states: ["AC", "AM", "AP", "PA", "RO", "RR"],
    description: "Acre, Amazonas, Amapá, Pará, Rondônia e Roraima",
  },
  3: {
    digit: 3,
    name: "3ª Região Fiscal",
    states: ["CE", "MA", "PI"],
    description: "Ceará, Maranhão e Piauí",
  },
  4: {
    digit: 4,
    name: "4ª Região Fiscal",
    states: ["AL", "PB", "PE", "RN"],
    description: "Alagoas, Paraíba, Pernambuco e Rio Grande do Norte",
  },
  5: {
    digit: 5,
    name: "5ª Região Fiscal",
    states: ["BA", "SE"],
    description: "Bahia e Sergipe",
  },
  6: {
    digit: 6,
    name: "6ª Região Fiscal",
    states: ["MG"],
    description: "Minas Gerais",
  },
  7: {
    digit: 7,
    name: "7ª Região Fiscal",
    states: ["ES", "RJ"],
    description: "Espírito Santo e Rio de Janeiro",
  },
  8: {
    digit: 8,
    name: "8ª Região Fiscal",
    states: ["SP"],
    description: "São Paulo",
  },
  9: {
    digit: 9,
    name: "9ª Região Fiscal",
    states: ["PR", "SC"],
    description: "Paraná e Santa Catarina",
  },
  0: {
    digit: 0,
    name: "10ª Região Fiscal",
    states: ["RS"],
    description: "Rio Grande do Sul",
  },
};

export const BRAZILIAN_STATES: StateInfo[] = [
  { uf: "AC", name: "Acre", regionDigit: 2, fiscalRegionName: "2ª Região Fiscal" },
  { uf: "AL", name: "Alagoas", regionDigit: 4, fiscalRegionName: "4ª Região Fiscal" },
  { uf: "AP", name: "Amapá", regionDigit: 2, fiscalRegionName: "2ª Região Fiscal" },
  { uf: "AM", name: "Amazonas", regionDigit: 2, fiscalRegionName: "2ª Região Fiscal" },
  { uf: "BA", name: "Bahia", regionDigit: 5, fiscalRegionName: "5ª Região Fiscal" },
  { uf: "CE", name: "Ceará", regionDigit: 3, fiscalRegionName: "3ª Região Fiscal" },
  { uf: "DF", name: "Distrito Federal", regionDigit: 1, fiscalRegionName: "1ª Região Fiscal" },
  { uf: "ES", name: "Espírito Santo", regionDigit: 7, fiscalRegionName: "7ª Região Fiscal" },
  { uf: "GO", name: "Goiás", regionDigit: 1, fiscalRegionName: "1ª Região Fiscal" },
  { uf: "MA", name: "Maranhão", regionDigit: 3, fiscalRegionName: "3ª Região Fiscal" },
  { uf: "MT", name: "Mato Grosso", regionDigit: 1, fiscalRegionName: "1ª Região Fiscal" },
  { uf: "MS", name: "Mato Grosso do Sul", regionDigit: 1, fiscalRegionName: "1ª Região Fiscal" },
  { uf: "MG", name: "Minas Gerais", regionDigit: 6, fiscalRegionName: "6ª Região Fiscal" },
  { uf: "PA", name: "Pará", regionDigit: 2, fiscalRegionName: "2ª Região Fiscal" },
  { uf: "PB", name: "Paraíba", regionDigit: 4, fiscalRegionName: "4ª Região Fiscal" },
  { uf: "PR", name: "Paraná", regionDigit: 9, fiscalRegionName: "9ª Região Fiscal" },
  { uf: "PE", name: "Pernambuco", regionDigit: 4, fiscalRegionName: "4ª Região Fiscal" },
  { uf: "PI", name: "Piauí", regionDigit: 3, fiscalRegionName: "3ª Região Fiscal" },
  { uf: "RJ", name: "Rio de Janeiro", regionDigit: 7, fiscalRegionName: "7ª Região Fiscal" },
  { uf: "RN", name: "Rio Grande do Norte", regionDigit: 4, fiscalRegionName: "4ª Região Fiscal" },
  { uf: "RS", name: "Rio Grande do Sul", regionDigit: 0, fiscalRegionName: "10ª Região Fiscal" },
  { uf: "RO", name: "Rondônia", regionDigit: 2, fiscalRegionName: "2ª Região Fiscal" },
  { uf: "RR", name: "Roraima", regionDigit: 2, fiscalRegionName: "2ª Região Fiscal" },
  { uf: "SC", name: "Santa Catarina", regionDigit: 9, fiscalRegionName: "9ª Região Fiscal" },
  { uf: "SP", name: "São Paulo", regionDigit: 8, fiscalRegionName: "8ª Região Fiscal" },
  { uf: "SE", name: "Sergipe", regionDigit: 5, fiscalRegionName: "5ª Região Fiscal" },
  { uf: "TO", name: "Tocantins", regionDigit: 1, fiscalRegionName: "1ª Região Fiscal" },
];

export const STATE_TO_DIGIT: Record<BrazilianState, number> = BRAZILIAN_STATES.reduce(
  (acc, item) => {
    acc[item.uf] = item.regionDigit;
    return acc;
  },
  {} as Record<BrazilianState, number>
);

export interface GenerateCpfOptions {
  formatted?: boolean;
  state?: BrazilianState | "";
}

export interface CpfCheckDigitStep {
  weights: number[];
  products: number[];
  sum: number;
  remainder: number;
  expectedDigit: number;
  providedDigit: number;
  matches: boolean;
}

export interface CpfValidationResult {
  isValid: boolean;
  cleanCpf: string;
  formattedCpf: string;
  regionDigit: number | null;
  fiscalRegionName: string | null;
  states: BrazilianState[];
  reason?: "INVALID_LENGTH" | "REPEATED_DIGITS" | "INVALID_CHECK_DIGITS";
  reasonMessage?: string;
  firstDigitStep?: CpfCheckDigitStep;
  secondDigitStep?: CpfCheckDigitStep;
}

/**
 * Remove todos os caracteres não numéricos de uma string.
 */
export function stripCpfDigits(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Formata uma string contendo 11 dígitos de CPF para o padrão XXX.XXX.XXX-XX.
 * Também aplica máscara parcial enquanto o usuário digita.
 */
export function formatCpf(cpf: string): string {
  const digits = stripCpfDigits(cpf).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Calcula um dígito verificador pelo algoritmo Módulo 11 do CPF.
 */
export function calculateMod11Digit(digits: number[], startWeight: number): {
  weights: number[];
  products: number[];
  sum: number;
  remainder: number;
  digit: number;
} {
  const weights = digits.map((_, idx) => startWeight - idx);
  const products = digits.map((d, idx) => d * weights[idx]);
  const sum = products.reduce((acc, val) => acc + val, 0);
  const remainder = sum % 11;
  const digit = remainder < 2 ? 0 : 11 - remainder;

  return {
    weights,
    products,
    sum,
    remainder,
    digit,
  };
}

/**
 * Retorna informações da Região Fiscal a partir do 9º dígito (0 a 9).
 */
export function getCpfRegion(regionDigit: number): FiscalRegionInfo | null {
  return FISCAL_REGIONS[regionDigit] ?? null;
}

/**
 * Gera um número de CPF matematicamente válido pelo Módulo 11.
 */
export function generateCpf(options?: GenerateCpfOptions): string {
  const formatted = options?.formatted ?? true;
  const state = options?.state ?? "";

  const d9 =
    state && state in STATE_TO_DIGIT
      ? STATE_TO_DIGIT[state as BrazilianState]
      : Math.floor(Math.random() * 10);

  const baseDigits: number[] = [];
  do {
    baseDigits.length = 0;
    for (let i = 0; i < 8; i++) {
      baseDigits.push(Math.floor(Math.random() * 10));
    }
    baseDigits.push(d9);
  } while (baseDigits.every((d) => d === baseDigits[0]));

  const { digit: dv1 } = calculateMod11Digit(baseDigits, 10);
  const { digit: dv2 } = calculateMod11Digit([...baseDigits, dv1], 11);

  const rawCpf = [...baseDigits, dv1, dv2].join("");
  return formatted ? formatCpf(rawCpf) : rawCpf;
}

/**
 * Gera um lote (batch) de CPFs únicos e válidos (entre 1 e 100).
 */
export function generateCpfBatch(
  count: number,
  options?: GenerateCpfOptions
): string[] {
  const safeCount = Math.max(1, Math.min(100, Math.floor(count || 1)));
  const results = new Set<string>();

  while (results.size < safeCount) {
    results.add(generateCpf(options));
  }

  return Array.from(results);
}

/**
 * Valida um CPF passo a passo pelo Módulo 11, identificando a Região Fiscal e estados de origem.
 */
export function validateCpf(input: string): CpfValidationResult {
  const cleanCpf = stripCpfDigits(input);

  if (cleanCpf.length !== 11) {
    return {
      isValid: false,
      cleanCpf,
      formattedCpf: formatCpf(cleanCpf),
      regionDigit: null,
      fiscalRegionName: null,
      states: [],
      reason: "INVALID_LENGTH",
      reasonMessage: `O CPF deve conter exatamente 11 dígitos numéricos (informado: ${cleanCpf.length}).`,
    };
  }

  const digits = cleanCpf.split("").map(Number);
  const regionDigit = digits[8];
  const regionInfo = getCpfRegion(regionDigit);

  // Verifica se todos os 11 dígitos são repetidos (ex: 111.111.111-11)
  if (digits.every((d) => d === digits[0])) {
    return {
      isValid: false,
      cleanCpf,
      formattedCpf: formatCpf(cleanCpf),
      regionDigit,
      fiscalRegionName: regionInfo?.name ?? null,
      states: regionInfo?.states ?? [],
      reason: "REPEATED_DIGITS",
      reasonMessage:
        "Sequências de 11 dígitos repetidos são bloqueadas pela Receita Federal, embora passem na equação aritmética.",
    };
  }

  const step1 = calculateMod11Digit(digits.slice(0, 9), 10);
  const step2 = calculateMod11Digit([...digits.slice(0, 9), step1.digit], 11);

  const firstDigitStep: CpfCheckDigitStep = {
    weights: step1.weights,
    products: step1.products,
    sum: step1.sum,
    remainder: step1.remainder,
    expectedDigit: step1.digit,
    providedDigit: digits[9],
    matches: step1.digit === digits[9],
  };

  const secondDigitStep: CpfCheckDigitStep = {
    weights: step2.weights,
    products: step2.products,
    sum: step2.sum,
    remainder: step2.remainder,
    expectedDigit: step2.digit,
    providedDigit: digits[10],
    matches: step2.digit === digits[10],
  };

  if (!firstDigitStep.matches || !secondDigitStep.matches) {
    return {
      isValid: false,
      cleanCpf,
      formattedCpf: formatCpf(cleanCpf),
      regionDigit,
      fiscalRegionName: regionInfo?.name ?? null,
      states: regionInfo?.states ?? [],
      reason: "INVALID_CHECK_DIGITS",
      reasonMessage: `Dígitos verificadores inválidos: esperado final -${step1.digit}${step2.digit}, mas foi informado -${digits[9]}${digits[10]}.`,
      firstDigitStep,
      secondDigitStep,
    };
  }

  return {
    isValid: true,
    cleanCpf,
    formattedCpf: formatCpf(cleanCpf),
    regionDigit,
    fiscalRegionName: regionInfo?.name ?? null,
    states: regionInfo?.states ?? [],
    firstDigitStep,
    secondDigitStep,
  };
}
