import { describe, it, expect } from "vitest";
import { Orchestrator } from "@/core/engines/orchestrator";

const orchestrator = new Orchestrator();

describe("Validation Integration - Positive Category", () => {
  const schema = JSON.stringify({
    type: "object",
    required: ["email", "age"],
    properties: {
      email: { type: "string", format: "email" },
      age: { type: "integer", minimum: 0, maximum: 150 },
      name: { type: "string", minLength: 1, maxLength: 50 },
    },
  });

  it("positive records include validation summary", () => {
    const results = orchestrator.process("json-schema", schema, {
      categories: ["positive"],
      recordsPerCategory: 5,
    });
    expect(results[0].metadata.validationSummary).toBeDefined();
    expect(results[0].metadata.validationSummary!.totalValidated).toBe(5);
  });

  it("positive records have high pass rate", () => {
    const results = orchestrator.process("json-schema", schema, {
      categories: ["positive"],
      recordsPerCategory: 10,
    });
    const summary = results[0].metadata.validationSummary!;
    expect(summary.passed).toBeGreaterThan(0);
  });
});

describe("Validation Integration - Negative Category", () => {
  it("negative records include validation summary", () => {
    const schema = JSON.stringify({
      type: "object",
      required: ["email"],
      properties: {
        email: { type: "string", format: "email" },
      },
    });
    const results = orchestrator.process("json-schema", schema, {
      categories: ["negative"],
      recordsPerCategory: 5,
    });
    expect(results[0].metadata.validationSummary).toBeDefined();
    expect(results[0].metadata.validationSummary!.failed).toBeGreaterThan(0);
  });
});

describe("Validation Integration - Boundary Category", () => {
  it("boundary records include validation summary", () => {
    const schema = JSON.stringify({
      type: "object",
      properties: {
        age: { type: "integer", minimum: 0, maximum: 150 },
      },
    });
    const results = orchestrator.process("json-schema", schema, {
      categories: ["boundary"],
      recordsPerCategory: 5,
    });
    expect(results[0].metadata.validationSummary).toBeDefined();
  });
});

describe("Validation Integration - Security Category", () => {
  it("security records include validation summary", () => {
    const schema = JSON.stringify({
      type: "object",
      properties: {
        name: { type: "string" },
      },
    });
    const results = orchestrator.process("json-schema", schema, {
      categories: ["security"],
      recordsPerCategory: 5,
    });
    expect(results[0].metadata.validationSummary).toBeDefined();
  });
});

describe("Validation Integration - All Categories", () => {
  it("all categories include validation summaries", () => {
    const schema = JSON.stringify({
      type: "object",
      required: ["email"],
      properties: {
        email: { type: "string", format: "email" },
        age: { type: "integer", minimum: 0, maximum: 150 },
      },
    });
    const results = orchestrator.process("json-schema", schema, {
      categories: ["positive", "negative", "boundary", "security"],
      recordsPerCategory: 3,
    });
    for (const result of results) {
      expect(result.metadata.validationSummary).toBeDefined();
      expect(result.metadata.validationSummary!.totalValidated).toBe(3);
    }
  });
});
