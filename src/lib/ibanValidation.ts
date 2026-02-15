/**
 * Basic IBAN validation:
 * - Removes spaces, converts to uppercase
 * - Checks length per country code
 * - Validates MOD-97 checksum (ISO 13616)
 */

const IBAN_LENGTHS: Record<string, number> = {
  DE: 22, AT: 20, CH: 21, FR: 27, IT: 27, ES: 24, NL: 18,
  BE: 16, LU: 20, PT: 25, GB: 22, IE: 22, PL: 28, CZ: 24,
  DK: 18, SE: 24, NO: 15, FI: 18, GR: 27, HR: 21, HU: 28,
  RO: 24, BG: 22, SK: 24, SI: 19, LT: 20, LV: 21, EE: 20,
};

export function formatIban(raw: string): string {
  const clean = raw.replace(/\s/g, "").toUpperCase();
  return clean.replace(/(.{4})/g, "$1 ").trim();
}

export function validateIban(raw: string): { valid: boolean; error?: string } {
  const iban = raw.replace(/\s/g, "").toUpperCase();

  if (iban.length < 5) {
    return { valid: false, error: "IBAN ist zu kurz." };
  }

  const country = iban.slice(0, 2);
  if (!/^[A-Z]{2}$/.test(country)) {
    return { valid: false, error: "Ungültiger Ländercode." };
  }

  const expectedLength = IBAN_LENGTHS[country];
  if (expectedLength && iban.length !== expectedLength) {
    return { valid: false, error: `IBAN für ${country} muss ${expectedLength} Zeichen haben.` };
  }

  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) {
    return { valid: false, error: "IBAN enthält ungültige Zeichen." };
  }

  // MOD-97 check
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged
    .split("")
    .map((c) => {
      const code = c.charCodeAt(0);
      return code >= 65 && code <= 90 ? (code - 55).toString() : c;
    })
    .join("");

  // BigInt-free modulo for large numbers
  let remainder = 0;
  for (const digit of numeric) {
    remainder = (remainder * 10 + parseInt(digit, 10)) % 97;
  }

  if (remainder !== 1) {
    return { valid: false, error: "IBAN-Prüfsumme ungültig." };
  }

  return { valid: true };
}

export function validateBic(raw: string): { valid: boolean; error?: string } {
  const bic = raw.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) {
    return { valid: false, error: "Ungültiges BIC-Format." };
  }
  return { valid: true };
}
