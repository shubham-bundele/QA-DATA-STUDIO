import { describe, it, expect } from "vitest";
import { RelationshipEngine } from "@/core/engines/relationship-engine";
import type { FieldDescriptor, RelationshipEdge } from "@/core/engines/types";

const engine = new RelationshipEngine();

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

describe("RelationshipEngine - detect", () => {
  it("detects co-occurrence for address fields", () => {
    const fields = [
      makeField("street", "street"),
      makeField("city", "city"),
      makeField("state", "state"),
      makeField("zipcode", "zipcode"),
    ];
    const edges = engine.detect(fields);
    expect(edges.some(e => e.type === "co_occurrence")).toBe(true);
  });

  it("detects co-occurrence for credit card fields", () => {
    const fields = [
      makeField("cardNumber", "credit_card_number"),
      makeField("cvv", "credit_card_cvv"),
      makeField("expiry", "credit_card_expiry"),
    ];
    const edges = engine.detect(fields);
    expect(edges.some(e => e.type === "co_occurrence")).toBe(true);
  });

  it("detects conditional dependency state->zipcode", () => {
    const fields = [
      makeField("state", "state"),
      makeField("zipcode", "zipcode"),
    ];
    const edges = engine.detect(fields);
    expect(edges.some(e =>
      e.type === "conditional" && e.from === "state" && e.to === "zipcode"
    )).toBe(true);
  });

  it("detects derived field full_name from first_name+last_name", () => {
    const fields = [
      makeField("firstName", "first_name"),
      makeField("lastName", "last_name"),
      makeField("fullName", "full_name"),
    ];
    const edges = engine.detect(fields);
    expect(edges.some(e =>
      e.type === "derived" && e.to === "fullName"
    )).toBe(true);
  });

  it("returns empty for unrelated fields", () => {
    const fields = [
      makeField("x_custom", "unknown"),
      makeField("y_other", "unknown"),
    ];
    const edges = engine.detect(fields);
    expect(edges).toHaveLength(0);
  });

  it("deduplicates edges", () => {
    const fields = [
      makeField("street", "street"),
      makeField("city", "city"),
      makeField("state", "state"),
      makeField("zipcode", "zipcode"),
      makeField("country", "country"),
    ];
    const edges = engine.detect(fields);
    const keys = edges.map(e => `${e.from}|${e.to}|${e.type}`);
    const uniqueKeys = new Set(keys);
    expect(keys.length).toBe(uniqueKeys.size);
  });
});

describe("RelationshipEngine - getDependencyOrder", () => {
  it("orders parents before children", () => {
    const fields = [
      makeField("fullName", "full_name"),
      makeField("firstName", "first_name"),
      makeField("lastName", "last_name"),
    ];
    const edges: RelationshipEdge[] = [
      { from: "firstName", to: "fullName", type: "derived" },
      { from: "lastName", to: "fullName", type: "derived" },
    ];
    const ordered = engine.getDependencyOrder(fields, edges);
    const fullNameIdx = ordered.findIndex(f => f.name === "fullName");
    const firstNameIdx = ordered.findIndex(f => f.name === "firstName");
    const lastNameIdx = ordered.findIndex(f => f.name === "lastName");
    expect(firstNameIdx).toBeLessThan(fullNameIdx);
    expect(lastNameIdx).toBeLessThan(fullNameIdx);
  });

  it("handles no edges (returns all fields)", () => {
    const fields = [
      makeField("a", "string"),
      makeField("b", "string"),
    ];
    const ordered = engine.getDependencyOrder(fields, []);
    expect(ordered).toHaveLength(2);
  });

  it("handles cycles without crashing", () => {
    const fields = [
      makeField("a", "string"),
      makeField("b", "string"),
    ];
    const edges: RelationshipEdge[] = [
      { from: "a", to: "b", type: "derived" },
      { from: "b", to: "a", type: "derived" },
    ];
    const ordered = engine.getDependencyOrder(fields, edges);
    expect(ordered).toHaveLength(2);
  });
});
