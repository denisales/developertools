import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BRAZILIAN_STATES,
  calculateMod11Digit,
  FISCAL_REGIONS,
  formatCpf,
  generateCpf,
  generateCpfBatch,
  getCpfRegion,
  STATE_TO_DIGIT,
  stripCpfDigits,
  validateCpf,
} from "./cpf-utils";

describe("cpf-utils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constants and metadata", () => {
    it("covers all 10 fiscal regions (0 through 9) and all 27 Brazilian states", () => {
      expect(Object.keys(FISCAL_REGIONS)).toHaveLength(10);
      expect(BRAZILIAN_STATES).toHaveLength(27);

      const statesFromRegions = Object.values(FISCAL_REGIONS).flatMap(
        (region) => region.states
      );
      expect(statesFromRegions).toHaveLength(27);

      for (const state of BRAZILIAN_STATES) {
        expect(STATE_TO_DIGIT[state.uf]).toBe(state.regionDigit);
        expect(FISCAL_REGIONS[state.regionDigit].states).toContain(state.uf);
      }
    });

    it("getCpfRegion returns region info for 0..9 and null for out-of-range digits", () => {
      for (let digit = 0; digit <= 9; digit++) {
        const info = getCpfRegion(digit);
        expect(info).not.toBeNull();
        expect(info?.digit).toBe(digit);
      }

      expect(getCpfRegion(-1)).toBeNull();
      expect(getCpfRegion(10)).toBeNull();
    });
  });

  describe("stripCpfDigits and formatCpf", () => {
    it("strips all non-numeric characters", () => {
      expect(stripCpfDigits("529.982.247-25")).toBe("52998224725");
      expect(stripCpfDigits("abc123def456")).toBe("123456");
      expect(stripCpfDigits("")).toBe("");
    });

    it("applies progressive and full XXX.XXX.XXX-XX mask", () => {
      expect(formatCpf("")).toBe("");
      expect(formatCpf("5")).toBe("5");
      expect(formatCpf("529")).toBe("529");
      expect(formatCpf("5299")).toBe("529.9");
      expect(formatCpf("529982")).toBe("529.982");
      expect(formatCpf("5299822")).toBe("529.982.2");
      expect(formatCpf("529982247")).toBe("529.982.247");
      expect(formatCpf("5299822472")).toBe("529.982.247-2");
      expect(formatCpf("52998224725")).toBe("529.982.247-25");
      expect(formatCpf("52998224725999")).toBe("529.982.247-25");
    });
  });

  describe("calculateMod11Digit", () => {
    it("computes DV1 and DV2 with remainder >= 2", () => {
      const base = [5, 2, 9, 9, 8, 2, 2, 4, 7];
      const dv1 = calculateMod11Digit(base, 10);
      expect(dv1.weights).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2]);
      expect(dv1.products).toEqual([50, 18, 72, 63, 48, 10, 8, 12, 14]);
      expect(dv1.sum).toBe(295);
      expect(dv1.remainder).toBe(9);
      expect(dv1.digit).toBe(2);

      const dv2 = calculateMod11Digit([...base, dv1.digit], 11);
      expect(dv2.weights).toEqual([11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
      expect(dv2.sum).toBe(347);
      expect(dv2.remainder).toBe(6);
      expect(dv2.digit).toBe(5);
    });

    it("returns 0 when remainder is 0 or 1", () => {
      // Base where sum % 11 === 0 -> digit 0
      const rem0 = calculateMod11Digit([0, 0, 0, 0, 0, 0, 0, 0, 0], 10);
      expect(rem0.remainder).toBe(0);
      expect(rem0.digit).toBe(0);

      // Base where sum = 12 (0*10 + ... + 6*2 = 12 => 12 % 11 === 1) -> digit 0
      const rem1 = calculateMod11Digit([0, 0, 0, 0, 0, 0, 0, 0, 6], 10);
      expect(rem1.sum).toBe(12);
      expect(rem1.remainder).toBe(1);
      expect(rem1.digit).toBe(0);
    });
  });

  describe("generateCpf", () => {
    it("generates formatted valid CPF by default and unformatted when requested", () => {
      const formatted = generateCpf();
      expect(formatted).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
      expect(validateCpf(formatted).isValid).toBe(true);

      const unformatted = generateCpf({ formatted: false });
      expect(unformatted).toMatch(/^\d{11}$/);
      expect(validateCpf(unformatted).isValid).toBe(true);
    });

    it("respects the 9th digit fiscal region for all 27 Brazilian UFs", () => {
      for (const state of BRAZILIAN_STATES) {
        const cpf = generateCpf({ formatted: false, state: state.uf });
        expect(cpf).toHaveLength(11);
        expect(Number(cpf[8])).toBe(state.regionDigit);

        const validation = validateCpf(cpf);
        expect(validation.isValid).toBe(true);
        expect(validation.regionDigit).toBe(state.regionDigit);
        expect(validation.states).toContain(state.uf);
      }
    });

    it("generates valid CPFs covering all fiscal regions 0..9", () => {
      const representativeByDigit = Object.values(FISCAL_REGIONS).map((region) => ({
        digit: region.digit,
        uf: region.states[0],
      }));

      for (const { digit, uf } of representativeByDigit) {
        const cpf = generateCpf({ formatted: true, state: uf });
        const result = validateCpf(cpf);
        expect(result.isValid).toBe(true);
        expect(result.regionDigit).toBe(digit);
      }
    });

    it("retries generation when all 9 base digits are identical", () => {
      const randomSpy = vi.spyOn(Math, "random");
      // First 8 calls return 0 (with state RS digit 0 => 000000000 repeated),
      // next 8 calls return 0.1..0.8 so the second iteration succeeds.
      for (let i = 0; i < 8; i++) {
        randomSpy.mockReturnValueOnce(0);
      }
      randomSpy.mockReturnValueOnce(0.5);
      for (let i = 0; i < 7; i++) {
        randomSpy.mockReturnValueOnce(0.1 * (i + 1));
      }

      const cpf = generateCpf({ formatted: false, state: "RS" });
      expect(cpf).toHaveLength(11);
      expect(cpf[8]).toBe("0");
      expect(cpf.startsWith("5")).toBe(true);
      expect(validateCpf(cpf).isValid).toBe(true);
    });
  });

  describe("generateCpfBatch", () => {
    it("generates the requested count of unique valid CPFs", () => {
      const batch = generateCpfBatch(15);
      expect(batch).toHaveLength(15);
      expect(new Set(batch).size).toBe(15);
      for (const cpf of batch) {
        expect(cpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
        expect(validateCpf(cpf).isValid).toBe(true);
      }
    });

    it("clamps batch count to [1, 100] and supports unformatted + state options", () => {
      expect(generateCpfBatch(0)).toHaveLength(1);
      expect(generateCpfBatch(-5)).toHaveLength(1);
      expect(generateCpfBatch(Number.NaN)).toHaveLength(1);
      expect(generateCpfBatch(3.9)).toHaveLength(3);
      expect(generateCpfBatch(150)).toHaveLength(100);

      const spBatch = generateCpfBatch(5, { formatted: false, state: "SP" });
      expect(spBatch).toHaveLength(5);
      for (const cpf of spBatch) {
        expect(cpf).toMatch(/^\d{11}$/);
        expect(cpf[8]).toBe("8");
        expect(validateCpf(cpf).isValid).toBe(true);
      }
    });
  });

  describe("validateCpf", () => {
    it("validates a known valid CPF and returns full step-by-step DV1/DV2 details", () => {
      const res = validateCpf("529.982.247-25");
      expect(res.isValid).toBe(true);
      expect(res.cleanCpf).toBe("52998224725");
      expect(res.formattedCpf).toBe("529.982.247-25");
      expect(res.regionDigit).toBe(7);
      expect(res.fiscalRegionName).toBe("7ª Região Fiscal");
      expect(res.states).toEqual(["ES", "RJ"]);
      expect(res.reason).toBeUndefined();

      expect(res.firstDigitStep).toEqual({
        weights: [10, 9, 8, 7, 6, 5, 4, 3, 2],
        products: [50, 18, 72, 63, 48, 10, 8, 12, 14],
        sum: 295,
        remainder: 9,
        expectedDigit: 2,
        providedDigit: 2,
        matches: true,
      });

      expect(res.secondDigitStep).toEqual({
        weights: [11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
        products: [55, 20, 81, 72, 56, 12, 10, 16, 21, 4],
        sum: 347,
        remainder: 6,
        expectedDigit: 5,
        providedDigit: 5,
        matches: true,
      });
    });

    it("rejects CPFs with invalid lengths", () => {
      for (const input of ["", "123", "123.456.789-0", "123456789012"]) {
        const res = validateCpf(input);
        expect(res.isValid).toBe(false);
        expect(res.reason).toBe("INVALID_LENGTH");
        expect(res.regionDigit).toBeNull();
        expect(res.fiscalRegionName).toBeNull();
        expect(res.states).toEqual([]);
        expect(res.reasonMessage).toContain("11 dígitos numéricos");
      }
    });

    it("rejects all repeated-digit CPFs from 00000000000 to 99999999999", () => {
      for (let d = 0; d <= 9; d++) {
        const raw = String(d).repeat(11);
        const res = validateCpf(formatCpf(raw));
        expect(res.isValid).toBe(false);
        expect(res.reason).toBe("REPEATED_DIGITS");
        expect(res.regionDigit).toBe(d);
        expect(res.fiscalRegionName).toBe(FISCAL_REGIONS[d].name);
        expect(res.states).toEqual(FISCAL_REGIONS[d].states);
        expect(res.firstDigitStep).toBeUndefined();
        expect(res.secondDigitStep).toBeUndefined();
      }
    });

    it("detects wrong DV1 and wrong DV2 independently", () => {
      // Valid: 52998224725 -> wrong DV1 (3 instead of 2)
      const wrongDv1 = validateCpf("52998224735");
      expect(wrongDv1.isValid).toBe(false);
      expect(wrongDv1.reason).toBe("INVALID_CHECK_DIGITS");
      expect(wrongDv1.firstDigitStep?.matches).toBe(false);
      expect(wrongDv1.firstDigitStep?.expectedDigit).toBe(2);
      expect(wrongDv1.firstDigitStep?.providedDigit).toBe(3);
      expect(wrongDv1.reasonMessage).toContain("-25");
      expect(wrongDv1.reasonMessage).toContain("-35");

      // Valid DV1 (2), wrong DV2 (9 instead of 5)
      const wrongDv2 = validateCpf("52998224729");
      expect(wrongDv2.isValid).toBe(false);
      expect(wrongDv2.reason).toBe("INVALID_CHECK_DIGITS");
      expect(wrongDv2.firstDigitStep?.matches).toBe(true);
      expect(wrongDv2.secondDigitStep?.matches).toBe(false);
      expect(wrongDv2.secondDigitStep?.expectedDigit).toBe(5);
      expect(wrongDv2.secondDigitStep?.providedDigit).toBe(9);
    });
  });
});
