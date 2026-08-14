import { describe, it, expect } from "vitest";
import { CsvFormatter } from "@/features/export/formatters/csv.formatter";

const formatter = new CsvFormatter();

describe("CsvFormatter", () => {
  it("returns empty string for empty data", () => {
    expect(formatter.format([], {})).toBe("");
  });

  it("produces header line and data line for a single record", () => {
    const data = [{ name: "Alice", age: 30 }];
    const result = formatter.format(data, {});
    const lines = result.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("name");
    expect(lines[0]).toContain("age");
    expect(lines[1]).toContain("Alice");
    expect(lines[1]).toContain("30");
  });

  it("produces correct number of lines for multiple records", () => {
    const data = [
      { id: 1, value: "a" },
      { id: 2, value: "b" },
      { id: 3, value: "c" },
    ];
    const result = formatter.format(data, {});
    const lines = result.split("\n");
    // 1 header + 3 data lines
    expect(lines).toHaveLength(4);
  });

  it("uses custom delimiter", () => {
    const data = [{ name: "Alice", age: 30 }];
    const result = formatter.format(data, { delimiter: ";" });
    const lines = result.split("\n");
    expect(lines[0]).toContain(";");
    // Should not use comma as separator between fields
    const headerParts = lines[0].split(";");
    expect(headerParts).toHaveLength(2);
  });

  it("omits header row when includeHeaders is false", () => {
    const data = [{ name: "Alice" }];
    const result = formatter.format(data, { includeHeaders: false });
    const lines = result.split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("Alice");
  });

  it("quotes values containing the delimiter", () => {
    const data = [{ text: "hello, world" }];
    const result = formatter.format(data, { includeHeaders: false });
    // The value contains a comma (the default delimiter) so it must be quoted.
    // Internal quotes are doubled, so "hello, world" becomes """hello, world"""
    expect(result).toContain('"hello, world"');
  });

  it("escapes double quotes inside values by doubling them", () => {
    const data = [{ text: 'say "hi"' }];
    const result = formatter.format(data, { includeHeaders: false });
    // Internal quotes are doubled: say ""hi""
    expect(result).toContain('say ""hi""');
  });

  it("quotes values containing newlines", () => {
    const data = [{ text: "line1\nline2" }];
    const result = formatter.format(data, {
      includeHeaders: false,
      quoteStrings: false,
    });
    // Even with quoteStrings off, newlines force quoting
    expect(result).toContain('"line1\nline2"');
  });

  it("flattens nested objects to dot-notation keys", () => {
    const data = [{ user: { name: "Alice", address: { city: "NYC" } } }];
    const result = formatter.format(data, {});
    expect(result).toContain("user.name");
    expect(result).toContain("user.address.city");
    expect(result).toContain("Alice");
    expect(result).toContain("NYC");
  });

  it("produces empty strings for null and undefined values", () => {
    const data = [{ a: null, b: undefined, c: "ok" }];
    const result = formatter.format(data, { includeHeaders: false });
    // null/undefined -> empty string. With quoteStrings on, empty string becomes ""
    expect(result).toContain('""');
    expect(result).toContain("ok");
  });

  it("JSON-stringifies array values", () => {
    const data = [{ tags: [1, 2, 3] }];
    const result = formatter.format(data, { includeHeaders: false });
    expect(result).toContain("[1,2,3]");
  });

  it("quotes all string values when quoteStrings is true (default)", () => {
    const data = [{ name: "Alice" }];
    const result = formatter.format(data, {});
    const lines = result.split("\n");
    // Both header and value should be quoted
    expect(lines[0]).toBe('"name"');
    expect(lines[1]).toBe('"Alice"');
  });

  it("does not quote simple strings when quoteStrings is false", () => {
    const data = [{ name: "Alice" }];
    const result = formatter.format(data, { quoteStrings: false });
    const lines = result.split("\n");
    expect(lines[0]).toBe("name");
    expect(lines[1]).toBe("Alice");
  });

  it("preserves unicode characters", () => {
    const data = [{ greeting: "Hej varlden", emoji: "cafe" }];
    const result = formatter.format(data, {});
    expect(result).toContain("Hej varlden");
    expect(result).toContain("cafe");
  });
});
