import { describe, it, expect } from "vitest";
import { FieldClassifier } from "@/core/engines/field-classification";
import type { FieldDescriptor } from "@/core/engines/types";

const classifier = new FieldClassifier();

function makeField(name: string, dataType = "string", constraints = {}): FieldDescriptor {
  return {
    name,
    originalName: name,
    dataType,
    semanticType: "unknown",
    confidence: 0,
    constraints,
  };
}

describe("FieldClassifier - Canonical Fields", () => {
  const cases: Array<{ field: string; expected: string; dataType?: string }> = [
    { field: "firstName", expected: "first_name" },
    { field: "first_name", expected: "first_name" },
    { field: "lastName", expected: "last_name" },
    { field: "email", expected: "email" },
    { field: "email_address", expected: "email" },
    { field: "phone", expected: "phone" },
    { field: "phone_number", expected: "phone" },
    { field: "dateOfBirth", expected: "dob" },
    { field: "date_of_birth", expected: "dob" },
    { field: "age", expected: "age", dataType: "integer" },
    { field: "ssn", expected: "ssn" },
    { field: "street", expected: "street" },
    { field: "streetAddress", expected: "street" },
    { field: "city", expected: "city" },
    { field: "zipCode", expected: "zipcode" },
    { field: "postal_code", expected: "zipcode" },
    { field: "country", expected: "country" },
    { field: "iban", expected: "iban" },
    { field: "swift", expected: "swift_code" },
    { field: "routingNumber", expected: "routing_number" },
    { field: "cardNumber", expected: "credit_card_number" },
    { field: "cvv", expected: "credit_card_cvv" },
    { field: "amount", expected: "amount" },
    { field: "currency", expected: "currency" },
    { field: "url", expected: "url" },
    { field: "password", expected: "password" },
    { field: "username", expected: "username" },
    { field: "company", expected: "company" },
  ];

  for (const { field, expected, dataType } of cases) {
    it(`classifies "${field}" as "${expected}"`, () => {
      const result = classifier.classify(makeField(field, dataType));
      expect(result.semanticType).toBe(expected);
      expect(result.confidence).toBeGreaterThan(0);
    });
  }
});

describe("FieldClassifier - Confidence Levels", () => {
  it("has high confidence for exact matches", () => {
    const result = classifier.classify(makeField("email"));
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("has lower confidence for unknown fields", () => {
    const result = classifier.classify(makeField("xyzzy_field_123"));
    expect(result.confidence).toBeLessThanOrEqual(0.5);
  });
});

describe("FieldClassifier - Fallback Behavior", () => {
  it("falls back to string or unknown for unrecognizable fields", () => {
    const result = classifier.classify(makeField("qwerty_asdf"));
    expect(["unknown", "string"]).toContain(result.semanticType);
    expect(result.confidence).toBeLessThanOrEqual(0.5);
  });
});

describe("FieldClassifier - Ambiguous Fields", () => {
  it('"name" is classified with reduced confidence (< 0.7)', () => {
    const result = classifier.classify(makeField("name"));
    expect(result.confidence).toBeLessThan(0.7);
  });

  it('"title" is classified with reduced confidence (< 0.7)', () => {
    const result = classifier.classify(makeField("title"));
    expect(result.confidence).toBeLessThan(0.7);
  });

  it('"state" is classified with reduced confidence (< 0.7)', () => {
    const result = classifier.classify(makeField("state"));
    expect(result.confidence).toBeLessThan(0.7);
  });

  it('"firstName" still has high confidence (>= 0.5)', () => {
    const result = classifier.classify(makeField("firstName"));
    expect(result.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it('"email" still has high confidence (>= 0.5)', () => {
    const result = classifier.classify(makeField("email"));
    expect(result.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it("classification includes confidenceLevel metadata", () => {
    const highResult = classifier.classify(makeField("email"));
    expect(highResult.metadata).toBeDefined();
    expect(highResult.metadata!.confidenceLevel).toBe("high");

    const lowResult = classifier.classify(makeField("name"));
    expect(lowResult.metadata).toBeDefined();
    expect(["medium", "low"]).toContain(lowResult.metadata!.confidenceLevel);
  });
});

describe("FieldClassifier - classifyAll", () => {
  it("classifies multiple fields", () => {
    const fields = [
      makeField("firstName"),
      makeField("email"),
      makeField("age", "integer"),
    ];
    const results = classifier.classifyAll(fields);
    expect(results).toHaveLength(3);
    expect(results[0].semanticType).toBe("first_name");
    expect(results[1].semanticType).toBe("email");
  });
});
