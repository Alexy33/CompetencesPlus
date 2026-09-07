export const MINIMUM_AGE = 16;

export const MAJORITY_AGE = 18;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function ageOn(birthDate: string | null | undefined, reference: Date = new Date()): number | null {
  if (!birthDate) return null;

  const match = ISO_DATE.exec(birthDate.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const asDate = new Date(Date.UTC(year, month - 1, day));
  if (
    asDate.getUTCFullYear() !== year ||
    asDate.getUTCMonth() !== month - 1 ||
    asDate.getUTCDate() !== day
  ) {
    return null;
  }

  let age = reference.getFullYear() - year;

  const monthDelta = reference.getMonth() + 1 - month;
  if (monthDelta < 0 || (monthDelta === 0 && reference.getDate() < day)) {
    age -= 1;
  }

  if (age < 0) return null;

  return age;
}

export function isAllowedToRegister(birthDate: string | null | undefined, reference?: Date): boolean {
  const age = ageOn(birthDate, reference);
  return age !== null && age >= MINIMUM_AGE;
}

export function isMinor(birthDate: string | null | undefined, reference?: Date): boolean {
  const age = ageOn(birthDate, reference);
  return age !== null && age < MAJORITY_AGE;
}

export function latestAllowedBirthDate(reference: Date = new Date()): string {
  const limit = new Date(
    Date.UTC(reference.getFullYear() - MINIMUM_AGE, reference.getMonth(), reference.getDate()),
  );
  return limit.toISOString().slice(0, 10);
}
