import { describe, it, expect } from "vitest";
import { generateCreditCards } from "@/features/credit-cards/credit-card.service";
import { isLuhnValid } from "@/core/utils/luhn";
import type { CreditCardGenerateConfig } from "@/features/credit-cards/credit-card.types";

const defaultFields = {
  cardNumber: true,
  cardHolder: true,
  expiryDate: true,
  cvv: true,
  network: true,
  issuer: false,
};

const defaultOptions = {
  expiryRange: { minMonths: 1, maxMonths: 60 },
  expired: false,
  formatted: true,
};

type ConfigOverrides = Omit<Partial<CreditCardGenerateConfig>, "fields" | "options"> & {
  fields?: Partial<CreditCardGenerateConfig["fields"]>;
  options?: Partial<CreditCardGenerateConfig["options"]>;
};

function makeConfig(overrides: ConfigOverrides = {}): CreditCardGenerateConfig {
  const { fields, options, ...rest } = overrides;
  return {
    count: 10,
    networks: ["visa", "mastercard", "amex"],
    ...rest,
    fields: { ...defaultFields, ...fields },
    options: { ...defaultOptions, ...options },
  };
}

describe("generateCreditCards", () => {
  it("returns the requested record count", () => {
    const result = generateCreditCards(makeConfig({ count: 8 }));
    expect(result.records).toHaveLength(8);
  });

  it("card numbers pass Luhn validation", () => {
    const result = generateCreditCards(makeConfig({ count: 20 }));
    for (const record of result.records) {
      expect(record.cardNumber).toBeDefined();
      expect(isLuhnValid(record.cardNumber!)).toBe(true);
    }
  });

  it("network field matches one of configured networks", () => {
    const networks = ["visa", "mastercard"] as const;
    const result = generateCreditCards(
      makeConfig({ count: 20, networks: [...networks] })
    );
    for (const record of result.records) {
      expect(record.network).toBeDefined();
      const networkLower = record.network!.toLowerCase();
      expect(networks).toContain(networkLower);
    }
  });

  it("CVV length is 3 for visa/mastercard/discover, 4 for amex", () => {
    // Test with only visa
    const visaResult = generateCreditCards(
      makeConfig({ count: 5, networks: ["visa"] })
    );
    for (const record of visaResult.records) {
      expect(record.cvv).toHaveLength(3);
    }

    // Test with only amex
    const amexResult = generateCreditCards(
      makeConfig({ count: 5, networks: ["amex"] })
    );
    for (const record of amexResult.records) {
      expect(record.cvv).toHaveLength(4);
    }

    // Test with only mastercard
    const mcResult = generateCreditCards(
      makeConfig({ count: 5, networks: ["mastercard"] })
    );
    for (const record of mcResult.records) {
      expect(record.cvv).toHaveLength(3);
    }

    // Test with only discover
    const discoverResult = generateCreditCards(
      makeConfig({ count: 5, networks: ["discover"] })
    );
    for (const record of discoverResult.records) {
      expect(record.cvv).toHaveLength(3);
    }
  });

  it("expiry date format is MM/YY", () => {
    const result = generateCreditCards(makeConfig());
    for (const record of result.records) {
      expect(record.expiryDate).toMatch(/^\d{2}\/\d{2}$/);
    }
  });

  it("when expired is true, expiry dates are in the past", () => {
    const result = generateCreditCards(
      makeConfig({ options: { expired: true } })
    );
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear() % 100;

    for (const record of result.records) {
      expect(record.expiryDate).toBeDefined();
      const [monthStr, yearStr] = record.expiryDate!.split("/");
      const month = parseInt(monthStr, 10);
      const year = parseInt(yearStr, 10);

      // The card must be expired: either the year is before the current year,
      // or same year but the month is before the current month
      const isExpired = year < currentYear || (year === currentYear && month < currentMonth);
      expect(isExpired).toBe(true);
    }
  });

  it("when formatted is true, card numbers contain spaces", () => {
    const result = generateCreditCards(
      makeConfig({ options: { formatted: true } })
    );
    for (const record of result.records) {
      expect(record.cardNumber).toContain(" ");
    }
  });

  it("when formatted is false, card numbers are digits only", () => {
    const result = generateCreditCards(
      makeConfig({ options: { formatted: false } })
    );
    for (const record of result.records) {
      expect(record.cardNumber).toMatch(/^\d+$/);
    }
  });

  it("config is not mutated", () => {
    const config = makeConfig({ count: 3 });
    const snapshot = JSON.parse(JSON.stringify(config));
    generateCreditCards(config);
    expect(config).toEqual(snapshot);
  });

  it("networks array controls which networks appear", () => {
    const result = generateCreditCards(
      makeConfig({ count: 30, networks: ["discover"] })
    );
    for (const record of result.records) {
      expect(record.network!.toLowerCase()).toBe("discover");
    }
  });
});
