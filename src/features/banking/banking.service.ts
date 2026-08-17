import { faker, Faker, en } from "@faker-js/faker";
import { generateId, randomPick, randomFloat, createRng, type SeededRandom } from "@/core/utils/random";
import { generateIBAN } from "@/core/utils/iban";
import type {
  BankingGenerateConfig,
  BankingRecord,
  BankingGenerateResult,
} from "./banking.types";

const BANK_NAMES = [
  "First National Bank",
  "Citizens Trust",
  "Pacific Union Bank",
  "Metropolitan Savings",
  "Heritage Financial",
  "Summit Credit Union",
  "Coastal Federal",
  "Liberty State Bank",
  "Pinnacle Bank & Trust",
  "Horizon Savings",
  "Commonwealth Bank",
  "Atlantic Federal",
  "Meridian Credit Union",
  "Silver Lake Financial",
  "Redwood Trust",
];

function generateRoutingNumber(rng?: SeededRandom): string {
  const digits: number[] = [];
  for (let i = 0; i < 8; i++) {
    digits.push(rng ? rng.digit() : Math.floor(Math.random() * 10));
  }

  const checkDigit =
    (3 * (digits[0] + digits[3] + digits[6]) +
      7 * (digits[1] + digits[4] + digits[7]) +
      (digits[2] + digits[5])) %
    10;

  const lastDigit = checkDigit === 0 ? 0 : 10 - checkDigit;
  digits.push(lastDigit);

  return digits.join("");
}

function generateSwiftCode(rng?: SeededRandom): string {
  const bankCode = rng
    ? rng.upperLetters(4)
    : Array.from({ length: 4 }, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
      ).join("");

  const countryCode = randomPick(["US", "GB", "DE", "FR", "JP", "IN", "CA"], rng);

  const locationCode = rng
    ? rng.upperLetters(2)
    : Array.from({ length: 2 }, () =>
        String.fromCharCode(48 + Math.floor(Math.random() * 36) > 57
          ? 65 + Math.floor(Math.random() * 26)
          : 48 + Math.floor(Math.random() * 10))
      ).join("");

  return bankCode + countryCode + locationCode;
}

export function generateBanking(
  config: BankingGenerateConfig
): BankingGenerateResult {
  const rng = createRng(config.options.seed);
  const f = rng
    ? new Faker({ locale: [en], randomizer: { next: () => rng.next(), seed: () => {} } })
    : faker;

  if (!rng && config.options.seed !== undefined) {
    faker.seed(config.options.seed);
  }

  const records: BankingRecord[] = [];
  const { fields, options } = config;

  for (let i = 0; i < config.count; i++) {
    const record: BankingRecord = { id: generateId(rng) };

    if (fields.bankName) record.bankName = randomPick(BANK_NAMES, rng);
    if (fields.accountNumber) record.accountNumber = f.finance.accountNumber(10);
    if (fields.routingNumber) record.routingNumber = generateRoutingNumber(rng);
    if (fields.swiftCode) record.swiftCode = generateSwiftCode(rng);
    if (fields.iban) record.iban = generateIBAN(options.country, rng);
    if (fields.accountType) record.accountType = randomPick(options.accountTypes, rng);
    if (fields.balance) {
      record.balance = randomFloat(
        options.balanceRange.min,
        options.balanceRange.max,
        2,
        rng
      );
    }
    if (fields.currency) record.currency = options.currency;

    records.push(record);
  }

  if (!rng && config.options.seed !== undefined) {
    faker.seed();
  }

  return {
    records,
    meta: {
      count: records.length,
      generatedAt: new Date().toISOString(),
      currency: options.currency,
      seed: config.options.seed,
    },
  };
}
