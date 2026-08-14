/**
 * Boundary value generator. Produces edge-case values for each field
 * based on its semantic type and constraints. These values are designed
 * to test input validation and error handling at limits.
 */

import type { FieldDescriptor } from "@/core/engines/types";

/**
 * BoundaryEngine generates edge-case boundary values for fields.
 */
export class BoundaryEngine {
  /**
   * Generate boundary/edge-case values for a field based on its
   * semantic type and constraints.
   */
  generate(field: FieldDescriptor): unknown[] {
    const values: unknown[] = [];

    // Always test null/undefined
    values.push(null);
    values.push(undefined);

    switch (field.semanticType) {
      case "integer":
      case "id":
      case "foreign_key":
      case "age":
        values.push(...this.numericBoundaries(field, true));
        break;

      case "float":
      case "amount":
      case "latitude":
      case "longitude":
        values.push(...this.numericBoundaries(field, false));
        break;

      case "string":
      case "first_name":
      case "last_name":
      case "full_name":
      case "username":
      case "password":
      case "company":
      case "job_title":
      case "department":
      case "city":
      case "state":
      case "country":
      case "street":
      case "full_address":
        values.push(...this.stringBoundaries(field));
        break;

      case "email":
        values.push(...this.emailBoundaries(field));
        break;

      case "phone":
        values.push(...this.phoneBoundaries(field));
        break;

      case "date":
      case "dob":
        values.push(...this.dateBoundaries(field));
        break;

      case "datetime":
      case "timestamp":
        values.push(...this.datetimeBoundaries(field));
        break;

      case "boolean":
        values.push(...this.booleanBoundaries());
        break;

      case "url":
        values.push(...this.urlBoundaries(field));
        break;

      case "uuid":
        values.push(...this.uuidBoundaries());
        break;

      case "ip_address":
        values.push(...this.ipBoundaries());
        break;

      case "zipcode":
        values.push(...this.zipcodeBoundaries());
        break;

      case "ssn":
        values.push(...this.ssnBoundaries());
        break;

      case "credit_card_number":
        values.push(...this.creditCardBoundaries());
        break;

      case "credit_card_cvv":
        values.push(...this.cvvBoundaries());
        break;

      case "credit_card_expiry":
        values.push(...this.expiryBoundaries());
        break;

      case "enum":
        values.push(...this.enumBoundaries(field));
        break;

      case "iban":
        values.push(...this.ibanBoundaries());
        break;

      case "mac_address":
        values.push(...this.macBoundaries());
        break;

      case "currency":
        values.push(...this.currencyBoundaries());
        break;

      default:
        values.push(...this.stringBoundaries(field));
        break;
    }

    return values;
  }

  private numericBoundaries(
    field: FieldDescriptor,
    integerOnly: boolean
  ): unknown[] {
    const values: unknown[] = [];
    const min = field.constraints.min;
    const max = field.constraints.max;

    values.push(0);
    values.push(-1);
    values.push(1);

    if (min !== undefined) {
      values.push(min);
      values.push(min - 1);
    }
    if (max !== undefined) {
      values.push(max);
      values.push(max + 1);
    }

    values.push(Number.MAX_SAFE_INTEGER);
    values.push(Number.MIN_SAFE_INTEGER);

    if (!integerOnly) {
      values.push(0.1);
      values.push(-0.1);
      values.push(Number.MAX_VALUE);
      values.push(Number.MIN_VALUE);
      values.push(Number.EPSILON);
      values.push(Infinity);
      values.push(-Infinity);
      values.push(NaN);
    }

    // Type mismatch values
    values.push("not_a_number");
    values.push("");

    return values;
  }

  private stringBoundaries(field: FieldDescriptor): unknown[] {
    const values: unknown[] = [];
    const maxLen = field.constraints.maxLength;
    const minLen = field.constraints.minLength;

    // Empty and whitespace
    values.push("");
    values.push(" ");
    values.push("   ");

    // Single character
    values.push("a");

    // Min length boundary
    if (minLen !== undefined && minLen > 0) {
      values.push("a".repeat(minLen));
      values.push("a".repeat(Math.max(0, minLen - 1)));
    }

    // Max length boundary
    if (maxLen !== undefined) {
      values.push("a".repeat(maxLen));
      values.push("a".repeat(maxLen + 1));
    } else {
      // Very long string
      values.push("a".repeat(10000));
    }

    // Unicode / special characters
    values.push("éèêë"); // accented chars
    values.push("世界"); // CJK characters
    values.push("\u{1F600}\u{1F4A9}\u{1F680}"); // emoji
    values.push("test\0value"); // null byte
    values.push("\t\n\r"); // control characters
    values.push("   leading and trailing   "); // whitespace padding

    return values;
  }

  private emailBoundaries(_field: FieldDescriptor): unknown[] {
    return [
      // Missing parts
      "@",
      "user@",
      "@domain.com",
      "user",
      // Double @
      "user@@domain.com",
      // No domain extension
      "user@domain",
      // Special characters
      "user+tag@domain.com",
      "user.name@domain.com",
      "user@sub.domain.com",
      // Max length (254 chars per RFC 5321)
      "a".repeat(64) + "@" + "b".repeat(185) + ".com",
      // Over max
      "a".repeat(65) + "@" + "b".repeat(186) + ".com",
      // Empty and whitespace
      "",
      " ",
      // Spaces
      "user @domain.com",
      "user@ domain.com",
      // International
      "user@äöü.de",
      // Only dots
      "...@domain.com",
    ];
  }

  private phoneBoundaries(_field: FieldDescriptor): unknown[] {
    return [
      "",
      " ",
      "0",
      "123",
      "+1",
      "+1-555-555-5555",
      "00000000000000000000", // 20 digits
      "000000000000000000000", // 21 digits - over typical max
      "+999-999-999-9999",
      "abc-def-ghij",
      "(555) 555-5555",
      "555.555.5555",
      "+44 20 7946 0958",
    ];
  }

  private dateBoundaries(_field: FieldDescriptor): unknown[] {
    return [
      // Epoch
      "1970-01-01",
      // Far future
      "9999-12-31",
      // Leap day - valid
      "2024-02-29",
      // Leap day - invalid (non-leap year)
      "2023-02-29",
      // Invalid dates
      "2024-02-30",
      "2024-13-01",
      "2024-00-01",
      "2024-01-00",
      "2024-01-32",
      // Negative year
      "0000-01-01",
      // Empty / malformed
      "",
      "not-a-date",
      "2024",
      "2024-01",
      // Day before epoch
      "1969-12-31",
    ];
  }

  private datetimeBoundaries(_field: FieldDescriptor): unknown[] {
    return [
      "1970-01-01T00:00:00Z",
      "9999-12-31T23:59:59Z",
      "2024-02-29T12:00:00Z",
      "2023-02-29T12:00:00Z",
      "2024-01-01T24:00:00Z",
      "2024-01-01T23:60:00Z",
      "2024-01-01T23:59:60Z",
      "",
      "not-a-datetime",
      "2024-01-01",
      "2024-01-01T00:00:00+14:00",
      "2024-01-01T00:00:00-12:00",
    ];
  }

  private booleanBoundaries(): unknown[] {
    return [
      true,
      false,
      null,
      0,
      1,
      -1,
      "true",
      "false",
      "TRUE",
      "FALSE",
      "yes",
      "no",
      "1",
      "0",
      "",
      2,
    ];
  }

  private urlBoundaries(_field: FieldDescriptor): unknown[] {
    return [
      "",
      " ",
      "not-a-url",
      "http://",
      "https://",
      "ftp://example.com",
      "http://localhost",
      "http://localhost:3000",
      "http://127.0.0.1",
      "http://[::1]",
      "https://example.com/" + "a".repeat(2000),
      "javascript:alert(1)",
      "data:text/html,<h1>test</h1>",
      "://missing-scheme.com",
      "http://example.com/path?query=value&other=1#fragment",
    ];
  }

  private uuidBoundaries(): unknown[] {
    return [
      "00000000-0000-0000-0000-000000000000",
      "ffffffff-ffff-ffff-ffff-ffffffffffff",
      "not-a-uuid",
      "",
      "12345678-1234-1234-1234-123456789abc",
      "12345678123412341234123456789abc", // missing dashes
      "12345678-1234-1234-1234-123456789abcde", // too long
      "12345678-1234-1234-1234", // too short
    ];
  }

  private ipBoundaries(): unknown[] {
    return [
      "0.0.0.0",
      "255.255.255.255",
      "127.0.0.1",
      "192.168.1.1",
      "256.0.0.0",
      "0.0.0.256",
      "-1.0.0.0",
      "1.2.3",
      "1.2.3.4.5",
      "",
      "not-an-ip",
      "::1",
      "fe80::1",
      "999.999.999.999",
    ];
  }

  private zipcodeBoundaries(): unknown[] {
    return [
      "00000",
      "99999",
      "00000-0000",
      "99999-9999",
      "0000", // too short
      "000000", // too long (6 digits)
      "",
      "ABCDE",
      "12 34",
      "12345-",
      "12345-67890", // too long extension
    ];
  }

  private ssnBoundaries(): unknown[] {
    return [
      "000-00-0000",
      "999-99-9999",
      "123-45-6789",
      "000-00-000", // too short
      "000-00-00000", // too long
      "",
      "123456789", // no dashes
      "AAA-BB-CCCC",
      "123-45-678",
    ];
  }

  private creditCardBoundaries(): unknown[] {
    return [
      "0000000000000000",
      "9999999999999999",
      "4111111111111111", // valid Luhn
      "4111111111111112", // invalid Luhn
      "123456789012", // too short (12)
      "12345678901234567890", // too long (20)
      "",
      "abcdefghijklmnop",
      "4111 1111 1111 1111", // with spaces
    ];
  }

  private cvvBoundaries(): unknown[] {
    return ["000", "999", "0000", "9999", "00", "00000", "", "abc", "12"];
  }

  private expiryBoundaries(): unknown[] {
    return [
      "01/25",
      "12/99",
      "00/25",
      "13/25",
      "01/00",
      "",
      "1/25",
      "01-25",
      "01/2025",
      "AB/CD",
    ];
  }

  private enumBoundaries(field: FieldDescriptor): unknown[] {
    const values: unknown[] = [];
    const enumValues = field.constraints.enum;

    if (enumValues && enumValues.length > 0) {
      values.push(enumValues[0]); // first
      values.push(enumValues[enumValues.length - 1]); // last
      values.push("NOT_IN_LIST_VALUE"); // invalid
      values.push(null);
      values.push("");
      values.push(999);
    } else {
      values.push("NOT_IN_LIST_VALUE");
      values.push(null);
      values.push("");
      values.push(0);
    }

    return values;
  }

  private ibanBoundaries(): unknown[] {
    return [
      "DE00000000000000000000", // min check digits
      "DE99000000000000000000",
      "XX00000000000000000000", // invalid country
      "",
      "DE", // too short
      "DE0000000000000000000000000000000000", // too long
      "de89370400440532013000", // lowercase
      "1234567890", // no country code
    ];
  }

  private macBoundaries(): unknown[] {
    return [
      "00:00:00:00:00:00",
      "FF:FF:FF:FF:FF:FF",
      "00-00-00-00-00-00",
      "FF-FF-FF-FF-FF-FF",
      "",
      "GG:GG:GG:GG:GG:GG",
      "00:00:00:00:00",
      "00:00:00:00:00:00:00",
    ];
  }

  private currencyBoundaries(): unknown[] {
    return [
      "USD",
      "EUR",
      "XXX", // no currency
      "",
      "US", // too short
      "USDD", // too long
      "usd", // lowercase
      "123",
    ];
  }
}
