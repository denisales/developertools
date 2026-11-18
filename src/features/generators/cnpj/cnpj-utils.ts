export type CnpjFormatMode = "numeric" | "alphanumeric";

export type CnpjBranchPreset = "headquarters" | "random_branch" | "custom";

export interface GenerateCnpjOptions {
  /** Whether to include punctuation XX.XXX.XXX/XXXX-XX (default: true) */
  formatted?: boolean;
  /** 'numeric' (classic 0-9) or 'alphanumeric' (IN RFB nº 2.229/2024 0-9A-Z) */
  mode?: CnpjFormatMode;
  /** 4-character branch/order code (default: '0001' for Matriz) */
  branch?: string;
}

export interface CnpjStepItem {
  position: number;
  char: string;
  asciiCode: number;
  calcValue: number; // charCodeAt(0) - 48
  weight: number;
  product: number;
}

export interface CnpjCalculationSteps {
  dv1Steps: CnpjStepItem[];
  sum1: number;
  remainder1: number;
  expectedDv1: number;
  dv2Steps: CnpjStepItem[];
  sum2: number;
  remainder2: number;
  expectedDv2: number;
}

export type CnpjInvalidReason =
  | "INVALID_LENGTH"
  | "INVALID_CHARS"
  | "REPEATED_DIGITS"
  | "INVALID_CHECK_DIGITS";

export interface CnpjValidationResult {
  isValid: boolean;
  cleanCnpj: string;
  formattedCnpj: string;
  mode: CnpjFormatMode;
  isHeadquarters: boolean;
  rootCode: string;
  branchCode: string;
  providedCheckDigits: string;
  expectedCheckDigits: string;
  reason?: CnpjInvalidReason;
  reasonMessage?: string;
  steps?: CnpjCalculationSteps;
}

/**
 * Weights for the 1st and 2nd check digits of CNPJ
 */
export const CNPJ_WEIGHTS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
export const CNPJ_WEIGHTS_DV2 = [
  6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
] as const;

const NUMERIC_CHARS = "0123456789";
/**
 * Alphanumeric CNPJ uses digits 0-9 and uppercase letters.
 * We exclude visually ambiguous or reserved letters (I, O, U, Q, F) during
 * random generation while accepting any [0-9A-Z] in the validator.
 */
const ALPHANUMERIC_GEN_CHARS = "0123456789ABCDEGHJKLMNPRSTVWXYZ";

/**
 * Removes mask characters (., /, -, whitespace) and uppercases the string.
 */
export function cleanCnpj(input: string): string {
  return input.replace(/[./-\s]/g, "").toUpperCase();
}

/**
 * Alias to strip formatting from a CNPJ string.
 */
export function unformatCnpj(cnpj: string): string {
  return cleanCnpj(cnpj);
}

/**
 * Formats a 14-character CNPJ string into XX.XXX.XXX/XXXX-XX.
 * Also supports progressive masking while typing in an input.
 */
export function formatCnpj(cnpj: string): string {
  const cleaned = cleanCnpj(cnpj).slice(0, 14);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
  if (cleaned.length <= 8) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
  }
  if (cleaned.length <= 12) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
  }
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
}

/**
 * Converts a single character [0-9A-Z] to its numerical value according to
 * IN RFB nº 2.229/2024: ASCII code minus 48.
 * - '0'..'9' (48..57) => 0..9
 * - 'A'..'Z' (65..90) => 17..42
 */
export function charToCnpjValue(char: string): number {
  if (!char) return 0;
  return char.toUpperCase().charCodeAt(0) - 48;
}

/**
 * Computes DV1, DV2, and the full step-by-step breakdown for a 12-character base CNPJ.
 */
export function calculateCnpjCheckDigits(base12: string): {
  dv1: number;
  dv2: number;
  steps: CnpjCalculationSteps;
} {
  const normalized = cleanCnpj(base12).slice(0, 12);
  if (normalized.length !== 12) {
    throw new Error("A base do CNPJ deve conter exatamente 12 caracteres.");
  }

  const dv1Steps: CnpjStepItem[] = [];
  let sum1 = 0;

  for (let i = 0; i < 12; i++) {
    const char = normalized[i];
    const asciiCode = char.charCodeAt(0);
    const calcValue = asciiCode - 48;
    const weight = CNPJ_WEIGHTS_DV1[i];
    const product = calcValue * weight;
    sum1 += product;
    dv1Steps.push({
      position: i + 1,
      char,
      asciiCode,
      calcValue,
      weight,
      product,
    });
  }

  const remainder1 = sum1 % 11;
  const expectedDv1 = remainder1 < 2 ? 0 : 11 - remainder1;

  const base13 = `${normalized}${expectedDv1}`;
  const dv2Steps: CnpjStepItem[] = [];
  let sum2 = 0;

  for (let i = 0; i < 13; i++) {
    const char = base13[i];
    const asciiCode = char.charCodeAt(0);
    const calcValue = asciiCode - 48;
    const weight = CNPJ_WEIGHTS_DV2[i];
    const product = calcValue * weight;
    sum2 += product;
    dv2Steps.push({
      position: i + 1,
      char,
      asciiCode,
      calcValue,
      weight,
      product,
    });
  }

  const remainder2 = sum2 % 11;
  const expectedDv2 = remainder2 < 2 ? 0 : 11 - remainder2;

  return {
    dv1: expectedDv1,
    dv2: expectedDv2,
    steps: {
      dv1Steps,
      sum1,
      remainder1,
      expectedDv1,
      dv2Steps,
      sum2,
      remainder2,
      expectedDv2,
    },
  };
}

function randomCharFrom(charset: string): string {
  const idx = Math.floor(Math.random() * charset.length);
  return charset[idx];
}

function normalizeBranchCode(
  branch: string | undefined,
  mode: CnpjFormatMode
): string {
  if (!branch) return "0001";
  const cleaned = cleanCnpj(branch)
    .replace(mode === "numeric" ? /[^0-9]/g : /[^0-9A-Z]/g, "")
    .slice(0, 4);

  if (!cleaned) return "0001";
  const padded = cleaned.padStart(4, "0");
  return padded === "0000" ? "0001" : padded;
}

/**
 * Generates a single valid CNPJ (Numeric or Alphanumeric IN RFB nº 2.229/2024).
 */
export function generateCnpj(options: GenerateCnpjOptions = {}): string {
  const { formatted = true, mode = "numeric", branch = "0001" } = options;

  const branchCode = normalizeBranchCode(branch, mode);
  let root = "";

  if (mode === "numeric") {
    for (let i = 0; i < 8; i++) {
      root += randomCharFrom(NUMERIC_CHARS);
    }
    // Avoid all-zeros or repeated sequence in root
    if (/^(\d)\1{7}$/.test(root)) {
      root = `1234567${randomCharFrom("012345689")}`;
    }
  } else {
    // Alphanumeric mode: ensure at least 2 letters appear in the 8-char root so
    // generated examples clearly showcase IN RFB 2.229/2024 alphanumeric support.
    const chars: string[] = [];
    for (let i = 0; i < 8; i++) {
      chars.push(randomCharFrom(ALPHANUMERIC_GEN_CHARS));
    }
    const hasLetter = chars.some((c) => /[A-Z]/.test(c));
    if (!hasLetter) {
      const lettersOnly = "ABCDEGHJKLMNPRSTVWXYZ";
      const pos1 = Math.floor(Math.random() * 4);
      const pos2 = 4 + Math.floor(Math.random() * 4);
      chars[pos1] = randomCharFrom(lettersOnly);
      chars[pos2] = randomCharFrom(lettersOnly);
    }
    root = chars.join("");
  }

  const base12 = `${root}${branchCode}`;
  const { dv1, dv2 } = calculateCnpjCheckDigits(base12);
  const fullCnpj = `${base12}${dv1}${dv2}`;

  return formatted ? formatCnpj(fullCnpj) : fullCnpj;
}

/**
 * Generates a batch of unique valid CNPJs (between 1 and 100).
 */
export function generateCnpjBatch(
  count: number,
  options: GenerateCnpjOptions = {}
): string[] {
  const safeCount = Math.max(1, Math.min(100, Math.floor(count || 1)));
  const results = new Set<string>();

  let attempts = 0;
  const maxAttempts = safeCount * 5;
  while (results.size < safeCount && attempts < maxAttempts) {
    results.add(generateCnpj(options));
    attempts++;
  }

  return Array.from(results);
}

/**
 * Validates any CNPJ string (formatted or unformatted, numeric or alphanumeric)
 * and returns a full diagnostic result including step-by-step DV1 and DV2 math.
 */
export function validateCnpj(input: string): CnpjValidationResult {
  const cleaned = cleanCnpj(input);
  const hasAlpha = /[A-Z]/.test(cleaned.slice(0, 12));
  const mode: CnpjFormatMode = hasAlpha ? "alphanumeric" : "numeric";
  const rootCode = cleaned.slice(0, 8);
  const branchCode = cleaned.slice(8, 12);
  const providedCheckDigits = cleaned.slice(12, 14);
  const isHeadquarters = branchCode === "0001";

  if (cleaned.length !== 14) {
    return {
      isValid: false,
      cleanCnpj: cleaned,
      formattedCnpj: formatCnpj(cleaned),
      mode,
      isHeadquarters,
      rootCode,
      branchCode,
      providedCheckDigits,
      expectedCheckDigits: "",
      reason: "INVALID_LENGTH",
      reasonMessage: `O CNPJ deve conter exatamente 14 caracteres (informado: ${cleaned.length}).`,
    };
  }

  // First 12 chars must be [0-9A-Z] and last 2 chars must be strictly numeric [0-9]
  const base12 = cleaned.slice(0, 12);
  if (!/^[0-9A-Z]{12}$/.test(base12) || !/^[0-9]{2}$/.test(providedCheckDigits)) {
    return {
      isValid: false,
      cleanCnpj: cleaned,
      formattedCnpj: formatCnpj(cleaned),
      mode,
      isHeadquarters,
      rootCode,
      branchCode,
      providedCheckDigits,
      expectedCheckDigits: "",
      reason: "INVALID_CHARS",
      reasonMessage:
        "As 12 primeiras posições aceitam números e letras (0-9, A-Z) e os 2 dígitos verificadores devem ser numéricos (0-9).",
    };
  }

  // Reject repeated single-char sequences (e.g. 00000000000000, 11111111111111) or zeroed root/branch
  if (
    /^([0-9A-Z])\1{13}$/.test(cleaned) ||
    /^([0-9A-Z])\1{11}$/.test(base12) ||
    rootCode === "00000000" ||
    branchCode === "0000"
  ) {
    return {
      isValid: false,
      cleanCnpj: cleaned,
      formattedCnpj: formatCnpj(cleaned),
      mode,
      isHeadquarters,
      rootCode,
      branchCode,
      providedCheckDigits,
      expectedCheckDigits: "",
      reason: "REPEATED_DIGITS",
      reasonMessage:
        "Sequências de caracteres repetidos ou com raiz/ordem zerada não constituem um CNPJ válido.",
    };
  }

  const { dv1, dv2, steps } = calculateCnpjCheckDigits(base12);
  const expectedCheckDigits = `${dv1}${dv2}`;
  const isValid = providedCheckDigits === expectedCheckDigits;

  return {
    isValid,
    cleanCnpj: cleaned,
    formattedCnpj: formatCnpj(cleaned),
    mode,
    isHeadquarters,
    rootCode,
    branchCode,
    providedCheckDigits,
    expectedCheckDigits,
    steps,
    reason: isValid ? undefined : "INVALID_CHECK_DIGITS",
    reasonMessage: isValid
      ? undefined
      : `Dígitos verificadores inválidos: foi informado "${providedCheckDigits}", mas o esperado é "${expectedCheckDigits}".`,
  };
}
