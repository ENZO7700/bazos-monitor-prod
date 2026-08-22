export function isCronAuthorized(request: Request): boolean {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  return auth === `Bearer ${secret}`;
}

export function requireProductionSecrets(): void {
  if (process.env.NODE_ENV !== "production") return;

  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.CRON_SECRET) missing.push("CRON_SECRET");

  if (missing.length > 0) {
    throw new Error(`Missing required production env: ${missing.join(", ")}`);
  }
}
