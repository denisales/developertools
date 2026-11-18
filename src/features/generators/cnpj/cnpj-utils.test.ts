import { afterEach, describe, expect, it, vi } from "vitest";

import {
  calculateCnpjCheckDigits,
  charToCnpjValue,
  cleanCnpj,
  CNPJ_WEIGHTS_DV1,
  CNPJ_WEIGHTS_DV2,
  formatCnpj,
  generateCnpj,
  generateCnpjBatch,
  unformatCnpj,
  validateCnpj,
} from "./cnpj-utils";

describe("cnpj-utils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("cleanCnpj & unformatCnpj", () => {
    it("strips dots, slashes, hyphens, whitespace and uppercases letters", () => {
      expect(cleanCnpj("11.222.333/0001-81")).toBe("11222333000181");
      expect(cleanCnpj(" 12.abc.345 / 01de - 35 ")).toBe("12ABC34501DE35");
      expect(unformatCnpj("12.abc.345/01de-35")).toBe("12ABC34501DE35");
    });

    it("handles empty strings", () => {
      expect(cleanCnpj("")).toBe("");
      expect(unformatCnpj("")).toBe("");
    });
  });

  describe("formatCnpj", () => {
    it("formats progressively according to length", () => {
      expect(formatCnpj("")).toBe("");
      expect(formatCnpj("1")).toBe("1");
      expect(formatCnpj("12")).toBe("12");
      expect(formatCnpj("123")).toBe("12.3");
      expect(formatCnpj("12345")).toBe("12.345");
      expect(formatCnpj("123456")).toBe("12.345.6");
      expect(formatCnpj("12345678")).toBe("12.345.678");
      expect(formatCnpj("123456780")).toBe("12.345.678/0");
      expect(formatCnpj("123456780001")).toBe("12.345.678/0001");
      expect(formatCnpj("1234567800018")).toBe("12.345.678/0001-8");
      expect(formatCnpj("12345678000181")).toBe("12.345.678/0001-81");
    });

    it("uppercases alphanumeric characters and truncates beyond 14 chars", () => {
      expect(formatCnpj("12abc34501de35999")).toBe("12.ABC.345/01DE-35");
    });
  });

  describe("charToCnpjValue", () => {
    it("returns 0 for empty string", () => {
      expect(charToCnpjValue("")).toBe(0);
    });

    it("converts digits '0'-'9' to 0-9", () => {
      expect(charToCnpjValue("0")).toBe(0);
      expect(charToCnpjValue("9")).toBe(9);
    });

    it("converts uppercase and lowercase letters A-Z using ASCII - 48", () => {
      expect(charToCnpjValue("A")).toBe(17);
      expect(charToCnpjValue("a")).toBe(17);
      expect(charToCnpjValue("Z")).toBe(42);
      expect(charToCnpjValue("z")).toBe(42);
    });
  });

  describe("calculateCnpjCheckDigits", () => {
    it("computes check digits and full step breakdown for official alphanumeric CNPJ 12ABC34501DE -> 35", () => {
      const result = calculateCnpjCheckDigits("12ABC34501DE");

      expect(result.dv1).toBe(3);
      expect(result.dv2).toBe(5);
      expect(result.steps.dv1Steps).toHaveLength(12);
      expect(result.steps.dv2Steps).toHaveLength(13);
      expect(result.steps.expectedDv1).toBe(3);
      expect(result.steps.expectedDv2).toBe(5);

      expect(result.steps.dv1Steps[2]).toEqual({
        position: 3,
        char: "A",
        asciiCode: 65,
        calcValue: 17,
        weight: CNPJ_WEIGHTS_DV1[2],
        product: 17 * CNPJ_WEIGHTS_DV1[2],
      });
      expect(result.steps.dv2Steps[12]).toEqual({
        position: 13,
        char: "3",
        asciiCode: 51,
        calcValue: 3,
        weight: CNPJ_WEIGHTS_DV2[12],
        product: 3 * CNPJ_WEIGHTS_DV2[12],
      });
    });

    it("handles remainder < 2 yielding check digit 0 for DV1 and DV2", () => {
      // 075265570001 -> check digits are 00 (remainder < 2 for both DV1 and DV2)
      const result = calculateCnpjCheckDigits("075265570001");
      expect(result.dv1).toBe(0);
      expect(result.dv2).toBe(0);
      expect(result.steps.remainder1).toBeLessThan(2);
      expect(result.steps.remainder2).toBeLessThan(2);
    });

    it("throws when base12 does not have 12 characters after cleaning", () => {
      expect(() => calculateCnpjCheckDigits("12345678901")).toThrow(
        "A base do CNPJ deve conter exatamente 12 caracteres."
      );
    });
  });

  describe("generateCnpj", () => {
    it("generates a valid formatted numeric headquarters CNPJ by default", () => {
      const cnpj = generateCnpj();
      expect(cnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/0001-\d{2}$/);
      const validation = validateCnpj(cnpj);
      expect(validation.isValid).toBe(true);
      expect(validation.mode).toBe("numeric");
      expect(validation.isHeadquarters).toBe(true);
    });

    it("generates unformatted numeric CNPJ when formatted is false", () => {
      const cnpj = generateCnpj({ formatted: false });
      expect(cnpj).toMatch(/^\d{14}$/);
      expect(validateCnpj(cnpj).isValid).toBe(true);
    });

    it("avoids repeated digit root in numeric mode when Math.random yields identical digits", () => {
      vi.spyOn(Math, "random").mockReturnValue(0);
      const cnpj = generateCnpj({ formatted: false, mode: "numeric" });
      expect(cnpj.slice(0, 8)).toBe("12345670");
      expect(validateCnpj(cnpj).isValid).toBe(true);
    });

    it("generates valid alphanumeric CNPJ with letters in root", () => {
      const cnpj = generateCnpj({ mode: "alphanumeric", formatted: true });
      expect(cnpj).toMatch(
        /^[0-9A-Z]{2}\.[0-9A-Z]{3}\.[0-9A-Z]{3}\/0001-\d{2}$/
      );
      const validation = validateCnpj(cnpj);
      expect(validation.isValid).toBe(true);
      expect(validation.mode).toBe("alphanumeric");
    });

    it("injects letters when alphanumeric random generation yields only digits", () => {
      vi.spyOn(Math, "random").mockReturnValue(0);
      const cnpj = generateCnpj({
        mode: "alphanumeric",
        formatted: false,
      });
      expect(cnpj.slice(0, 8)).toMatch(/[A-Z]/);
      expect(validateCnpj(cnpj).isValid).toBe(true);
    });

    it("normalizes branch codes across numeric and alphanumeric modes", () => {
      const filial2 = generateCnpj({
        formatted: false,
        mode: "numeric",
        branch: "2",
      });
      expect(filial2.slice(8, 12)).toBe("0002");

      const zeroBranch = generateCnpj({
        formatted: false,
        mode: "numeric",
        branch: "0000",
      });
      expect(zeroBranch.slice(8, 12)).toBe("0001");

      const nonDigitInNumeric = generateCnpj({
        formatted: false,
        mode: "numeric",
        branch: "ABCD",
      });
      expect(nonDigitInNumeric.slice(8, 12)).toBe("0001");

      const emptyBranch = generateCnpj({
        formatted: false,
        mode: "numeric",
        branch: "",
      });
      expect(emptyBranch.slice(8, 12)).toBe("0001");

      const alphaBranch = generateCnpj({
        formatted: false,
        mode: "alphanumeric",
        branch: "01de",
      });
      expect(alphaBranch.slice(8, 12)).toBe("01DE");
    });
  });

  describe("generateCnpjBatch", () => {
    it("generates unique valid CNPJs for requested count", () => {
      const batch = generateCnpjBatch(15, {
        formatted: true,
        mode: "numeric",
      });
      expect(batch).toHaveLength(15);
      expect(new Set(batch).size).toBe(15);
      for (const item of batch) {
        expect(validateCnpj(item).isValid).toBe(true);
      }
    });

    it("clamps count below 1 to 1 and above 100 to 100", () => {
      expect(generateCnpjBatch(0)).toHaveLength(1);
      expect(generateCnpjBatch(-5)).toHaveLength(1);
      const maxBatch = generateCnpjBatch(150, { formatted: false });
      expect(maxBatch).toHaveLength(100);
    });

    it("terminates gracefully if RNG produces duplicates", () => {
      vi.spyOn(Math, "random").mockReturnValue(0);
      const batch = generateCnpjBatch(5, { formatted: false });
      expect(batch).toHaveLength(1);
    });
  });

  describe("validateCnpj", () => {
    it("validates classic numeric headquarters and branch CNPJs", () => {
      const validHq = validateCnpj("11.222.333/0001-81");
      expect(validHq.isValid).toBe(true);
      expect(validHq.mode).toBe("numeric");
      expect(validHq.isHeadquarters).toBe(true);
      expect(validHq.rootCode).toBe("11222333");
      expect(validHq.branchCode).toBe("0001");
      expect(validHq.providedCheckDigits).toBe("81");
      expect(validHq.expectedCheckDigits).toBe("81");
      expect(validHq.steps).toBeDefined();
      expect(validHq.reason).toBeUndefined();

      const generatedFilial = generateCnpj({
        formatted: false,
        mode: "numeric",
        branch: "0042",
      });
      const validFilial = validateCnpj(generatedFilial);
      expect(validFilial.isValid).toBe(true);
      expect(validFilial.isHeadquarters).toBe(false);
      expect(validFilial.branchCode).toBe("0042");
    });

    it("validates official IN RFB 2.229/2024 alphanumeric CNPJ (case-insensitive)", () => {
      const result = validateCnpj("12.abc.345/01de-35");
      expect(result.isValid).toBe(true);
      expect(result.cleanCnpj).toBe("12ABC34501DE35");
      expect(result.formattedCnpj).toBe("12.ABC.345/01DE-35");
      expect(result.mode).toBe("alphanumeric");
      expect(result.isHeadquarters).toBe(false);
      expect(result.providedCheckDigits).toBe("35");
      expect(result.expectedCheckDigits).toBe("35");
      expect(result.steps?.expectedDv1).toBe(3);
      expect(result.steps?.expectedDv2).toBe(5);
    });

    it("rejects invalid lengths", () => {
      const shortRes = validateCnpj("11222333");
      expect(shortRes.isValid).toBe(false);
      expect(shortRes.reason).toBe("INVALID_LENGTH");
      expect(shortRes.reasonMessage).toContain("14 caracteres");
    });

    it("rejects invalid characters in base12 or letters in check digits", () => {
      const badBase = validateCnpj("11222333000@81");
      expect(badBase.isValid).toBe(false);
      expect(badBase.reason).toBe("INVALID_CHARS");

      const alphaInDv = validateCnpj("12ABC34501DE3A");
      expect(alphaInDv.isValid).toBe(false);
      expect(alphaInDv.reason).toBe("INVALID_CHARS");
    });

    it("rejects repeated sequences and zeroed root or branch", () => {
      const allOnes = validateCnpj("11.111.111/1111-11");
      expect(allOnes.isValid).toBe(false);
      expect(allOnes.reason).toBe("REPEATED_DIGITS");

      const repeatedBase = validateCnpj("AAAAAAAAAAAA12");
      expect(repeatedBase.isValid).toBe(false);
      expect(repeatedBase.reason).toBe("REPEATED_DIGITS");

      const zeroRoot = validateCnpj("00000000000191");
      expect(zeroRoot.isValid).toBe(false);
      expect(zeroRoot.reason).toBe("REPEATED_DIGITS");

      const zeroBranch = validateCnpj("12345678000012");
      expect(zeroBranch.isValid).toBe(false);
      expect(zeroBranch.reason).toBe("REPEATED_DIGITS");
    });

    it("rejects wrong check digits and returns expected DVs with math steps", () => {
      const wrongDv = validateCnpj("11.222.333/0001-99");
      expect(wrongDv.isValid).toBe(false);
      expect(wrongDv.reason).toBe("INVALID_CHECK_DIGITS");
      expect(wrongDv.providedCheckDigits).toBe("99");
      expect(wrongDv.expectedCheckDigits).toBe("81");
      expect(wrongDv.reasonMessage).toContain('esperado é "81"');
      expect(wrongDv.steps).toBeDefined();
    });
  });
});
