export function trustedOrigins(): string[] {
  const port = process.env.PORT ?? 3000;

  return Array.from(
    new Set([
      process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
      process.env.NEXT_PUBLIC_APP_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      `http://localhost:${port}`,
      `http://127.0.0.1:${port}`,
    ]),
  ).filter((value): value is string => Boolean(value));
}

export function isTrustedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  return trustedOrigins().includes(origin);
}
