import { ZodError } from "zod";

const isProduction = process.env.NODE_ENV === "production";

const SENSITIVE_PATTERNS = [
  /postgresql:\/\//i,
  /mysql:\/\//i,
  /mongodb(\+srv)?:\/\//i,
  /redis:\/\//i,
  /:\/\/[^\s]+@[^\s]+/,
  /process\.env\.[A-Z0-9_]+/i,
  /Environment variable not found/i,
  /Missing (required )?env(ironment variable)?/i,
  /at\s+[\w./<>]+\s+\(/,
  /\/Users\/|\/home\/|C:\\Users\\/,
  /\bP\d{4}\b/,
  /\b(ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEDOUT)\b/,
  /\b(DATABASE_URL|CRON_SECRET|MISTRAL_API_KEY|VAPID_PRIVATE_KEY|VAPID_SUBJECT)\b/,
];

function looksSensitive(message: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(message));
}

function formatZodError(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join("; ");
}

function isDatabaseError(error: unknown, msg: string): boolean {
  const name = error instanceof Error ? error.name : "";
  const code = (error as { code?: string })?.code ?? "";

  return (
    msg.includes("Can't reach database") ||
    msg.includes("P1001") ||
    msg.includes("P1003") ||
    msg.includes("does not exist") ||
    msg.includes("Connection refused") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("connect") ||
    msg.includes("socket") ||
    code === "P1001" ||
    code === "ECONNREFUSED" ||
    name.includes("PrismaClientInitializationError") ||
    name.includes("DriverAdapterError")
  );
}

function clientMessageForServerError(msg: string): string {
  if (isProduction || looksSensitive(msg)) {
    return "Internal server error";
  }
  return msg;
}

export function toApiError(error: unknown): { message: string; status: number } {
  if (error instanceof ZodError) {
    return { message: formatZodError(error), status: 400 };
  }

  const msg = error instanceof Error ? error.message : "Unknown error";
  const code = (error as { code?: string })?.code ?? "";

  if (code === "P2025") {
    return { message: "Not found", status: 404 };
  }

  if (isDatabaseError(error, msg)) {
    return { message: "Database unavailable", status: 503 };
  }

  return { message: clientMessageForServerError(msg), status: 500 };
}

export function apiErrorResponse(error: unknown) {
  console.error("[api]", error);
  const { message, status } = toApiError(error);
  return Response.json({ error: message }, { status });
}
