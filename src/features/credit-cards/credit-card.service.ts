import { faker, Faker, en } from "@faker-js/faker";
import { generateId, randomPick, randomInt, createRng, type SeededRandom } from "@/core/utils/random";
import { calculateLuhnCheckDigit } from "@/core/utils/luhn";
import type { CreditCardNetwork } from "@/core/types/common";
import type {
  CreditCardGenerateConfig,
  CreditCardRecord,
  CreditCardGenerateResult,
} from "./credit-card.types";

const NETWORK_CONFIG: Record<
  CreditCardNetwork,
  { prefixes: string[]; length: number; cvvLength: number; issuers: string[] }
> = {
  visa: {
    prefixes: ["4"],
    length: 16,
    cvvLength: 3,
    issuers: ["Chase", "Bank of America", "Citi", "Wells Fargo", "Capital One"],
  },
  mastercard: {
    prefixes: ["51", "52", "53", "54", "55"],
    length: 16,
    cvvLength: 3,
    issuers: ["Citi", "Capital One", "Barclays", "HSBC", "Synchrony"],
  },
  amex: {
    prefixes: ["34", "37"],
    length: 15,
    cvvLength: 4,
    issuers: ["American Express"],
  },
  discover: {
    prefixes: ["6011", "644", "645", "646", "647", "648", "649", "65"],
    length: 16,
    cvvLength: 3,
    issuers: ["Discover Financial", "Pulse Network"],
  },
  diners: {
    prefixes: ["300", "301", "302", "303", "304", "305", "36", "38"],
    length: 14,
    cvvLength: 3,
    issuers: ["Diners Club International", "Carte Blanche"],
  },
};

function generateCardNumber(network: CreditCardNetwork, rng?: SeededRandom): string {
  const config = NETWORK_CONFIG[network];
  const prefix = randomPick(config.prefixes, rng);

  const digitsNeeded = config.length - prefix.length - 1;
  let partialNumber = prefix;
  for (let i = 0; i < digitsNeeded; i++) {
    partialNumber += rng ? rng.digit().toString() : Math.floor(Math.random() * 10).toString();
  }

  const checkDigit = calculateLuhnCheckDigit(partialNumber);
  return partialNumber + checkDigit.toString();
}

function formatCardNumber(number: string): string {
  if (number.length === 15) {
    return `${number.slice(0, 4)} ${number.slice(4, 10)} ${number.slice(10)}`;
  }
  return number.replace(/(.{4})/g, "$1 ").trim();
}

function generateExpiry(
  minMonths: number,
  maxMonths: number,
  expired: boolean,
  rng?: SeededRandom
): string {
  const now = new Date();

  if (expired) {
    const monthsAgo = randomInt(1, 36, rng);
    const past = new Date(now);
    past.setMonth(past.getMonth() - monthsAgo);
    const month = (past.getMonth() + 1).toString().padStart(2, "0");
    const year = (past.getFullYear() % 100).toString().padStart(2, "0");
    return `${month}/${year}`;
  }

  const monthsAhead = randomInt(minMonths, maxMonths, rng);
  const future = new Date(now);
  future.setMonth(future.getMonth() + monthsAhead);
  const month = (future.getMonth() + 1).toString().padStart(2, "0");
  const year = (future.getFullYear() % 100).toString().padStart(2, "0");
  return `${month}/${year}`;
}

function generateCVV(length: number, rng?: SeededRandom): string {
  if (rng) return rng.digits(length);
  let cvv = "";
  for (let i = 0; i < length; i++) {
    cvv += Math.floor(Math.random() * 10).toString();
  }
  return cvv;
}

export function generateCreditCards(
  config: CreditCardGenerateConfig
): CreditCardGenerateResult {
  const rng = createRng(config.options.seed);
  const f = rng
    ? new Faker({ locale: [en], randomizer: { next: () => rng.next(), seed: () => {} } })
    : faker;

  if (!rng && config.options.seed !== undefined) {
    faker.seed(config.options.seed);
  }

  const records: CreditCardRecord[] = [];
  const { fields, options } = config;

  for (let i = 0; i < config.count; i++) {
    const network = randomPick(config.networks, rng);
    const networkConfig = NETWORK_CONFIG[network];
    const record: CreditCardRecord = { id: generateId(rng) };

    if (fields.cardNumber) {
      const rawNumber = generateCardNumber(network, rng);
      record.cardNumber = options.formatted
        ? formatCardNumber(rawNumber)
        : rawNumber;
    }

    if (fields.cardHolder) {
      record.cardHolder = f.person.fullName().toUpperCase();
    }

    if (fields.expiryDate) {
      record.expiryDate = generateExpiry(
        options.expiryRange.minMonths,
        options.expiryRange.maxMonths,
        options.expired,
        rng
      );
    }

    if (fields.cvv) {
      record.cvv = generateCVV(networkConfig.cvvLength, rng);
    }

    if (fields.network) {
      record.network = network.charAt(0).toUpperCase() + network.slice(1);
    }

    if (fields.issuer) {
      record.issuer = randomPick(networkConfig.issuers, rng);
    }

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
      networks: config.networks,
      seed: config.options.seed,
    },
  };
}
