import { describe, it, expect } from "vitest";
import { BoundaryEngine } from "@/core/engines/boundary-engine";
import type { FieldDescriptor } from "@/core/engines/types";

const engine = new BoundaryEngine();

function makeField(name: string, semanticType: string, constraints = {}): FieldDescriptor {
  return {
    name,
    originalName: name,
    dataType: "string",
    semanticType: semanticType as FieldDescriptor["semanticType"],
    confidence: 1,
    constraints,
  };
}

describe("BoundaryEngine", () => {
  it("always includes null and undefined", () => {
    const values = engine.generate(makeField("test", "string"));
    expect(values).toContain(null);
    expect(values).toContain(undefined);
  });

  it("generates integer boundaries", () => {
    const values = engine.generate(makeField("age", "integer", { min: 0, max: 150 }));
    expect(values).toContain(0);
    expect(values).toContain(-1);
    expect(values).toContain(1);
    expect(values.length).toBeGreaterThan(5);
  });

  it("generates string boundaries including empty and long", () => {
    const values = engine.generate(makeField("name", "string", { maxLength: 50 }));
    expect(values).toContain("");
    expect(values.some(v => typeof v === "string" && v.length > 50)).toBe(true);
  });

  it("generates email boundaries", () => {
    const values = engine.generate(makeField("email", "email"));
    expect(values).toContain("@");
    expect(values.some(v => typeof v === "string" && v.includes("@@"))).toBe(true);
    expect(values.length).toBeGreaterThan(10);
  });

  it("generates date boundaries including invalid dates", () => {
    const values = engine.generate(makeField("dob", "date"));
    expect(values).toContain("1970-01-01");
    expect(values).toContain("9999-12-31");
    const strings = values.filter(v => typeof v === "string") as string[];
    expect(strings.some(s => s.includes("02-30") || s.includes("13-01"))).toBe(true);
  });

  it("generates boolean boundaries", () => {
    const values = engine.generate(makeField("active", "boolean"));
    expect(values).toContain(true);
    expect(values).toContain(false);
    expect(values).toContain("true");
    expect(values).toContain("false");
    expect(values).toContain(0);
    expect(values).toContain(1);
  });

  it("generates enum boundaries", () => {
    const values = engine.generate(makeField("status", "enum", { enum: ["A", "B", "C"] }));
    expect(values).toContain("A");
    expect(values).toContain("C");
    expect(values).toContain(null);
  });

  it("generates zipcode boundaries", () => {
    const values = engine.generate(makeField("zip", "zipcode"));
    expect(values.length).toBeGreaterThan(5);
  });

  it("generates credit card boundaries", () => {
    const values = engine.generate(makeField("cc", "credit_card_number"));
    expect(values.length).toBeGreaterThan(5);
  });

  it("counts total unique boundary values across representative types", () => {
    const types = [
      "integer", "float", "string", "email", "phone", "date", "datetime",
      "boolean", "url", "uuid", "ip_address", "zipcode", "ssn",
      "credit_card_number", "credit_card_cvv", "credit_card_expiry",
      "enum", "iban", "mac_address", "currency",
    ];
    let total = 0;
    for (const type of types) {
      const values = engine.generate(makeField("test", type));
      total += values.length;
    }
    expect(total).toBeGreaterThan(150);
  });
});
