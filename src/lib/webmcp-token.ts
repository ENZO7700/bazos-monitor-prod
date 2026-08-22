export interface OriginTrialPayload {
  origin?: string;
  feature?: string;
  isThirdParty?: boolean;
}

export function parseOriginTrialPayload(token: string): OriginTrialPayload | null {
  // Payload is base64 JSON and always starts with "eyJ" (i.e. `{`).
  const payloadStart = token.lastIndexOf("eyJ");
  if (payloadStart === -1) return null;

  try {
    return JSON.parse(
      Buffer.from(token.slice(payloadStart), "base64").toString("utf8")
    ) as OriginTrialPayload;
  } catch {
    return null;
  }
}

export function isThirdPartyOriginTrialToken(token: string | undefined): boolean {
  if (!token) return false;
  return parseOriginTrialPayload(token)?.isThirdParty === true;
}

/** HTTP hlavičky len pre first-party token (third-party v meta/header na vlastnej stránke nefunguje). */
export function getWebMcpResponseHeaders(
  token: string | undefined
): Record<string, string> {
  if (!token || token.length < 50 || isThirdPartyOriginTrialToken(token)) {
    return {};
  }

  return {
    "Origin-Trial": token,
    "Permissions-Policy": "tools=(self)",
  };
}

export function injectOriginTrialToken(token: string): void {
  if (typeof document === "undefined") return;
  if (document.querySelector('meta[http-equiv="origin-trial"]')) return;

  const meta = document.createElement("meta");
  meta.httpEquiv = "origin-trial";
  meta.content = token;
  document.head.appendChild(meta);
}
