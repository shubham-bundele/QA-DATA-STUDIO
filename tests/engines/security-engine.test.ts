import { describe, it, expect } from "vitest";
import { SecurityEngine } from "@/core/engines/security-engine";
import type { FieldDescriptor } from "@/core/engines/types";

const engine = new SecurityEngine();

function makeField(name: string, semanticType: string): FieldDescriptor {
  return {
    name,
    originalName: name,
    dataType: "string",
    semanticType: semanticType as FieldDescriptor["semanticType"],
    confidence: 1,
    constraints: {},
  };
}

describe("SecurityEngine", () => {
  it("generates SQL injection payloads for string fields", () => {
    const payloads = engine.generate(makeField("name", "first_name"));
    const strings = payloads.filter(p => typeof p === "string") as string[];
    expect(strings.some(s => s.includes("OR") || s.includes("DROP") || s.includes("UNION"))).toBe(true);
  });

  it("generates XSS payloads for string fields", () => {
    const payloads = engine.generate(makeField("name", "first_name"));
    const strings = payloads.filter(p => typeof p === "string") as string[];
    expect(strings.some(s => s.includes("<script>") || s.includes("onerror"))).toBe(true);
  });

  it("generates command injection payloads for URL fields", () => {
    const payloads = engine.generate(makeField("website", "url"));
    expect(payloads.length).toBeGreaterThan(10);
  });

  it("generates payloads for email fields", () => {
    const payloads = engine.generate(makeField("email", "email"));
    expect(payloads.length).toBeGreaterThan(10);
  });

  it("generates payloads for numeric fields", () => {
    const payloads = engine.generate(makeField("age", "integer"));
    expect(payloads.length).toBeGreaterThan(5);
  });

  it("generates payloads for unknown fields", () => {
    const payloads = engine.generate(makeField("custom", "unknown"));
    expect(payloads.length).toBeGreaterThan(5);
  });

  it("payloads are strings or primitives, not executable objects", () => {
    const payloads = engine.generate(makeField("test", "string"));
    for (const payload of payloads) {
      expect(typeof payload).not.toBe("function");
      expect(typeof payload).not.toBe("object");
    }
  });

  it("getAllPayloads returns categorized payloads", () => {
    const all = engine.getAllPayloads();
    expect(Object.keys(all).length).toBeGreaterThanOrEqual(5);
    let total = 0;
    for (const [, payloads] of Object.entries(all)) {
      total += (payloads as unknown[]).length;
    }
    expect(total).toBeGreaterThan(80);
  });
});
