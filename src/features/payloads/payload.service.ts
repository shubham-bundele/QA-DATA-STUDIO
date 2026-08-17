import { faker, Faker, en } from "@faker-js/faker";
import { generateId, randomInt, randomFloat, randomPick, createRng, type SeededRandom } from "@/core/utils/random";
import { MAX_NESTED_DEPTH } from "@/core/constants/limits";
import type {
  PayloadFieldDefinition,
  PayloadGenerateConfig,
  PayloadGenerateResult,
} from "./payload.types";

const EDGE_CASES = {
  string: ["", " ", "null", "undefined", "<script>alert(1)</script>", "' OR 1=1 --", " ", "a".repeat(1000)],
  number: [0, -1, -0.001, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 0.1 + 0.2],
  integer: [0, -1, 2147483647, -2147483648],
};

function generateFieldValue(
  field: PayloadFieldDefinition,
  f: typeof faker,
  rng?: SeededRandom,
  depth: number = 0
): unknown {
  if (field.options?.nullable) {
    const roll = rng ? rng.next() : Math.random();
    if (roll < 0.15) return null;
  }

  const opts = field.options ?? {};

  switch (field.fieldType) {
    case "string": {
      const minLen = opts.minLength ?? 1;
      const maxLen = opts.maxLength ?? 20;
      const len = randomInt(minLen, maxLen, rng);
      return f.string.alpha(len);
    }
    case "number":
      return randomFloat(opts.min ?? 0, opts.max ?? 1000, 2, rng);
    case "integer":
      return randomInt(opts.min ?? 0, opts.max ?? 1000, rng);
    case "boolean":
      return rng ? rng.boolean() : Math.random() > 0.5;
    case "date":
      return f.date.recent({ days: 365 }).toISOString().split("T")[0];
    case "datetime":
      return f.date.recent({ days: 365 }).toISOString();
    case "email":
      return f.internet.email();
    case "phone":
      return f.phone.number();
    case "url":
      return f.internet.url();
    case "uuid":
      return generateId(rng);
    case "ip":
      return f.internet.ip();
    case "name":
      return f.person.fullName();
    case "address":
      return f.location.streetAddress(true);
    case "paragraph":
      return f.lorem.paragraph();
    case "enum":
      return opts.enum && opts.enum.length > 0
        ? randomPick(opts.enum, rng)
        : "unknown";
    case "object": {
      if (depth >= MAX_NESTED_DEPTH || !opts.nested) return {};
      const obj: Record<string, unknown> = {};
      for (const nestedField of opts.nested) {
        obj[nestedField.fieldName] = generateFieldValue(nestedField, f, rng, depth + 1);
      }
      return obj;
    }
    case "array": {
      if (depth >= MAX_NESTED_DEPTH || !opts.nested) return [];
      const arrayLen = randomInt(1, 5, rng);
      return Array.from({ length: arrayLen }, () => {
        if (opts.nested && opts.nested.length === 1) {
          return generateFieldValue(opts.nested[0], f, rng, depth + 1);
        }
        const obj: Record<string, unknown> = {};
        for (const nestedField of opts.nested!) {
          obj[nestedField.fieldName] = generateFieldValue(nestedField, f, rng, depth + 1);
        }
        return obj;
      });
    }
    default:
      return null;
  }
}

function applyEdgeCases(
  record: Record<string, unknown>,
  schema: PayloadFieldDefinition[],
  rng?: SeededRandom
): void {
  const fieldIndex = randomInt(0, schema.length - 1, rng);
  const field = schema[fieldIndex];
  const fieldType = field.fieldType;

  if (fieldType === "string") {
    record[field.fieldName] = randomPick(EDGE_CASES.string, rng);
  } else if (fieldType === "number") {
    record[field.fieldName] = randomPick(EDGE_CASES.number, rng);
  } else if (fieldType === "integer") {
    record[field.fieldName] = randomPick(EDGE_CASES.integer, rng);
  }
}

function recordsToXml(records: Record<string, unknown>[], rootElement: string): string {
  const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>'];
  lines.push(`<${rootElement}>`);

  for (const record of records) {
    lines.push("  <record>");
    for (const [key, value] of Object.entries(record)) {
      lines.push(valueToXml(key, value, 4));
    }
    lines.push("  </record>");
  }

  lines.push(`</${rootElement}>`);
  return lines.join("\n");
}

function valueToXml(key: string, value: unknown, indent: number): string {
  const pad = " ".repeat(indent);
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");

  if (value === null || value === undefined) {
    return `${pad}<${safeKey} xsi:nil="true"/>`;
  }
  if (Array.isArray(value)) {
    const items = value.map((item) => {
      if (typeof item === "object" && item !== null) {
        const nested = Object.entries(item as Record<string, unknown>)
          .map(([k, v]) => valueToXml(k, v, indent + 4))
          .join("\n");
        return `${pad}  <item>\n${nested}\n${pad}  </item>`;
      }
      return `${pad}  <item>${escapeXml(String(item))}</item>`;
    });
    return `${pad}<${safeKey}>\n${items.join("\n")}\n${pad}</${safeKey}>`;
  }
  if (typeof value === "object") {
    const nested = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => valueToXml(k, v, indent + 2))
      .join("\n");
    return `${pad}<${safeKey}>\n${nested}\n${pad}</${safeKey}>`;
  }
  return `${pad}<${safeKey}>${escapeXml(String(value))}</${safeKey}>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generatePayloads(
  config: PayloadGenerateConfig
): PayloadGenerateResult {
  const rng = createRng(config.options.seed);
  const f = rng
    ? new Faker({ locale: [en], randomizer: { next: () => rng.next(), seed: () => {} } })
    : faker;

  if (!rng && config.options.seed !== undefined) {
    faker.seed(config.options.seed);
  }

  const records: Record<string, unknown>[] = [];

  for (let i = 0; i < config.count; i++) {
    const record: Record<string, unknown> = {};

    for (const field of config.schema) {
      record[field.fieldName] = generateFieldValue(field, f, rng);
    }

    if (config.options.includeEdgeCases) {
      const roll = rng ? rng.next() : Math.random();
      if (roll < 0.3) {
        applyEdgeCases(record, config.schema, rng);
      }
    }

    records.push(record);
  }

  const rawOutput =
    config.format === "xml"
      ? recordsToXml(records, config.rootElement)
      : JSON.stringify(records, null, 2);

  if (!rng && config.options.seed !== undefined) {
    faker.seed();
  }

  return {
    records,
    rawOutput,
    meta: {
      count: records.length,
      generatedAt: new Date().toISOString(),
      format: config.format,
      fieldCount: config.schema.length,
      seed: config.options.seed,
    },
  };
}
