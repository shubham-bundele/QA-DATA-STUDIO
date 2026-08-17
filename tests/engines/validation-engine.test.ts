import { describe, it, expect } from "vitest";
import { ValidationEngine } from "@/core/engines/validation-engine";
import type { FieldDescriptor } from "@/core/engines/types";

const engine = new ValidationEngine();

function makeField(name: string, constraints = {}, dataType = "string"): FieldDescriptor {
  return {
    name,
    originalName: name,
    dataType,
    semanticType: "string",
    confidence: 1,
    constraints,
  };
}

describe("ValidationEngine - required", () => {
  it("fails when required field is null", () => {
    const result = engine.validate(null, makeField("email", { required: true }));
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("passes when required field has value", () => {
    const result = engine.validate("test@example.com", makeField("email", { required: true }));
    expect(result.valid).toBe(true);
  });
});

describe("ValidationEngine - minLength/maxLength", () => {
  it("fails when string is too short", () => {
    const result = engine.validate("a", makeField("name", { minLength: 3 }));
    expect(result.valid).toBe(false);
  });

  it("fails when string is too long", () => {
    const result = engine.validate("a".repeat(100), makeField("name", { maxLength: 50 }));
    expect(result.valid).toBe(false);
  });

  it("passes when string is in range", () => {
    const result = engine.validate("hello", makeField("name", { minLength: 1, maxLength: 50 }));
    expect(result.valid).toBe(true);
  });
});

describe("ValidationEngine - min/max", () => {
  it("fails when number is below min", () => {
    const result = engine.validate(-1, makeField("age", { min: 0 }, "integer"));
    expect(result.valid).toBe(false);
  });

  it("fails when number is above max", () => {
    const result = engine.validate(200, makeField("age", { max: 150 }, "integer"));
    expect(result.valid).toBe(false);
  });
});

describe("ValidationEngine - enum", () => {
  it("fails when value not in enum", () => {
    const result = engine.validate("invalid", makeField("status", { enum: ["active", "inactive"] }));
    expect(result.valid).toBe(false);
  });

  it("passes when value in enum", () => {
    const result = engine.validate("active", makeField("status", { enum: ["active", "inactive"] }));
    expect(result.valid).toBe(true);
  });
});

describe("ValidationEngine - pattern", () => {
  it("fails when value doesn't match pattern", () => {
    const result = engine.validate("abc", makeField("zip", { pattern: "^\\d{5}$" }));
    expect(result.valid).toBe(false);
  });

  it("passes when value matches pattern", () => {
    const result = engine.validate("12345", makeField("zip", { pattern: "^\\d{5}$" }));
    expect(result.valid).toBe(true);
  });
});

describe("ValidationEngine - format", () => {
  it("validates email format", () => {
    const valid = engine.validate("test@example.com", makeField("email", { format: "email" }));
    expect(valid.valid).toBe(true);
    const invalid = engine.validate("not-email", makeField("email", { format: "email" }));
    expect(invalid.valid).toBe(false);
  });

  it("validates date format", () => {
    const valid = engine.validate("2024-01-15", makeField("dob", { format: "date" }));
    expect(valid.valid).toBe(true);
    const invalid = engine.validate("not-date", makeField("dob", { format: "date" }));
    expect(invalid.valid).toBe(false);
  });

  it("validates uuid format", () => {
    const valid = engine.validate("550e8400-e29b-41d4-a716-446655440000", makeField("id", { format: "uuid" }));
    expect(valid.valid).toBe(true);
    const invalid = engine.validate("not-uuid", makeField("id", { format: "uuid" }));
    expect(invalid.valid).toBe(false);
  });
});

describe("ValidationEngine - validateRecord", () => {
  it("validates a complete record", () => {
    const fields = [
      makeField("email", { required: true, format: "email" }),
      makeField("age", { min: 0, max: 150 }, "integer"),
    ];
    const result = engine.validateRecord(
      { email: "test@example.com", age: 30 },
      fields
    );
    expect(result.valid).toBe(true);
  });

  it("reports errors for invalid record", () => {
    const fields = [
      makeField("email", { required: true, format: "email" }),
    ];
    const result = engine.validateRecord(
      { email: "not-valid" },
      fields
    );
    expect(result.valid).toBe(false);
  });
});
