import type { SeededRandom } from "./random";

const IBAN_SPECS: Record<string, { length: number; bbanPattern: string }> = {
  DE: { length: 22, bbanPattern: "0000000000000000000" },
  GB: { length: 22, bbanPattern: "AAAA00000000000000" },
  FR: { length: 27, bbanPattern: "00000000000000000000000" },
  US: { length: 22, bbanPattern: "0000000000000000000" },
  IN: { length: 22, bbanPattern: "AAAA00000000000000" },
};

function randomDigitChar(rng?: SeededRandom): string {
  if (rng) return rng.digit().toString();
  return Math.floor(Math.random() * 10).toString();
}

function randomUpperChar(rng?: SeededRandom): string {
  if (rng) return rng.upperLetter();
  return String.fromCharCode(65 + Math.floor(Math.random() * 26));
}

function generateBBAN(pattern: string, rng?: SeededRandom): string {
  let result = "";
  for (const char of pattern) {
    if (char === "0") {
      result += randomDigitChar(rng);
    } else if (char === "A") {
      result += randomUpperChar(rng);
    } else {
      result += char;
    }
  }
  return result;
}

function mod97(value: string): number {
  let remainder = 0;
  for (const char of value) {
    remainder = (remainder * 10 + parseInt(char, 10)) % 97;
  }
  return remainder;
}

function letterToDigits(letter: string): string {
  return (letter.charCodeAt(0) - 55).toString();
}

function ibanStringToDigits(iban: string): string {
  let result = "";
  for (const char of iban.toUpperCase()) {
    if (char >= "A" && char <= "Z") {
      result += letterToDigits(char);
    } else {
      result += char;
    }
  }
  return result;
}

export function generateIBAN(countryCode: string = "DE", rng?: SeededRandom): string {
  const spec = IBAN_SPECS[countryCode.toUpperCase()] ?? IBAN_SPECS["DE"];
  const country = countryCode.toUpperCase().slice(0, 2);

  const bban = generateBBAN(spec.bbanPattern, rng);

  const rearranged = bban + country + "00";
  const numericString = ibanStringToDigits(rearranged);
  const checkDigits = (98 - mod97(numericString)).toString().padStart(2, "0");

  return country + checkDigits + bban;
}

export function formatIBAN(iban: string): string {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}
