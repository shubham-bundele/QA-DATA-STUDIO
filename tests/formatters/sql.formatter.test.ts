import { describe, it, expect } from "vitest";
import { SqlFormatter } from "@/features/export/formatters/sql.formatter";

const formatter = new SqlFormatter();

describe("SqlFormatter", () => {
  it('returns "-- No data to export" for empty data', () => {
    expect(formatter.format([], {})).toBe("-- No data to export");
  });

  it('uses "test_data" as default table name', () => {
    const data = [{ id: 1 }];
    const result = formatter.format(data, {});
    expect(result).toContain("test_data");
  });

  it("uses custom table name", () => {
    const data = [{ id: 1 }];
    const result = formatter.format(data, { tableName: "my_table" });
    expect(result).toContain("my_table");
    expect(result).not.toContain("test_data");
  });

  it("MySQL dialect uses backtick quoting for identifiers", () => {
    const data = [{ name: "Alice" }];
    const result = formatter.format(data, { dialect: "mysql" });
    expect(result).toContain("`test_data`");
    expect(result).toContain("`name`");
  });

  it("Postgres dialect uses double-quote quoting for identifiers", () => {
    const data = [{ name: "Alice" }];
    const result = formatter.format(data, { dialect: "postgres" });
    expect(result).toContain('"test_data"');
    expect(result).toContain('"name"');
  });

  it("generates CREATE TABLE when includeCreate is true (default)", () => {
    const data = [{ id: 1 }];
    const result = formatter.format(data, {});
    expect(result).toContain("CREATE TABLE");
  });

  it("omits CREATE TABLE when includeCreate is false", () => {
    const data = [{ id: 1 }];
    const result = formatter.format(data, { includeCreate: false });
    expect(result).not.toContain("CREATE TABLE");
  });

  it("generates DROP TABLE IF EXISTS when includeDropIfExists is true", () => {
    const data = [{ id: 1 }];
    const result = formatter.format(data, { includeDropIfExists: true });
    expect(result).toContain("DROP TABLE IF EXISTS");
  });

  it("omits DROP TABLE IF EXISTS by default", () => {
    const data = [{ id: 1 }];
    const result = formatter.format(data, {});
    expect(result).not.toContain("DROP TABLE IF EXISTS");
  });

  describe("type inference", () => {
    it("infers INTEGER for integer numbers", () => {
      const data = [{ count: 42 }];
      const result = formatter.format(data, {});
      expect(result).toContain("INTEGER");
    });

    it("infers DECIMAL(15,2) for floating-point numbers", () => {
      const data = [{ price: 19.99 }];
      const result = formatter.format(data, {});
      expect(result).toContain("DECIMAL(15,2)");
    });

    it("infers TINYINT(1) for booleans in MySQL", () => {
      const data = [{ active: true }];
      const result = formatter.format(data, { dialect: "mysql" });
      expect(result).toContain("TINYINT(1)");
    });

    it("infers BOOLEAN for booleans in Postgres", () => {
      const data = [{ active: true }];
      const result = formatter.format(data, { dialect: "postgres" });
      expect(result).toContain("BOOLEAN");
    });

    it("infers VARCHAR(255) for short strings", () => {
      const data = [{ name: "Alice" }];
      const result = formatter.format(data, {});
      expect(result).toContain("VARCHAR(255)");
    });

    it("infers TEXT for strings longer than 255 characters", () => {
      const data = [{ bio: "x".repeat(300) }];
      const result = formatter.format(data, {});
      expect(result).toContain("TEXT");
    });

    it("infers JSON for objects in MySQL", () => {
      const data = [{ meta: { key: "value" } }];
      const result = formatter.format(data, { dialect: "mysql" });
      expect(result).toMatch(/\bJSON\b/);
    });

    it("infers JSONB for objects in Postgres", () => {
      const data = [{ meta: { key: "value" } }];
      const result = formatter.format(data, { dialect: "postgres" });
      expect(result).toContain("JSONB");
    });
  });

  it("escapes single quotes in SQL string values by doubling them", () => {
    const data = [{ text: "it's a test" }];
    const result = formatter.format(data, { includeCreate: false });
    expect(result).toContain("'it''s a test'");
  });

  it("produces NULL for null values", () => {
    const data = [{ value: null }];
    const result = formatter.format(data, { includeCreate: false });
    expect(result).toContain("NULL");
  });

  it("produces NULL for undefined values", () => {
    const data = [{ value: undefined }];
    const result = formatter.format(data, { includeCreate: false });
    expect(result).toContain("NULL");
  });

  it("INSERT statements have correct column order matching all keys", () => {
    const data = [
      { alpha: 1, beta: "two", gamma: true },
      { alpha: 4, beta: "five", gamma: false },
    ];
    const result = formatter.format(data, { dialect: "mysql" });
    // Both INSERT statements should list columns in the same order
    const inserts = result.split("\n").filter((line) => line.startsWith("INSERT"));
    expect(inserts).toHaveLength(2);
    for (const insert of inserts) {
      expect(insert).toMatch(/\(`alpha`, `beta`, `gamma`\)/);
    }
  });

  it('has mimeType "application/sql"', () => {
    expect(formatter.mimeType).toBe("application/sql");
  });
});
