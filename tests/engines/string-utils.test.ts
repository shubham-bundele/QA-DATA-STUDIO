import { describe, it, expect } from "vitest";
import { normalize, tokenize, levenshtein, similarity } from "@/core/engines/string-utils";

describe("normalize", () => {
  it("lowercases input", () => {
    expect(normalize("FirstName")).toBe("firstname");
  });

  it("replaces non-alphanumeric with underscore", () => {
    expect(normalize("first-name")).toBe("first_name");
    expect(normalize("first.name")).toBe("first_name");
    expect(normalize("first name")).toBe("first_name");
  });

  it("trims leading/trailing underscores", () => {
    expect(normalize("_first_name_")).toBe("first_name");
    expect(normalize("__test__")).toBe("test");
  });

  it("handles empty string", () => {
    expect(normalize("")).toBe("");
  });

  it("handles special characters", () => {
    expect(normalize("@#$")).toBe("");
    expect(normalize("field!name")).toBe("field_name");
  });
});

describe("tokenize", () => {
  it("splits camelCase", () => {
    expect(tokenize("firstName")).toEqual(["first", "name"]);
    expect(tokenize("dateOfBirth")).toEqual(["date", "of", "birth"]);
  });

  it("splits PascalCase", () => {
    expect(tokenize("FirstName")).toEqual(["first", "name"]);
  });

  it("splits snake_case", () => {
    expect(tokenize("first_name")).toEqual(["first", "name"]);
  });

  it("splits kebab-case", () => {
    expect(tokenize("first-name")).toEqual(["first", "name"]);
  });

  it("handles acronyms in PascalCase", () => {
    expect(tokenize("XMLParser")).toEqual(["xml", "parser"]);
    expect(tokenize("parseHTML")).toEqual(["parse", "html"]);
  });

  it("handles empty string", () => {
    expect(tokenize("")).toEqual([]);
  });

  it("handles single word", () => {
    expect(tokenize("email")).toEqual(["email"]);
  });
});

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("email", "email")).toBe(0);
  });

  it("returns length for empty comparison", () => {
    expect(levenshtein("", "hello")).toBe(5);
    expect(levenshtein("hello", "")).toBe(5);
  });

  it("calculates edit distance", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("email", "emal")).toBe(1);
  });
});

describe("similarity", () => {
  it("returns 1 for identical strings", () => {
    expect(similarity("email", "email")).toBe(1);
  });

  it("returns 1 for case-insensitive match", () => {
    expect(similarity("Email", "email")).toBe(1);
  });

  it("returns high similarity for typos", () => {
    expect(similarity("email", "emal")).toBeGreaterThan(0.7);
  });

  it("returns low similarity for unrelated strings", () => {
    expect(similarity("email", "zzzzz")).toBeLessThan(0.3);
  });

  it("handles empty strings", () => {
    expect(similarity("", "")).toBe(1);
  });
});
