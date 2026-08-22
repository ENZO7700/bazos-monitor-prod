export function toApiError(error: unknown): { message: string; status: number } {
  const msg = error instanceof Error ? error.message : "Unknown error";

  if (
    msg.includes("Can't reach database") ||
    msg.includes("P1001") ||
    msg.includes("P1003") ||
    msg.includes("does not exist") ||
    msg.includes("Connection refused") ||
    msg.includes("ECONNREFUSED")
  ) {
    return { message: "Database unavailable", status: 503 };
  }

  return { message: msg, status: 500 };
}

export function apiErrorResponse(error: unknown) {
  const { message, status } = toApiError(error);
  return Response.json({ error: message }, { status });
}
