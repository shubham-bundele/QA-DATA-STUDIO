import { describe, it, expect } from "vitest";
import { generateAddresses } from "@/features/addresses/address.service";
import type { AddressGenerateConfig } from "@/features/addresses/address.types";

const defaultFields = {
  street: true,
  city: true,
  state: true,
  zipCode: true,
  country: true,
  county: false,
  latitude: false,
  longitude: false,
  fullAddress: false,
};

type ConfigOverrides = Omit<Partial<AddressGenerateConfig>, "fields" | "options"> & {
  fields?: Partial<AddressGenerateConfig["fields"]>;
  options?: Partial<AddressGenerateConfig["options"]>;
};

function makeConfig(overrides: ConfigOverrides = {}): AddressGenerateConfig {
  const { fields, options, ...rest } = overrides;
  return {
    count: 5,
    country: "US",
    ...rest,
    fields: { ...defaultFields, ...fields },
    options: { stateFilter: [], ...options },
  };
}

describe("generateAddresses", () => {
  it("returns the requested record count", () => {
    const result = generateAddresses(makeConfig({ count: 7 }));
    expect(result.records).toHaveLength(7);
  });

  it("records contain default fields", () => {
    const result = generateAddresses(makeConfig());
    for (const record of result.records) {
      expect(record).toHaveProperty("id");
      expect(record.street).toBeDefined();
      expect(record.city).toBeDefined();
      expect(record.state).toBeDefined();
      expect(record.zipCode).toBeDefined();
      expect(record.country).toBeDefined();
    }
  });

  it("optional fields (latitude, longitude) absent when disabled", () => {
    const result = generateAddresses(makeConfig());
    for (const record of result.records) {
      expect(record.latitude).toBeUndefined();
      expect(record.longitude).toBeUndefined();
    }
  });

  it("optional fields present when enabled", () => {
    const result = generateAddresses(
      makeConfig({
        fields: { latitude: true, longitude: true },
      })
    );
    for (const record of result.records) {
      expect(record.latitude).toBeDefined();
      expect(typeof record.latitude).toBe("number");
      expect(record.longitude).toBeDefined();
      expect(typeof record.longitude).toBe("number");
    }
  });

  it("country in meta matches config", () => {
    const result = generateAddresses(makeConfig({ country: "GB" }));
    expect(result.meta.country).toBe("GB");
  });

  it("config is not mutated", () => {
    const config = makeConfig({ count: 3 });
    const snapshot = JSON.parse(JSON.stringify(config));
    generateAddresses(config);
    expect(config).toEqual(snapshot);
  });

  it("count of 1 works", () => {
    const result = generateAddresses(makeConfig({ count: 1 }));
    expect(result.records).toHaveLength(1);
    expect(result.meta.count).toBe(1);
  });
});
