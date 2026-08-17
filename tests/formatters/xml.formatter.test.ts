import { describe, it, expect } from "vitest";
import { XmlFormatter } from "@/features/export/formatters/xml.formatter";

const formatter = new XmlFormatter();

describe("XmlFormatter", () => {
  it("output starts with XML declaration", () => {
    const result = formatter.format([], {});
    expect(result).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  });

  it('uses "data" as default root element and "record" as default record element', () => {
    const data = [{ name: "Alice" }];
    const result = formatter.format(data, {});
    expect(result).toContain("<data>");
    expect(result).toContain("</data>");
    expect(result).toContain("<record>");
    expect(result).toContain("</record>");
  });

  it("uses custom root and record element names", () => {
    const data = [{ name: "Alice" }];
    const result = formatter.format(data, {
      rootElement: "users",
      recordElement: "user",
    });
    expect(result).toContain("<users>");
    expect(result).toContain("</users>");
    expect(result).toContain("<user>");
    expect(result).toContain("</user>");
    expect(result).not.toContain("<data>");
    expect(result).not.toContain("<record>");
  });

  it("escapes XML special characters in values", () => {
    const data = [{ text: 'Tom & Jerry <"best"> show\'s' }];
    const result = formatter.format(data, {});
    expect(result).toContain("&amp;");
    expect(result).toContain("&lt;");
    expect(result).toContain("&gt;");
    expect(result).toContain("&quot;");
    expect(result).toContain("&apos;");
  });

  it("produces self-closing tags for null values", () => {
    const data = [{ missing: null }];
    const result = formatter.format(data, {});
    expect(result).toContain("<missing/>");
  });

  it("produces self-closing tags for undefined values", () => {
    const data = [{ missing: undefined }];
    const result = formatter.format(data, {});
    expect(result).toContain("<missing/>");
  });

  it("produces nested XML elements for nested objects", () => {
    const data = [{ address: { city: "NYC", zip: "10001" } }];
    const result = formatter.format(data, {});
    expect(result).toContain("<address>");
    expect(result).toContain("<city>NYC</city>");
    expect(result).toContain("<zip>10001</zip>");
    expect(result).toContain("</address>");
  });

  it("produces <item> elements for array values", () => {
    const data = [{ tags: ["a", "b", "c"] }];
    const result = formatter.format(data, {});
    expect(result).toContain("<tags>");
    expect(result).toContain("<item>a</item>");
    expect(result).toContain("<item>b</item>");
    expect(result).toContain("<item>c</item>");
    expect(result).toContain("</tags>");
  });

  it("produces indented output when prettyPrint is true (default)", () => {
    const data = [{ name: "Alice" }];
    const result = formatter.format(data, {});
    expect(result).toContain("\n");
    // Record element should be indented with 2 spaces
    expect(result).toContain("  <record>");
  });

  it("produces compact output when prettyPrint is false", () => {
    const data = [{ name: "Alice" }];
    const result = formatter.format(data, { prettyPrint: false });
    expect(result).not.toContain("\n");
  });

  it("replaces unsafe key characters with underscore", () => {
    const data = [{ "my key!": "value", "dotted.key": "v2" }];
    const result = formatter.format(data, {});
    expect(result).toContain("<my_key_>");
    expect(result).toContain("<dotted_key>");
  });

  it('has mimeType "application/xml"', () => {
    expect(formatter.mimeType).toBe("application/xml");
  });
});
