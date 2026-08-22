import test from "node:test";
import assert from "node:assert/strict";
import {
  getWebMcpResponseHeaders,
  isThirdPartyOriginTrialToken,
  parseOriginTrialPayload,
} from "../src/lib/webmcp-token.ts";

function fakeToken(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `fake-signature/${encoded}`;
}

const firstParty = fakeToken({
  origin: "https://bazos-monitor.vercel.app",
  isThirdParty: false,
  feature: "WebMCP",
});

const thirdParty = fakeToken({
  origin: "https://bazos-monitor.vercel.app",
  isThirdParty: true,
  feature: "WebMCP",
});

test("parseOriginTrialPayload decodes token metadata", () => {
  assert.deepEqual(parseOriginTrialPayload(firstParty), {
    origin: "https://bazos-monitor.vercel.app",
    isThirdParty: false,
    feature: "WebMCP",
  });
});

test("isThirdPartyOriginTrialToken detects third-party registration", () => {
  assert.equal(isThirdPartyOriginTrialToken(thirdParty), true);
  assert.equal(isThirdPartyOriginTrialToken(firstParty), false);
  assert.equal(isThirdPartyOriginTrialToken(undefined), false);
});

test("getWebMcpResponseHeaders omits Permissions-Policy for third-party token", () => {
  assert.deepEqual(getWebMcpResponseHeaders(thirdParty), {});
});

test("getWebMcpResponseHeaders sets headers for first-party token", () => {
  assert.deepEqual(getWebMcpResponseHeaders(firstParty), {
    "Origin-Trial": firstParty,
    "Permissions-Policy": "tools=(self)",
  });
});

test("getWebMcpResponseHeaders ignores short or missing token", () => {
  assert.deepEqual(getWebMcpResponseHeaders(""), {});
  assert.deepEqual(getWebMcpResponseHeaders("short"), {});
});
