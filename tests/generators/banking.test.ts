import { describe, it, expect } from "vitest";
import { generateBanking } from "@/features/banking/banking.service";
import type { BankingGenerateConfig } from "@/features/banking/banking.types";

const defaultFields = {
  bankName: true,
  accountNumber: true,
  routingNumber: true,
  swiftCode: false,
  iban: false,
  accountType: true,
  balance: true,
  currency: true,
};

const defaultOptions = {
  accountTypes: ["checking", "savings"] as ("checking" | "savings" | "business")[],
  balanceRange: { min: 0, max: 1_000_000 },
  currency: "USD",
  country: "US",
};

type ConfigOverrides = Omit<Partial<BankingGenerateConfig>, "fields" | "options"> & {
  fields?: Partial<BankingGenerateConfig["fields"]>;
  options?: Partial<BankingGenerateConfig["options"]>;
};

function makeConfig(overrides: ConfigOverrides = {}): BankingGenerateConfig {
  const { fields, options, ...rest } = overrides;
  return {
    count: 5,
    ...rest,
    fields: { ...defaultFields, ...fields },
    options: { ...defaultOptions, ...options },
  };
}

describe("generateBanking", () => {
  it("returns the requested record count", () => {
    const result = generateBanking(makeConfig({ count: 6 }));
    expect(result.records).toHaveLength(6);
  });

  it("routing numbers are 9 digits", () => {
    const result = generateBanking(makeConfig({ count: 10 }));
    for (const record of result.records) {
      expect(record.routingNumber).toBeDefined();
      expect(record.routingNumber).toMatch(/^\d{9}$/);
    }
  });

  it("routing numbers pass ABA checksum", () => {
    const result = generateBanking(makeConfig({ count: 20 }));
    for (const record of result.records) {
      const digits = record.routingNumber!.split("").map(Number);
      const checksum =
        3 * (digits[0] + digits[3] + digits[6]) +
        7 * (digits[1] + digits[4] + digits[7]) +
        (digits[2] + digits[5] + digits[8]);
      expect(checksum % 10).toBe(0);
    }
  });

  it("SWIFT codes are 8 characters, all uppercase alphanumeric", () => {
    const result = generateBanking(
      makeConfig({ fields: { swiftCode: true } })
    );
    for (const record of result.records) {
      expect(record.swiftCode).toBeDefined();
      expect(record.swiftCode).toHaveLength(8);
      expect(record.swiftCode).toMatch(/^[A-Z0-9]{8}$/);
    }
  });

  it("IBAN is generated when iban field enabled", () => {
    const result = generateBanking(
      makeConfig({ fields: { iban: true } })
    );
    for (const record of result.records) {
      expect(record.iban).toBeDefined();
      expect(typeof record.iban).toBe("string");
      // IBAN starts with a two-letter country code
      expect(record.iban!.slice(0, 2)).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("US config does NOT generate IBAN by default", () => {
    const result = generateBanking(makeConfig({ options: { country: "US" } }));
    for (const record of result.records) {
      expect(record.iban).toBeUndefined();
    }
  });

  it("IN config does NOT generate IBAN by default", () => {
    const result = generateBanking(makeConfig({ options: { country: "IN" } }));
    for (const record of result.records) {
      expect(record.iban).toBeUndefined();
    }
  });

  it("account type is one of configured types", () => {
    const accountTypes = ["checking", "business"] as const;
    const result = generateBanking(
      makeConfig({ count: 20, options: { accountTypes: [...accountTypes] } })
    );
    for (const record of result.records) {
      expect(record.accountType).toBeDefined();
      expect(accountTypes).toContain(record.accountType);
    }
  });

  it("balance is within configured range", () => {
    const min = 100;
    const max = 500;
    const result = generateBanking(
      makeConfig({ count: 20, options: { balanceRange: { min, max } } })
    );
    for (const record of result.records) {
      expect(record.balance).toBeDefined();
      expect(record.balance).toBeGreaterThanOrEqual(min);
      expect(record.balance).toBeLessThanOrEqual(max);
    }
  });

  it("currency matches config", () => {
    const result = generateBanking(makeConfig({ options: { currency: "EUR" } }));
    for (const record of result.records) {
      expect(record.currency).toBe("EUR");
    }
    expect(result.meta.currency).toBe("EUR");
  });

  it("config is not mutated", () => {
    const config = makeConfig({ count: 3 });
    const snapshot = JSON.parse(JSON.stringify(config));
    generateBanking(config);
    expect(config).toEqual(snapshot);
  });
});
