import { faker, Faker, en } from "@faker-js/faker";
import { randomInt, randomFloat, randomPick, createRng, type SeededRandom } from "@/core/utils/random";
import { calculateLuhnCheckDigit } from "@/core/utils/luhn";
import { generateIBAN } from "@/core/utils/iban";
import { SchemaDetector } from "@/core/engines/schema-detection";
import { FieldClassifier } from "@/core/engines/field-classification";
import { RelationshipEngine } from "@/core/engines/relationship-engine";
import { BoundaryEngine } from "@/core/engines/boundary-engine";
import { SecurityEngine } from "@/core/engines/security-engine";
import { ValidationEngine } from "@/core/engines/validation-engine";
import type {
  InputFormat,
  DataCategory,
  FieldDescriptor,
} from "@/core/engines/types";

export interface IntelligentGenerationConfig {
  categories: DataCategory[];
  recordsPerCategory: number;
  seed?: number;
}

export interface RecordValidationStatus {
  recordIndex: number;
  valid: boolean;
  errors: Array<{ field: string; errors: string[] }>;
}

export interface IntelligentGenerationResult {
  category: DataCategory;
  records: Record<string, unknown>[];
  metadata: {
    fieldCount: number;
    recordCount: number;
    description: string;
    validationSummary?: {
      totalValidated: number;
      passed: number;
      failed: number;
      details: RecordValidationStatus[];
    };
  };
}

function generateCreditCardNumber(rng?: SeededRandom): string {
  const prefix = "4";
  const totalLength = 16;
  let partial = prefix;
  for (let i = 0; i < totalLength - prefix.length - 1; i++) {
    partial += rng ? rng.digit().toString() : Math.floor(Math.random() * 10).toString();
  }
  const check = calculateLuhnCheckDigit(partial);
  return partial + check.toString();
}

let idCounter = 0;

function resetIdCounter(): void {
  idCounter = 0;
}

function generatePositiveValue(field: FieldDescriptor, f: typeof faker, rng?: SeededRandom): unknown {
  switch (field.semanticType) {
    case "first_name":
      return f.person.firstName();

    case "last_name":
      return f.person.lastName();

    case "full_name":
      return f.person.fullName();

    case "email":
      return f.internet.email();

    case "phone":
      return f.phone.number();

    case "dob":
      return f.date.birthdate().toISOString().split("T")[0];

    case "age":
      return randomInt(
        field.constraints.min ?? 18,
        field.constraints.max ?? 80,
        rng
      );

    case "gender":
      return randomPick(["Male", "Female", "Non-binary", "Other"], rng);

    case "ssn":
      return f.string.numeric("###-##-####");

    case "username":
      return f.internet.username();

    case "password":
      return f.internet.password({ length: 12 });

    case "street":
      return f.location.streetAddress();

    case "city":
      return f.location.city();

    case "state":
      return f.location.state({ abbreviated: true });

    case "country":
      return f.location.countryCode();

    case "zipcode":
      return f.location.zipCode();

    case "full_address":
      return `${f.location.streetAddress()}, ${f.location.city()}, ${f.location.state({ abbreviated: true })} ${f.location.zipCode()}`;

    case "latitude":
      return parseFloat(f.location.latitude().toString());

    case "longitude":
      return parseFloat(f.location.longitude().toString());

    case "company":
      return f.company.name();

    case "job_title":
      return f.person.jobTitle();

    case "department":
      return randomPick([
        "Engineering",
        "Marketing",
        "Sales",
        "Finance",
        "HR",
        "Operations",
        "Legal",
        "Support",
        "Product",
        "Design",
      ], rng);

    case "credit_card_number":
      return generateCreditCardNumber(rng);

    case "credit_card_cvv":
      return f.string.numeric("###");

    case "credit_card_expiry": {
      const futureDate = f.date.future({ years: 5 });
      const month = (futureDate.getMonth() + 1).toString().padStart(2, "0");
      const year = (futureDate.getFullYear() % 100).toString().padStart(2, "0");
      return `${month}/${year}`;
    }

    case "credit_card_type":
      return randomPick(["Visa", "Mastercard", "Amex", "Discover"], rng);

    case "iban":
      return generateIBAN("DE", rng);

    case "swift_code": {
      const bankCode = f.string.alpha({ length: 4, casing: "upper" });
      const countryCode = f.location.countryCode("alpha-2");
      const locationCode = f.string.alphanumeric({
        length: 2,
        casing: "upper",
      });
      return `${bankCode}${countryCode}${locationCode}`;
    }

    case "routing_number":
      return f.string.numeric("#########");

    case "account_number":
      return f.string.numeric("############");

    case "currency":
      return randomPick(["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF"], rng);

    case "amount":
      return randomFloat(
        field.constraints.min ?? 0.01,
        field.constraints.max ?? 99999.99,
        2,
        rng
      );

    case "url":
      return f.internet.url();

    case "ip_address":
      return f.internet.ip();

    case "uuid":
      return f.string.uuid();

    case "domain":
      return f.internet.domainName();

    case "mac_address":
      return f.internet.mac();

    case "boolean":
      return rng ? rng.boolean() : Math.random() > 0.5;

    case "integer":
      return randomInt(
        field.constraints.min ?? 0,
        field.constraints.max ?? 10000,
        rng
      );

    case "float":
      return randomFloat(
        field.constraints.min ?? 0,
        field.constraints.max ?? 10000,
        2,
        rng
      );

    case "string": {
      const maxLen = field.constraints.maxLength ?? 50;
      const minLen = field.constraints.minLength ?? 1;
      const len = randomInt(minLen, Math.min(maxLen, 50), rng);
      return f.string.alphanumeric(len);
    }

    case "date":
      return f.date.recent().toISOString().split("T")[0];

    case "datetime":
      return f.date.recent().toISOString();

    case "timestamp":
      return f.date.recent().toISOString();

    case "enum":
      if (field.constraints.enum && field.constraints.enum.length > 0) {
        return randomPick(field.constraints.enum, rng);
      }
      return randomPick(["active", "inactive", "pending", "archived"], rng);

    case "id": {
      idCounter++;
      return idCounter;
    }

    case "foreign_key":
      return randomInt(1, 1000, rng);

    case "unknown":
    default:
      return f.lorem.word();
  }
}

function generateNegativeValue(field: FieldDescriptor, rng?: SeededRandom): unknown {
  const strategies: (() => unknown)[] = [];

  switch (field.semanticType) {
    case "email":
      strategies.push(
        () => "not-an-email",
        () => "@missing-local.com",
        () => "missing-domain@",
        () => "",
        () => null,
        () => 12345,
        () => "spaces in@email.com"
      );
      break;

    case "phone":
      strategies.push(
        () => "not-a-phone",
        () => "",
        () => null,
        () => "abc",
        () => true,
        () => 0
      );
      break;

    case "url":
      strategies.push(
        () => "not-a-url",
        () => "",
        () => null,
        () => "ftp:missing-slashes",
        () => 12345
      );
      break;

    case "uuid":
      strategies.push(
        () => "not-a-uuid",
        () => "",
        () => null,
        () => "12345",
        () => 12345
      );
      break;

    case "integer":
    case "float":
    case "amount":
    case "age":
      strategies.push(
        () => "not-a-number",
        () => null,
        () => "",
        () => true,
        () => NaN,
        () => Infinity
      );
      if (field.constraints.min !== undefined) {
        strategies.push(() => (field.constraints.min as number) - 1);
      }
      if (field.constraints.max !== undefined) {
        strategies.push(() => (field.constraints.max as number) + 1);
      }
      break;

    case "boolean":
      strategies.push(
        () => "not-a-boolean",
        () => null,
        () => "",
        () => 2,
        () => "yes"
      );
      break;

    case "date":
    case "datetime":
    case "timestamp":
    case "dob":
      strategies.push(
        () => "not-a-date",
        () => null,
        () => "",
        () => "2024-13-45",
        () => 12345
      );
      break;

    case "credit_card_number":
      strategies.push(
        () => "1234567890123456",
        () => "",
        () => null,
        () => "abcdefghijklmnop",
        () => "0000000000000000"
      );
      break;

    case "iban":
      strategies.push(
        () => "INVALID_IBAN",
        () => "",
        () => null,
        () => "XX00INVALIDIBAN"
      );
      break;

    case "ssn":
      strategies.push(
        () => "000-00-0000",
        () => "",
        () => null,
        () => "abc-de-fghi"
      );
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
    default:
      strategies.push(
        () => null,
        () => "",
        () => 12345,
        () => true,
        () => [],
        () => {},
        () => undefined
      );
      if (field.constraints.maxLength !== undefined) {
        strategies.push(
          () => "a".repeat((field.constraints.maxLength as number) + 10)
        );
      }
      break;
  }

  return randomPick(strategies, rng)();
}

export class Orchestrator {
  private schemaDetector = new SchemaDetector();
  private fieldClassifier = new FieldClassifier();
  private relationshipEngine = new RelationshipEngine();
  private boundaryEngine = new BoundaryEngine();
  private securityEngine = new SecurityEngine();
  private validationEngine = new ValidationEngine();

  process(
    format: InputFormat,
    content: string,
    config: IntelligentGenerationConfig
  ): IntelligentGenerationResult[] {
    const rng = createRng(config.seed);
    const f = rng
      ? new Faker({ locale: [en], randomizer: { next: () => rng.next(), seed: () => {} } })
      : faker;

    if (!rng && config.seed !== undefined) {
      faker.seed(config.seed);
    }

    const parsedSchema = this.schemaDetector.detect(format, content);

    if (parsedSchema.fields.length === 0) {
      return [];
    }

    const classifiedFields = this.fieldClassifier.classifyAll(
      parsedSchema.fields
    );

    const edges = this.relationshipEngine.detect(classifiedFields);

    const orderedFields = this.relationshipEngine.getDependencyOrder(
      classifiedFields,
      edges
    );

    const results: IntelligentGenerationResult[] = [];

    for (const category of config.categories) {
      const records = this.generateCategory(
        category,
        orderedFields,
        config.recordsPerCategory,
        f,
        rng
      );

      const validationSummary = this.validateCategory(
        records,
        orderedFields,
        category,
        f,
        rng
      );

      results.push({
        category,
        records,
        metadata: {
          fieldCount: orderedFields.length,
          recordCount: records.length,
          description: this.getCategoryDescription(category),
          validationSummary,
        },
      });
    }

    if (!rng && config.seed !== undefined) {
      faker.seed();
    }

    return results;
  }

  private generateCategory(
    category: DataCategory,
    fields: FieldDescriptor[],
    count: number,
    f: typeof faker,
    rng?: SeededRandom
  ): Record<string, unknown>[] {
    switch (category) {
      case "positive":
        return this.generatePositiveRecords(fields, count, f, rng);
      case "negative":
        return this.generateNegativeRecords(fields, count, f, rng);
      case "boundary":
        return this.generateBoundaryRecords(fields, count, f, rng);
      case "security":
        return this.generateSecurityRecords(fields, count, f, rng);
      default:
        return [];
    }
  }

  private generatePositiveRecords(
    fields: FieldDescriptor[],
    count: number,
    f: typeof faker,
    rng?: SeededRandom
  ): Record<string, unknown>[] {
    resetIdCounter();
    const records: Record<string, unknown>[] = [];

    for (let i = 0; i < count; i++) {
      const record: Record<string, unknown> = {};

      for (const field of fields) {
        record[field.originalName] = generatePositiveValue(field, f, rng);
      }

      records.push(record);
    }

    return records;
  }

  private generateNegativeRecords(
    fields: FieldDescriptor[],
    count: number,
    f: typeof faker,
    rng?: SeededRandom
  ): Record<string, unknown>[] {
    const records: Record<string, unknown>[] = [];

    for (let i = 0; i < count; i++) {
      const record: Record<string, unknown> = {};

      const negativeFieldCount = Math.max(
        1,
        Math.floor(fields.length * 0.3)
      );
      const negativeIndices = new Set<number>();
      while (negativeIndices.size < negativeFieldCount) {
        const idx = rng
          ? Math.floor(rng.next() * fields.length)
          : Math.floor(Math.random() * fields.length);
        negativeIndices.add(idx);
      }

      for (let j = 0; j < fields.length; j++) {
        const field = fields[j];
        if (negativeIndices.has(j)) {
          record[field.originalName] = generateNegativeValue(field, rng);
        } else {
          record[field.originalName] = generatePositiveValue(field, f, rng);
        }
      }

      records.push(record);
    }

    return records;
  }

  private generateBoundaryRecords(
    fields: FieldDescriptor[],
    count: number,
    f: typeof faker,
    rng?: SeededRandom
  ): Record<string, unknown>[] {
    const records: Record<string, unknown>[] = [];

    const fieldBoundaries = new Map<string, unknown[]>();
    for (const field of fields) {
      fieldBoundaries.set(field.originalName, this.boundaryEngine.generate(field));
    }

    for (let i = 0; i < count; i++) {
      const record: Record<string, unknown> = {};

      const boundaryFieldIdx = i % fields.length;

      for (let j = 0; j < fields.length; j++) {
        const field = fields[j];

        if (j === boundaryFieldIdx) {
          const boundaries = fieldBoundaries.get(field.originalName) ?? [];
          if (boundaries.length > 0) {
            const boundaryIdx = Math.floor(i / fields.length) % boundaries.length;
            record[field.originalName] = boundaries[boundaryIdx];
          } else {
            record[field.originalName] = generatePositiveValue(field, f, rng);
          }
        } else {
          record[field.originalName] = generatePositiveValue(field, f, rng);
        }
      }

      records.push(record);
    }

    return records;
  }

  private generateSecurityRecords(
    fields: FieldDescriptor[],
    count: number,
    f: typeof faker,
    rng?: SeededRandom
  ): Record<string, unknown>[] {
    const records: Record<string, unknown>[] = [];

    const fieldPayloads = new Map<string, unknown[]>();
    for (const field of fields) {
      fieldPayloads.set(field.originalName, this.securityEngine.generate(field));
    }

    for (let i = 0; i < count; i++) {
      const record: Record<string, unknown> = {};

      const attackFieldIdx = i % fields.length;

      for (let j = 0; j < fields.length; j++) {
        const field = fields[j];

        if (j === attackFieldIdx) {
          const payloads = fieldPayloads.get(field.originalName) ?? [];
          if (payloads.length > 0) {
            const payloadIdx = Math.floor(i / fields.length) % payloads.length;
            record[field.originalName] = payloads[payloadIdx];
          } else {
            record[field.originalName] = generatePositiveValue(field, f, rng);
          }
        } else {
          record[field.originalName] = generatePositiveValue(field, f, rng);
        }
      }

      records.push(record);
    }

    return records;
  }

  private getCategoryDescription(category: DataCategory): string {
    switch (category) {
      case "positive":
        return "Valid data conforming to all field constraints and formats";
      case "negative":
        return "Invalid data with wrong types, null values, and constraint violations";
      case "boundary":
        return "Edge-case values testing limits, extremes, and special characters";
      case "security":
        return "Security payloads including SQL injection, XSS, command injection, and path traversal";
      default:
        return "Test data";
    }
  }

  private validateCategory(
    records: Record<string, unknown>[],
    fields: FieldDescriptor[],
    category: DataCategory,
    f: typeof faker,
    rng?: SeededRandom
  ): IntelligentGenerationResult["metadata"]["validationSummary"] {
    const details: RecordValidationStatus[] = [];
    let passed = 0;
    let failed = 0;

    for (let i = 0; i < records.length; i++) {
      const result = this.validationEngine.validateRecord(records[i], fields);
      const status: RecordValidationStatus = {
        recordIndex: i,
        valid: result.valid,
        errors: result.errors,
      };

      if (category === "positive" && !result.valid) {
        for (let retry = 0; retry < 2 && !status.valid; retry++) {
          const newRecord: Record<string, unknown> = {};
          for (const field of fields) {
            newRecord[field.originalName] = generatePositiveValue(field, f, rng);
          }
          const retryResult = this.validationEngine.validateRecord(newRecord, fields);
          if (retryResult.valid) {
            records[i] = newRecord;
            status.valid = true;
            status.errors = [];
          }
        }
      }

      if (status.valid) {
        passed++;
      } else {
        failed++;
      }
      details.push(status);
    }

    return {
      totalValidated: records.length,
      passed,
      failed,
      details,
    };
  }
}
