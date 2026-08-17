/**
 * Luhn algorithm — used to generate valid-looking credit card numbers.
 *
 * HOW IT WORKS:
 * 1. Start from the rightmost digit, double every second digit
 * 2. If doubling produces a number > 9, subtract 9
 * 3. Sum all digits
 * 4. The check digit makes the total sum divisible by 10
 */

export function calculateLuhnCheckDigit(partialNumber: string): number {
  const digits = partialNumber.split("").map(Number).reverse();
  let sum = 0;

  for (let i = 0; i < digits.length; i++) {
    let digit = digits[i];
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  return (10 - (sum % 10)) % 10;
}

export function isLuhnValid(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s|-/g, "");
  const digits = cleaned.split("").map(Number).reverse();
  let sum = 0;

  for (let i = 0; i < digits.length; i++) {
    let digit = digits[i];
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  return sum % 10 === 0;
}
