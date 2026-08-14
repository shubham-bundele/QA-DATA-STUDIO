import { describe, it, expect } from "vitest";
import { generateUsers } from "@/features/users/user.service";
import type { UserGenerateConfig } from "@/features/users/user.types";

const defaultFields = {
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  dateOfBirth: false,
  age: false,
  gender: false,
  username: false,
  password: false,
  avatar: false,
  ssn: false,
};

const defaultOptions = {
  ageRange: { min: 18, max: 85 },
  emailDomains: [] as string[],
  passwordLength: 12,
};

type ConfigOverrides = Omit<Partial<UserGenerateConfig>, "fields" | "options"> & {
  fields?: Partial<UserGenerateConfig["fields"]>;
  options?: Partial<UserGenerateConfig["options"]>;
};

function makeConfig(overrides: ConfigOverrides = {}): UserGenerateConfig {
  const { fields, options, ...rest } = overrides;
  return {
    count: 5,
    locale: "en",
    ...rest,
    fields: { ...defaultFields, ...fields },
    options: { ...defaultOptions, ...options },
  };
}

describe("generateUsers", () => {
  it("returns the requested number of records", () => {
    const result = generateUsers(makeConfig({ count: 5 }));
    expect(result.records).toHaveLength(5);
  });

  it("records contain required fields when enabled", () => {
    const result = generateUsers(makeConfig());
    for (const record of result.records) {
      expect(record).toHaveProperty("id");
      expect(record.firstName).toBeDefined();
      expect(record.lastName).toBeDefined();
      expect(record.email).toBeDefined();
      expect(record.phone).toBeDefined();
    }
  });

  it("email format contains @", () => {
    const result = generateUsers(makeConfig());
    for (const record of result.records) {
      expect(record.email).toContain("@");
    }
  });

  it("SSN is a non-empty numeric string when enabled", () => {
    const result = generateUsers(
      makeConfig({ fields: { ssn: true } })
    );
    for (const record of result.records) {
      expect(record.ssn).toBeDefined();
      expect(typeof record.ssn).toBe("string");
      expect(record.ssn!.length).toBeGreaterThan(0);
      // faker.string.numeric produces digits (and possibly dashes)
      expect(record.ssn).toMatch(/^[\d-]+$/);
    }
  });

  it("password meets minimum length when enabled", () => {
    const passwordLength = 16;
    const result = generateUsers(
      makeConfig({
        fields: { password: true },
        options: { passwordLength },
      })
    );
    for (const record of result.records) {
      expect(record.password).toBeDefined();
      expect(record.password!.length).toBeGreaterThanOrEqual(passwordLength);
    }
  });

  it("age is within configured range when enabled", () => {
    const min = 25;
    const max = 40;
    const result = generateUsers(
      makeConfig({
        count: 20,
        fields: { age: true },
        options: { ageRange: { min, max } },
      })
    );
    for (const record of result.records) {
      expect(record.age).toBeDefined();
      expect(record.age).toBeGreaterThanOrEqual(min);
      expect(record.age).toBeLessThanOrEqual(max);
    }
  });

  it("meta includes count and generatedAt", () => {
    const result = generateUsers(makeConfig({ count: 3 }));
    expect(result.meta.count).toBe(3);
    expect(result.meta.generatedAt).toBeDefined();
    expect(typeof result.meta.generatedAt).toBe("string");
  });

  it("config object is not mutated after generation", () => {
    const config = makeConfig({ count: 5 });
    const snapshot = JSON.parse(JSON.stringify(config));
    generateUsers(config);
    expect(config).toEqual(snapshot);
  });

  it("count of 1 works (boundary)", () => {
    const result = generateUsers(makeConfig({ count: 1 }));
    expect(result.records).toHaveLength(1);
    expect(result.meta.count).toBe(1);
  });

  it("all enabled fields are present, disabled fields are absent", () => {
    const result = generateUsers(
      makeConfig({
        fields: {
          firstName: true,
          lastName: false,
          email: true,
          phone: false,
          dateOfBirth: false,
          age: false,
          gender: false,
          username: false,
          password: false,
          avatar: false,
          ssn: false,
        },
      })
    );
    for (const record of result.records) {
      expect(record.firstName).toBeDefined();
      expect(record.email).toBeDefined();
      expect(record.lastName).toBeUndefined();
      expect(record.phone).toBeUndefined();
      expect(record.ssn).toBeUndefined();
      expect(record.password).toBeUndefined();
    }
  });
});
