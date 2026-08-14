import { faker, Faker, en } from "@faker-js/faker";
import { generateId, createRng } from "@/core/utils/random";
import type {
  AddressGenerateConfig,
  AddressRecord,
  AddressGenerateResult,
} from "./address.types";

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  IN: "India",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  JP: "Japan",
};

export function generateAddresses(
  config: AddressGenerateConfig
): AddressGenerateResult {
  const rng = createRng(config.options.seed);
  const f = rng
    ? new Faker({ locale: [en], randomizer: { next: () => rng.next(), seed: () => {} } })
    : faker;

  if (!rng && config.options.seed !== undefined) {
    faker.seed(config.options.seed);
  }

  const records: AddressRecord[] = [];
  const { fields, options } = config;

  for (let i = 0; i < config.count; i++) {
    const record: AddressRecord = { id: generateId(rng) };

    const street = fields.street ? f.location.streetAddress() : undefined;
    const city = fields.city ? f.location.city() : undefined;

    let state: string | undefined;
    if (fields.state) {
      if (options.stateFilter.length > 0) {
        state = rng
          ? rng.pick(options.stateFilter)
          : options.stateFilter[Math.floor(Math.random() * options.stateFilter.length)];
      } else {
        state = f.location.state();
      }
    }

    const zipCode = fields.zipCode ? f.location.zipCode() : undefined;
    const countryName = COUNTRY_NAMES[config.country] ?? config.country;

    if (fields.street) record.street = street;
    if (fields.city) record.city = city;
    if (fields.state) record.state = state;
    if (fields.zipCode) record.zipCode = zipCode;
    if (fields.country) record.country = countryName;
    if (fields.county) record.county = f.location.county();
    if (fields.latitude) record.latitude = parseFloat(f.location.latitude().toString());
    if (fields.longitude) record.longitude = parseFloat(f.location.longitude().toString());

    if (fields.fullAddress) {
      const parts = [street, city, state, zipCode, countryName].filter(Boolean);
      record.fullAddress = parts.join(", ");
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
      country: config.country,
      seed: config.options.seed,
    },
  };
}
