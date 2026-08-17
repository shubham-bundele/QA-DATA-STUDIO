import { describe, it, expect } from "vitest";
import { SeededRandom, createRng } from "@/core/utils/random";
import { generateUsers } from "@/features/users/user.service";
import { generateAddresses } from "@/features/addresses/address.service";
import { generateCreditCards } from "@/features/credit-cards/credit-card.service";
import { generateBanking } from "@/features/banking/banking.service";
import { generatePayloads } from "@/features/payloads/payload.service";
import { Orchestrator } from "@/core/engines/orchestrator";
import { isLuhnValid } from "@/core/utils/luhn";
import { exportData } from "@/features/export/export.service";

const SEED = 42;
const DIFFERENT_SEED = 999;

function stripMeta<T extends { meta: unknown }>(result: T): Omit<T, "meta"> {
  const { meta, ...rest } = result;
  return rest;
}

describe("SeededRandom PRNG", () => {
  it("produces identical sequences from the same seed", () => {
    const a = new SeededRandom(123);
    const b = new SeededRandom(123);
    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it("produces different sequences from different seeds", () => {
    const a = new SeededRandom(123);
    const b = new SeededRandom(456);
    let same = 0;
    for (let i = 0; i < 100; i++) {
      if (a.next() === b.next()) same++;
    }
    expect(same).toBeLessThan(5);
  });

  it("deterministic int, float, pick, shuffle", () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);

    expect(a.int(1, 100)).toBe(b.int(1, 100));
    expect(a.float(0, 100)).toBe(b.float(0, 100));
    expect(a.pick(["x", "y", "z"])).toBe(b.pick(["x", "y", "z"]));
    expect(a.shuffle([1, 2, 3, 4, 5])).toEqual(b.shuffle([1, 2, 3, 4, 5]));
  });

  it("deterministic ID generation", () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    expect(a.id()).toBe(b.id());
    expect(a.id()).toBe(b.id());
  });

  it("child streams are deterministic and isolated", () => {
    const parentA = new SeededRandom(42);
    const parentB = new SeededRandom(42);
    const childA = parentA.child(1);
    const childB = parentB.child(1);

    for (let i = 0; i < 20; i++) {
      expect(childA.next()).toBe(childB.next());
    }
  });
});

describe("User Generator — seed reproducibility", () => {
  const config = {
    count: 10,
    locale: "en",
    fields: {
      firstName: true, lastName: true, email: true, phone: true,
      dateOfBirth: false, age: false, gender: true, username: true,
      password: true, avatar: false, ssn: true,
    },
    options: {
      ageRange: { min: 18, max: 85 },
      emailDomains: [] as string[],
      passwordLength: 12,
      seed: SEED,
    },
  };

  it("same seed produces identical records", () => {
    const a = stripMeta(generateUsers(config));
    const b = stripMeta(generateUsers(config));
    expect(a).toEqual(b);
  });

  it("different seed produces different records", () => {
    const a = generateUsers(config);
    const b = generateUsers({ ...config, options: { ...config.options, seed: DIFFERENT_SEED } });
    expect(a.records).not.toEqual(b.records);
  });

  it("unseeded mode produces variable output", () => {
    const unseeded = { ...config, options: { ...config.options, seed: undefined } };
    const a = generateUsers(unseeded);
    const b = generateUsers(unseeded);
    const aNames = a.records.map(r => r.firstName);
    const bNames = b.records.map(r => r.firstName);
    expect(aNames).not.toEqual(bNames);
  });

  it("same seed with custom email domains produces identical records", () => {
    const withDomains = {
      ...config,
      options: { ...config.options, emailDomains: ["test.com", "example.org"] },
    };
    const a = stripMeta(generateUsers(withDomains));
    const b = stripMeta(generateUsers(withDomains));
    expect(a).toEqual(b);
  });
});

describe("Address Generator — seed reproducibility", () => {
  const config = {
    count: 10,
    country: "US",
    fields: {
      street: true, city: true, state: true, zipCode: true,
      country: true, county: false, latitude: false, longitude: false,
      fullAddress: true,
    },
    options: { stateFilter: [] as string[], seed: SEED },
  };

  it("same seed produces identical records", () => {
    const a = stripMeta(generateAddresses(config));
    const b = stripMeta(generateAddresses(config));
    expect(a).toEqual(b);
  });

  it("different seed produces different records", () => {
    const a = generateAddresses(config);
    const b = generateAddresses({ ...config, options: { ...config.options, seed: DIFFERENT_SEED } });
    expect(a.records).not.toEqual(b.records);
  });

  it("same seed with state filter produces identical records", () => {
    const withFilter = {
      ...config,
      options: { ...config.options, stateFilter: ["CA", "TX", "NY"] },
    };
    const a = stripMeta(generateAddresses(withFilter));
    const b = stripMeta(generateAddresses(withFilter));
    expect(a).toEqual(b);
  });
});

describe("Credit Card Generator — seed reproducibility", () => {
  const config = {
    count: 10,
    networks: ["visa" as const, "mastercard" as const, "amex" as const],
    fields: {
      cardNumber: true, cardHolder: true, expiryDate: true,
      cvv: true, network: true, issuer: true,
    },
    options: {
      expiryRange: { minMonths: 1, maxMonths: 60 },
      expired: false,
      formatted: true,
      seed: SEED,
    },
  };

  it("same seed produces identical records", () => {
    const a = stripMeta(generateCreditCards(config));
    const b = stripMeta(generateCreditCards(config));
    expect(a).toEqual(b);
  });

  it("different seed produces different records", () => {
    const a = generateCreditCards(config);
    const b = generateCreditCards({ ...config, options: { ...config.options, seed: DIFFERENT_SEED } });
    expect(a.records).not.toEqual(b.records);
  });

  it("seeded cards remain Luhn-valid", () => {
    const result = generateCreditCards(config);
    for (const record of result.records) {
      const num = (record.cardNumber as string).replace(/\s/g, "");
      expect(isLuhnValid(num)).toBe(true);
    }
  });
});

describe("Banking Generator — seed reproducibility", () => {
  const config = {
    count: 10,
    fields: {
      bankName: true, accountNumber: true, routingNumber: true,
      swiftCode: true, iban: true, accountType: true,
      balance: true, currency: true,
    },
    options: {
      accountTypes: ["checking" as const, "savings" as const],
      balanceRange: { min: 100, max: 500000 },
      currency: "USD",
      country: "US",
      seed: SEED,
    },
  };

  it("same seed produces identical records", () => {
    const a = stripMeta(generateBanking(config));
    const b = stripMeta(generateBanking(config));
    expect(a).toEqual(b);
  });

  it("different seed produces different records", () => {
    const a = generateBanking(config);
    const b = generateBanking({ ...config, options: { ...config.options, seed: DIFFERENT_SEED } });
    expect(a.records).not.toEqual(b.records);
  });

  it("seeded ABA routing numbers remain checksum-valid", () => {
    const result = generateBanking(config);
    for (const record of result.records) {
      const routing = record.routingNumber as string;
      const digits = routing.split("").map(Number);
      const checksum =
        (3 * (digits[0] + digits[3] + digits[6]) +
          7 * (digits[1] + digits[4] + digits[7]) +
          (digits[2] + digits[5]) +
          digits[8]) % 10;
      expect(checksum).toBe(0);
    }
  });

  it("seeded IBANs remain mod-97 valid", () => {
    const result = generateBanking(config);
    for (const record of result.records) {
      const iban = record.iban as string;
      const rearranged = iban.slice(4) + iban.slice(0, 4);
      let numericStr = "";
      for (const char of rearranged) {
        if (char >= "A" && char <= "Z") {
          numericStr += (char.charCodeAt(0) - 55).toString();
        } else {
          numericStr += char;
        }
      }
      let remainder = 0;
      for (const char of numericStr) {
        remainder = (remainder * 10 + parseInt(char, 10)) % 97;
      }
      expect(remainder).toBe(1);
    }
  });
});

describe("Payload Generator — seed reproducibility", () => {
  const config = {
    count: 10,
    format: "json" as const,
    rootElement: "data",
    schema: [
      { fieldName: "userId", fieldType: "uuid" as const },
      { fieldName: "name", fieldType: "name" as const },
      { fieldName: "email", fieldType: "email" as const },
      { fieldName: "isActive", fieldType: "boolean" as const },
      { fieldName: "score", fieldType: "integer" as const, options: { min: 0, max: 100 } },
    ],
    options: { includeNulls: false, includeEdgeCases: false, seed: SEED },
  };

  it("same seed produces identical records", () => {
    const a = generatePayloads(config);
    const b = generatePayloads(config);
    expect(a.records).toEqual(b.records);
    expect(a.rawOutput).toEqual(b.rawOutput);
  });

  it("different seed produces different records", () => {
    const a = generatePayloads(config);
    const b = generatePayloads({ ...config, options: { ...config.options, seed: DIFFERENT_SEED } });
    expect(a.records).not.toEqual(b.records);
  });

  it("same seed with recursive schema produces identical records", () => {
    const recursiveConfig = {
      ...config,
      schema: [
        { fieldName: "id", fieldType: "uuid" as const },
        {
          fieldName: "address",
          fieldType: "object" as const,
          options: {
            nested: [
              { fieldName: "street", fieldType: "address" as const },
              { fieldName: "city", fieldType: "name" as const },
              { fieldName: "zip", fieldType: "string" as const, options: { minLength: 5, maxLength: 5 } },
            ],
          },
        },
        {
          fieldName: "tags",
          fieldType: "array" as const,
          options: {
            nested: [{ fieldName: "tag", fieldType: "string" as const, options: { minLength: 3, maxLength: 10 } }],
          },
        },
      ],
    };
    const a = generatePayloads(recursiveConfig);
    const b = generatePayloads(recursiveConfig);
    expect(a.records).toEqual(b.records);
  });

  it("same seed with edge cases produces identical records", () => {
    const edgeConfig = {
      ...config,
      options: { ...config.options, includeEdgeCases: true },
    };
    const a = generatePayloads(edgeConfig);
    const b = generatePayloads(edgeConfig);
    expect(a.records).toEqual(b.records);
  });
});

describe("Schema Intelligence — seed reproducibility", () => {
  const orchestrator = new Orchestrator();
  const schema = JSON.stringify({
    name: "John Doe",
    email: "john@example.com",
    age: 30,
    active: true,
  });

  it("same seed produces identical positive records", () => {
    const configA = { categories: ["positive" as const], recordsPerCategory: 5, seed: SEED };
    const configB = { categories: ["positive" as const], recordsPerCategory: 5, seed: SEED };
    const a = orchestrator.process("json", schema, configA);
    const b = orchestrator.process("json", schema, configB);
    expect(a[0].records).toEqual(b[0].records);
  });

  it("same seed produces identical negative records", () => {
    const configA = { categories: ["negative" as const], recordsPerCategory: 5, seed: SEED };
    const configB = { categories: ["negative" as const], recordsPerCategory: 5, seed: SEED };
    const a = orchestrator.process("json", schema, configA);
    const b = orchestrator.process("json", schema, configB);
    expect(a[0].records).toEqual(b[0].records);
  });

  it("different seed produces different output", () => {
    const a = orchestrator.process("json", schema, { categories: ["positive"], recordsPerCategory: 5, seed: SEED });
    const b = orchestrator.process("json", schema, { categories: ["positive"], recordsPerCategory: 5, seed: DIFFERENT_SEED });
    expect(a[0].records).not.toEqual(b[0].records);
  });
});

describe("Concurrent operations — isolation", () => {
  it("two seeded generators with different seeds do not interfere", () => {
    const configA = {
      count: 20, locale: "en",
      fields: { firstName: true, lastName: true, email: false, phone: false, dateOfBirth: false, age: false, gender: false, username: false, password: false, avatar: false, ssn: false },
      options: { ageRange: { min: 18, max: 85 }, emailDomains: [] as string[], passwordLength: 12, seed: 111 },
    };
    const configB = { ...configA, options: { ...configA.options, seed: 222 } };

    const a1 = stripMeta(generateUsers(configA));
    const b1 = stripMeta(generateUsers(configB));
    const a2 = stripMeta(generateUsers(configA));
    const b2 = stripMeta(generateUsers(configB));

    expect(a1).toEqual(a2);
    expect(b1).toEqual(b2);
    expect(a1).not.toEqual(b1);
  });
});

describe("Export does not mutate records", () => {
  it("records are identical before and after export", () => {
    const result = generateUsers({
      count: 5, locale: "en",
      fields: { firstName: true, lastName: true, email: true, phone: false, dateOfBirth: false, age: false, gender: false, username: false, password: false, avatar: false, ssn: false },
      options: { ageRange: { min: 18, max: 85 }, emailDomains: [], passwordLength: 12, seed: SEED },
    });

    const recordsBefore = JSON.parse(JSON.stringify(result.records));

    exportData({
      data: result.records as unknown as Record<string, unknown>[],
      format: "json",
      options: {},
    });
    exportData({
      data: result.records as unknown as Record<string, unknown>[],
      format: "csv",
      options: {},
    });

    expect(result.records).toEqual(recordsBefore);
  });
});
