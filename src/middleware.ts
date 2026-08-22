import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getWebMcpResponseHeaders } from "@/lib/webmcp-token";

export function middleware(request: NextRequest) {
  void request;
  const response = NextResponse.next();
  const headers = getWebMcpResponseHeaders(
    process.env.NEXT_PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN
  );

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|screenshots).*)"],
};
