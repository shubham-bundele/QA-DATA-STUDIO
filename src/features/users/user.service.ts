import { faker, Faker, en } from "@faker-js/faker";
import { generateId, createRng, type SeededRandom } from "@/core/utils/random";
import type {
  UserGenerateConfig,
  UserRecord,
  UserGenerateResult,
} from "./user.types";

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=";

function generatePassword(length: number, rng?: SeededRandom): string {
  const allChars = UPPER + LOWER + DIGITS + SYMBOLS;
  const pickChar = (chars: string) =>
    rng ? rng.char(chars) : chars[Math.floor(Math.random() * chars.length)];

  const required = [
    pickChar(UPPER),
    pickChar(LOWER),
    pickChar(DIGITS),
    pickChar(SYMBOLS),
  ];

  const remaining: string[] = [];
  for (let i = 0; i < length - required.length; i++) {
    remaining.push(pickChar(allChars));
  }

  const all = [...required, ...remaining];
  if (rng) {
    return rng.shuffle(all).join("");
  }
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.join("");
}

export function generateUsers(config: UserGenerateConfig): UserGenerateResult {
  const rng = createRng(config.options.seed);
  const f = rng
    ? new Faker({ locale: [en], randomizer: { next: () => rng.next(), seed: () => {} } })
    : faker;

  if (!rng && config.options.seed !== undefined) {
    faker.seed(config.options.seed);
  }

  const records: UserRecord[] = [];
  const { fields, options } = config;

  for (let i = 0; i < config.count; i++) {
    const firstName = fields.firstName ? f.person.firstName() : undefined;
    const lastName = fields.lastName ? f.person.lastName() : undefined;

    const record: UserRecord = {
      id: generateId(rng),
    };

    if (fields.firstName) record.firstName = firstName;
    if (fields.lastName) record.lastName = lastName;

    if (fields.email) {
      if (options.emailDomains.length > 0) {
        const domain = rng
          ? rng.pick(options.emailDomains)
          : options.emailDomains[Math.floor(Math.random() * options.emailDomains.length)];
        const localPart = f.internet
          .username({ firstName: firstName ?? undefined, lastName: lastName ?? undefined })
          .toLowerCase();
        record.email = `${localPart}@${domain}`;
      } else {
        record.email = f.internet.email({
          firstName: firstName ?? undefined,
          lastName: lastName ?? undefined,
        });
      }
    }

    if (fields.phone) record.phone = f.phone.number();

    if (fields.dateOfBirth || fields.age) {
      const birthDate = f.date.birthdate({
        min: options.ageRange.min,
        max: options.ageRange.max,
        mode: "age",
      });

      if (fields.dateOfBirth) {
        record.dateOfBirth = birthDate.toISOString().split("T")[0];
      }

      if (fields.age) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        record.age = age;
      }
    }

    if (fields.gender) record.gender = f.person.sex();

    if (fields.username) {
      record.username = f.internet.username({
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
      });
    }

    if (fields.password) {
      record.password = generatePassword(options.passwordLength, rng);
    }

    if (fields.avatar) record.avatar = f.image.avatar();

    if (fields.ssn) {
      record.ssn = f.string.numeric("###-##-####");
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
      locale: config.locale,
      seed: config.options.seed,
    },
  };
}
