import { describe, it, expect } from "vitest";
import { calculateLuhnCheckDigit, isLuhnValid } from "@/core/utils/luhn";

describe("calculateLuhnCheckDigit", () => {
  it("returns correct check digit for Visa partial number", () => {
    // Visa 4111111111111111 -> partial "411111111111111", check digit 1
    expect(calculateLuhnCheckDigit("411111111111111")).toBe(1);
  });

  it("returns correct check digit for MasterCard partial number", () => {
    // MC 5500000000000004 -> partial "550000000000000", check digit 4
    expect(calculateLuhnCheckDigit("550000000000000")).toBe(4);
  });

  it("returns correct check digit for Amex partial number", () => {
    // Amex 378282246310005 -> partial "37828224631000", check digit 5
    expect(calculateLuhnCheckDigit("37828224631000")).toBe(5);
  });

  it("handles single digit partial number", () => {
    const digit = calculateLuhnCheckDigit("0");
    expect(digit).toBeGreaterThanOrEqual(0);
    expect(digit).toBeLessThanOrEqual(9);
  });

  it("handles empty string", () => {
    const digit = calculateLuhnCheckDigit("");
    expect(digit).toBe(0);
  });
});

describe("isLuhnValid", () => {
  it("returns true for valid Visa card number", () => {
    expect(isLuhnValid("4111111111111111")).toBe(true);
  });

  it("returns true for valid MasterCard number", () => {
    expect(isLuhnValid("5500000000000004")).toBe(true);
  });

  it("returns true for valid Amex card number", () => {
    expect(isLuhnValid("378282246310005")).toBe(true);
  });

  it("returns false for invalid card number (one digit changed)", () => {
    // Changed last digit from 1 to 2
    expect(isLuhnValid("4111111111111112")).toBe(false);
  });

  it("returns false for another invalid card number", () => {
    // Changed a middle digit
    expect(isLuhnValid("5500000000100004")).toBe(false);
  });

  it("handles card number with spaces", () => {
    expect(isLuhnValid("4111 1111 1111 1111")).toBe(true);
  });

  it("handles card number with dashes", () => {
    expect(isLuhnValid("4111-1111-1111-1111")).toBe(true);
  });

  it("handles card number with mixed whitespace and dashes", () => {
    expect(isLuhnValid("5500-0000 0000-0004")).toBe(true);
  });

  it("handles empty string", () => {
    expect(isLuhnValid("")).toBe(true);
  });

  it("handles single digit", () => {
    // "0" should be valid (sum=0, 0%10=0)
    expect(isLuhnValid("0")).toBe(true);
  });
});
