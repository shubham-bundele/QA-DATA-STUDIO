import { describe, it, expect } from "vitest";
import { SchemaDetector } from "@/core/engines/schema-detection";

const detector = new SchemaDetector();

describe("SchemaDetector - JSON Schema", () => {
  it("extracts properties with types", () => {
    const schema = detector.detect("json-schema", JSON.stringify({
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "integer" },
      },
    }));
    expect(schema.fields).toHaveLength(2);
    expect(schema.fields[0].name).toBe("name");
    expect(schema.fields[0].dataType).toBe("string");
    expect(schema.fields[1].name).toBe("age");
    expect(schema.fields[1].dataType).toBe("integer");
  });

  it("extracts required fields", () => {
    const schema = detector.detect("json-schema", JSON.stringify({
      type: "object",
      required: ["email"],
      properties: {
        email: { type: "string" },
        phone: { type: "string" },
      },
    }));
    const emailField = schema.fields.find(f => f.name === "email");
    const phoneField = schema.fields.find(f => f.name === "phone");
    expect(emailField?.constraints.required).toBe(true);
    expect(phoneField?.constraints.required).toBeFalsy();
  });

  it("extracts format constraint", () => {
    const schema = detector.detect("json-schema", JSON.stringify({
      type: "object",
      properties: {
        email: { type: "string", format: "email" },
      },
    }));
    expect(schema.fields[0].constraints.format).toBe("email");
  });

  it("extracts numeric constraints", () => {
    const schema = detector.detect("json-schema", JSON.stringify({
      type: "object",
      properties: {
        age: { type: "integer", minimum: 0, maximum: 150 },
      },
    }));
    expect(schema.fields[0].constraints.min).toBe(0);
    expect(schema.fields[0].constraints.max).toBe(150);
  });

  it("extracts string length constraints", () => {
    const schema = detector.detect("json-schema", JSON.stringify({
      type: "object",
      properties: {
        name: { type: "string", minLength: 1, maxLength: 50 },
      },
    }));
    expect(schema.fields[0].constraints.minLength).toBe(1);
    expect(schema.fields[0].constraints.maxLength).toBe(50);
  });

  it("extracts pattern constraint", () => {
    const schema = detector.detect("json-schema", JSON.stringify({
      type: "object",
      properties: {
        zip: { type: "string", pattern: "^\\d{5}$" },
      },
    }));
    expect(schema.fields[0].constraints.pattern).toBe("^\\d{5}$");
  });

  it("extracts enum values", () => {
    const schema = detector.detect("json-schema", JSON.stringify({
      type: "object",
      properties: {
        status: { type: "string", enum: ["active", "inactive"] },
      },
    }));
    expect(schema.fields[0].constraints.enum).toEqual(["active", "inactive"]);
  });

  it("handles empty schema", () => {
    const schema = detector.detect("json-schema", JSON.stringify({
      type: "object",
      properties: {},
    }));
    expect(schema.fields).toHaveLength(0);
  });

  it("handles invalid JSON", () => {
    const schema = detector.detect("json-schema", "not valid json {{{");
    expect(schema.fields).toHaveLength(0);
  });

  it("handles empty string", () => {
    const schema = detector.detect("json-schema", "");
    expect(schema.fields).toHaveLength(0);
  });
});

describe("SchemaDetector - Raw JSON", () => {
  it("infers fields from object array", () => {
    const schema = detector.detect("json", JSON.stringify([
      { name: "John", age: 30, active: true },
    ]));
    expect(schema.fields.length).toBeGreaterThanOrEqual(3);
    const nameField = schema.fields.find(f => f.name === "name");
    expect(nameField).toBeDefined();
    expect(nameField?.dataType).toBe("string");
  });

  it("infers fields from single object", () => {
    const schema = detector.detect("json", JSON.stringify({
      email: "test@example.com",
      count: 42,
    }));
    expect(schema.fields.length).toBeGreaterThanOrEqual(2);
  });

  it("collects sample values", () => {
    const schema = detector.detect("json", JSON.stringify([
      { email: "a@b.com" },
      { email: "c@d.com" },
    ]));
    const emailField = schema.fields.find(f => f.name === "email");
    expect(emailField?.samples).toBeDefined();
    expect(emailField!.samples!.length).toBeGreaterThan(0);
  });

  it("handles empty array", () => {
    const schema = detector.detect("json", "[]");
    expect(schema.fields).toHaveLength(0);
  });
});

describe("SchemaDetector - SQL", () => {
  it("parses CREATE TABLE", () => {
    const schema = detector.detect("sql", `
      CREATE TABLE users (
        id INT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        email VARCHAR(254) UNIQUE NOT NULL,
        age INT,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);
    expect(schema.fields.length).toBeGreaterThanOrEqual(4);
    const nameField = schema.fields.find(f => f.name === "first_name");
    expect(nameField).toBeDefined();
    expect(nameField?.constraints.required).toBe(true);
    expect(nameField?.constraints.maxLength).toBe(50);
  });

  it("extracts UNIQUE constraint", () => {
    const schema = detector.detect("sql", `
      CREATE TABLE t (email VARCHAR(254) UNIQUE NOT NULL);
    `);
    const emailField = schema.fields.find(f => f.name === "email");
    expect(emailField?.constraints.unique).toBe(true);
  });

  it("extracts DEFAULT values", () => {
    const schema = detector.detect("sql", `
      CREATE TABLE t (status VARCHAR(20) DEFAULT 'active');
    `);
    const statusField = schema.fields.find(f => f.name === "status");
    expect(statusField?.constraints.default).toBeDefined();
  });

  it("handles empty SQL", () => {
    const schema = detector.detect("sql", "");
    expect(schema.fields).toHaveLength(0);
  });

  it("handles invalid SQL", () => {
    const schema = detector.detect("sql", "SELECT * FROM users");
    expect(schema.fields).toHaveLength(0);
  });
});

describe("SchemaDetector - CSV", () => {
  it("extracts headers", () => {
    const schema = detector.detect("csv", "name,email,age\nJohn,j@t.com,30");
    expect(schema.fields.length).toBeGreaterThanOrEqual(3);
    expect(schema.fields.map(f => f.name)).toContain("name");
    expect(schema.fields.map(f => f.name)).toContain("email");
  });

  it("handles header-only CSV", () => {
    const schema = detector.detect("csv", "name,email,age");
    expect(schema.fields.length).toBeGreaterThanOrEqual(3);
  });

  it("collects sample values from data rows", () => {
    const schema = detector.detect("csv", "email\ntest@example.com\nother@example.com");
    const emailField = schema.fields.find(f => f.name === "email");
    expect(emailField?.samples).toBeDefined();
    expect(emailField!.samples!.length).toBeGreaterThan(0);
  });

  it("handles empty CSV", () => {
    const schema = detector.detect("csv", "");
    expect(schema.fields).toHaveLength(0);
  });
});
