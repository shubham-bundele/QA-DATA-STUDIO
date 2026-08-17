import { describe, it, expect } from "vitest";
import { generateIBAN, formatIBAN } from "@/core/utils/iban";

function validateIBANMod97(iban: string): boolean {
  // Rearrange: move first 4 chars to the end
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  // Convert letters to numbers (A=10, B=11, ..., Z=35)
  let numericString = "";
  for (const char of rearranged.toUpperCase()) {
    if (char >= "A" && char <= "Z") {
      numericString += (char.charCodeAt(0) - 55).toString();
    } else {
      numericString += char;
    }
  }
  // Compute mod 97 using iterative approach for large numbers
  let remainder = 0;
  for (const ch of numericString) {
    remainder = (remainder * 10 + parseInt(ch, 10)) % 97;
  }
  return remainder === 1;
}

describe("generateIBAN", () => {
  it("generates DE IBAN starting with 'DE' and correct length", () => {
    const iban = generateIBAN("DE");
    expect(iban).toMatch(/^DE/);
    // Country (2) + check digits (2) + BBAN pattern "0000000000000000000" (19) = 23
    expect(iban).toHaveLength(23);
  });

  it("generates GB IBAN starting with 'GB' and length 22", () => {
    const iban = generateIBAN("GB");
    expect(iban).toMatch(/^GB/);
    expect(iban).toHaveLength(22);
  });

  it("generates FR IBAN starting with 'FR' and length 27", () => {
    const iban = generateIBAN("FR");
    expect(iban).toMatch(/^FR/);
    expect(iban).toHaveLength(27);
  });

  it("generates US IBAN starting with 'US'", () => {
    const iban = generateIBAN("US");
    expect(iban).toMatch(/^US/);
  });

  it("generates IN IBAN starting with 'IN'", () => {
    const iban = generateIBAN("IN");
    expect(iban).toMatch(/^IN/);
  });

  it("defaults to DE when no argument is passed", () => {
    const iban = generateIBAN();
    expect(iban).toMatch(/^DE/);
    expect(iban).toHaveLength(23);
  });

  it("falls back to DE spec for unsupported country code", () => {
    const iban = generateIBAN("XX");
    // Uses "XX" as prefix but DE spec BBAN pattern, so same length as DE (23)
    expect(iban).toMatch(/^XX/);
    expect(iban).toHaveLength(23);
  });

  it("passes mod-97 validation for DE IBAN", () => {
    const iban = generateIBAN("DE");
    expect(validateIBANMod97(iban)).toBe(true);
  });

  it("passes mod-97 validation for GB IBAN", () => {
    const iban = generateIBAN("GB");
    expect(validateIBANMod97(iban)).toBe(true);
  });

  it("passes mod-97 validation for FR IBAN", () => {
    const iban = generateIBAN("FR");
    expect(validateIBANMod97(iban)).toBe(true);
  });

  it("produces different IBANs on multiple generations", () => {
    const ibans = new Set<string>();
    for (let i = 0; i < 10; i++) {
      ibans.add(generateIBAN("DE"));
    }
    expect(ibans.size).toBeGreaterThan(1);
  });
});

describe("formatIBAN", () => {
  it("inserts spaces every 4 characters", () => {
    const formatted = formatIBAN("DE89370400440532013000");
    expect(formatted).toBe("DE89 3704 0044 0532 0130 00");
  });

  it("trims trailing space", () => {
    // 8 characters -> "ABCD EFGH" with no trailing space
    const formatted = formatIBAN("ABCDEFGH");
    expect(formatted).toBe("ABCD EFGH");
    expect(formatted).not.toMatch(/\s$/);
  });

  it("handles IBAN with length not divisible by 4", () => {
    const formatted = formatIBAN("DE89370400440532013000");
    // 22 chars -> groups of 4 with remainder 2
    const groups = formatted.split(" ");
    expect(groups[groups.length - 1]).toHaveLength(2);
  });
});
