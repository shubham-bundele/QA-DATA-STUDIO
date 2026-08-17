import { describe, it, expect } from "vitest";
import { JsonFormatter } from "@/features/export/formatters/json.formatter";

const formatter = new JsonFormatter();

describe("JsonFormatter", () => {
  it("produces [] for empty array", () => {
    expect(formatter.format([], {})).toBe("[]");
  });

  it("produces valid JSON for a single record", () => {
    const data = [{ name: "Alice", age: 30 }];
    const result = formatter.format(data, {});
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(data);
  });

  it("pretty-prints with default indent of 2", () => {
    const data = [{ a: 1 }];
    const result = formatter.format(data, {});
    // Pretty-printed JSON has newlines and 2-space indentation
    expect(result).toContain("\n");
    expect(result).toContain("  ");
    expect(result).toBe(JSON.stringify(data, null, 2));
  });

  it("respects custom indent value", () => {
    const data = [{ a: 1 }];
    const result = formatter.format(data, { indent: 4 });
    expect(result).toBe(JSON.stringify(data, null, 4));
  });

  it("produces compact output when prettyPrint is false", () => {
    const data = [{ name: "Alice", age: 30 }];
    const result = formatter.format(data, { prettyPrint: false });
    expect(result).not.toContain("\n");
    expect(result).toBe(JSON.stringify(data));
  });

  it("preserves unicode characters", () => {
    const data = [{ text: "éàüñ☃" }];
    const result = formatter.format(data, {});
    const parsed = JSON.parse(result);
    expect(parsed[0].text).toBe("éàüñ☃");
  });

  it("preserves nested objects", () => {
    const data = [{ user: { name: "Alice", address: { city: "NYC" } } }];
    const result = formatter.format(data, {});
    const parsed = JSON.parse(result);
    expect(parsed[0].user.address.city).toBe("NYC");
  });

  it("output is parseable with JSON.parse", () => {
    const data = [
      { id: 1, tags: ["a", "b"], meta: { active: true } },
      { id: 2, tags: [], meta: null },
    ];
    const result = formatter.format(data, {});
    expect(() => JSON.parse(result)).not.toThrow();
    expect(JSON.parse(result)).toEqual(data);
  });

  it('has mimeType "application/json"', () => {
    expect(formatter.mimeType).toBe("application/json");
  });

  it('has fileExtension ".json"', () => {
    expect(formatter.fileExtension).toBe(".json");
  });
});
