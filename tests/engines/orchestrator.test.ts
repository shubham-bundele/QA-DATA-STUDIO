import { describe, it, expect } from "vitest";
import { Orchestrator } from "@/core/engines/orchestrator";

const orchestrator = new Orchestrator();

describe("Orchestrator - JSON Schema Pipeline", () => {
  const userSchema = JSON.stringify({
    type: "object",
    required: ["firstName", "email"],
    properties: {
      firstName: { type: "string", minLength: 1, maxLength: 50 },
      lastName: { type: "string", maxLength: 50 },
      email: { type: "string", format: "email" },
      age: { type: "integer", minimum: 0, maximum: 150 },
      city: { type: "string" },
    },
  });

  it("generates positive records", () => {
    const results = orchestrator.process("json-schema", userSchema, {
      categories: ["positive"],
      recordsPerCategory: 5,
    });
    expect(results).toHaveLength(1);
    expect(results[0].category).toBe("positive");
    expect(results[0].records).toHaveLength(5);
    for (const record of results[0].records) {
      expect(record).toHaveProperty("firstName");
      expect(record).toHaveProperty("email");
    }
  });

  it("generates negative records", () => {
    const results = orchestrator.process("json-schema", userSchema, {
      categories: ["negative"],
      recordsPerCategory: 5,
    });
    expect(results).toHaveLength(1);
    expect(results[0].category).toBe("negative");
    expect(results[0].records).toHaveLength(5);
  });

  it("generates boundary records", () => {
    const results = orchestrator.process("json-schema", userSchema, {
      categories: ["boundary"],
      recordsPerCategory: 5,
    });
    expect(results).toHaveLength(1);
    expect(results[0].category).toBe("boundary");
    expect(results[0].records).toHaveLength(5);
  });

  it("generates security records", () => {
    const results = orchestrator.process("json-schema", userSchema, {
      categories: ["security"],
      recordsPerCategory: 5,
    });
    expect(results).toHaveLength(1);
    expect(results[0].category).toBe("security");
    expect(results[0].records).toHaveLength(5);
    const allValues = results[0].records.flatMap(r => Object.values(r));
    const strings = allValues.filter(v => typeof v === "string") as string[];
    expect(strings.some(s =>
      s.includes("OR") || s.includes("<script>") || s.includes("whoami") || s.includes("../")
    )).toBe(true);
  });

  it("generates all four categories", () => {
    const results = orchestrator.process("json-schema", userSchema, {
      categories: ["positive", "negative", "boundary", "security"],
      recordsPerCategory: 3,
    });
    expect(results).toHaveLength(4);
    expect(results.map(r => r.category)).toEqual(["positive", "negative", "boundary", "security"]);
  });

  it("includes metadata", () => {
    const results = orchestrator.process("json-schema", userSchema, {
      categories: ["positive"],
      recordsPerCategory: 1,
    });
    expect(results[0].metadata.fieldCount).toBeGreaterThan(0);
    expect(results[0].metadata.recordCount).toBe(1);
    expect(results[0].metadata.description).toBeTruthy();
  });
});

describe("Orchestrator - SQL Pipeline", () => {
  const sql = `
    CREATE TABLE users (
      id INT PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      email VARCHAR(254) UNIQUE NOT NULL,
      is_active BOOLEAN DEFAULT TRUE
    );
  `;

  it("parses SQL and generates data", () => {
    const results = orchestrator.process("sql", sql, {
      categories: ["positive"],
      recordsPerCategory: 3,
    });
    expect(results).toHaveLength(1);
    expect(results[0].records).toHaveLength(3);
    expect(results[0].records[0]).toHaveProperty("first_name");
  });
});

describe("Orchestrator - Raw JSON Pipeline", () => {
  const json = JSON.stringify([
    { name: "John", email: "john@test.com", age: 30 },
  ]);

  it("infers schema from JSON and generates data", () => {
    const results = orchestrator.process("json", json, {
      categories: ["positive"],
      recordsPerCategory: 3,
    });
    expect(results).toHaveLength(1);
    expect(results[0].records).toHaveLength(3);
  });
});

describe("Orchestrator - CSV Pipeline", () => {
  const csv = "first_name,email,age\nJohn,john@test.com,30";

  it("parses CSV and generates data", () => {
    const results = orchestrator.process("csv", csv, {
      categories: ["positive"],
      recordsPerCategory: 3,
    });
    expect(results).toHaveLength(1);
    expect(results[0].records).toHaveLength(3);
  });
});

describe("Orchestrator - Empty/Invalid Input", () => {
  it("returns empty for invalid JSON Schema", () => {
    const results = orchestrator.process("json-schema", "not valid", {
      categories: ["positive"],
      recordsPerCategory: 5,
    });
    expect(results).toEqual([]);
  });

  it("returns empty for empty input", () => {
    const results = orchestrator.process("json-schema", "", {
      categories: ["positive"],
      recordsPerCategory: 5,
    });
    expect(results).toEqual([]);
  });
});
