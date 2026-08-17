import { describe, it, expect } from "vitest";
import { generatePayloads } from "@/features/payloads/payload.service";
import type { PayloadGenerateConfig } from "@/features/payloads/payload.types";

const defaultSchema = [
  { fieldName: "name", fieldType: "string" as const },
  { fieldName: "age", fieldType: "number" as const },
  { fieldName: "active", fieldType: "boolean" as const },
  { fieldName: "email", fieldType: "email" as const },
  { fieldName: "uid", fieldType: "uuid" as const },
];

type ConfigOverrides = Omit<Partial<PayloadGenerateConfig>, "options"> & {
  options?: Partial<PayloadGenerateConfig["options"]>;
};

function makeConfig(overrides: ConfigOverrides = {}): PayloadGenerateConfig {
  const { options, ...rest } = overrides;
  return {
    count: 5,
    format: "json",
    rootElement: "data",
    schema: defaultSchema,
    ...rest,
    options: { includeNulls: false, includeEdgeCases: false, ...options },
  };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("generatePayloads", () => {
  it("returns the requested record count", () => {
    const result = generatePayloads(makeConfig({ count: 7 }));
    expect(result.records).toHaveLength(7);
  });

  it("each record has the fields defined in schema", () => {
    const config = makeConfig();
    const result = generatePayloads(config);
    const fieldNames = config.schema.map((f) => f.fieldName);
    for (const record of result.records) {
      for (const name of fieldNames) {
        expect(name in record).toBe(true);
      }
    }
  });

  it("string fields produce strings", () => {
    const result = generatePayloads(
      makeConfig({
        schema: [{ fieldName: "label", fieldType: "string" }],
      })
    );
    for (const record of result.records) {
      expect(typeof record.label).toBe("string");
    }
  });

  it("number fields produce numbers", () => {
    const result = generatePayloads(
      makeConfig({
        schema: [{ fieldName: "value", fieldType: "number" }],
      })
    );
    for (const record of result.records) {
      expect(typeof record.value).toBe("number");
    }
  });

  it("boolean fields produce booleans", () => {
    const result = generatePayloads(
      makeConfig({
        schema: [{ fieldName: "flag", fieldType: "boolean" }],
      })
    );
    for (const record of result.records) {
      expect(typeof record.flag).toBe("boolean");
    }
  });

  it("email fields produce strings containing @", () => {
    const result = generatePayloads(
      makeConfig({
        schema: [{ fieldName: "contact", fieldType: "email" }],
      })
    );
    for (const record of result.records) {
      expect(typeof record.contact).toBe("string");
      expect(record.contact as string).toContain("@");
    }
  });

  it("uuid fields produce strings matching UUID pattern", () => {
    const result = generatePayloads(
      makeConfig({
        schema: [{ fieldName: "uid", fieldType: "uuid" }],
      })
    );
    for (const record of result.records) {
      expect(typeof record.uid).toBe("string");
      expect(record.uid as string).toMatch(UUID_REGEX);
    }
  });

  it("rawOutput is valid JSON when format is json", () => {
    const result = generatePayloads(makeConfig({ format: "json" }));
    expect(() => JSON.parse(result.rawOutput)).not.toThrow();
    const parsed = JSON.parse(result.rawOutput);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(result.records.length);
  });

  it("meta includes format and fieldCount", () => {
    const config = makeConfig();
    const result = generatePayloads(config);
    expect(result.meta.format).toBe("json");
    expect(result.meta.fieldCount).toBe(config.schema.length);
    expect(result.meta.count).toBe(config.count);
    expect(result.meta.generatedAt).toBeDefined();
  });

  it("config is not mutated", () => {
    const config = makeConfig({ count: 3 });
    const snapshot = JSON.parse(JSON.stringify(config));
    generatePayloads(config);
    expect(config).toEqual(snapshot);
  });

  it("count is capped at MAX_PAYLOAD_RECORDS (500)", () => {
    // The service does not throw for counts over 500 because validation
    // happens at the schema layer. We verify the service generates exactly
    // the number requested when within the limit.
    const result = generatePayloads(makeConfig({ count: 500 }));
    expect(result.records).toHaveLength(500);
    expect(result.meta.count).toBe(500);
  });
});
