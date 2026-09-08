const NINE_DIGITS = /^\d{9}$/;

export function normalizeSiren(raw: string | null | undefined): string {
  return (raw ?? "").replace(/[\s.\-]/g, "");
}

export function isValidSiren(raw: string | null | undefined): boolean {
  const siren = normalizeSiren(raw);
  if (!NINE_DIGITS.test(siren)) return false;
  if (siren === "000000000") return false;

  return luhnSum(siren) % 10 === 0;
}

function luhnSum(digits: string): number {
  let total = 0;

  for (let index = 0; index < digits.length; index += 1) {
    let value = Number(digits[index]);

    if (index % 2 === 1) {
      value *= 2;
      if (value > 9) value -= 9;
    }

    total += value;
  }

  return total;
}

export function formatSiren(siren: string): string {
  const normalized = normalizeSiren(siren);
  if (!NINE_DIGITS.test(normalized)) return siren;
  return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`;
}
