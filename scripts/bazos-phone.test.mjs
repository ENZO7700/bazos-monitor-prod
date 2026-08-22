import test from "node:test";
import assert from "node:assert/strict";
import {
  extractPhonesFromText,
  htmlToPlainText,
  normalizePhoneE164,
} from "../src/lib/bazos-phone.ts";

// ── normalizePhoneE164 ──────────────────────────────────────────────

test("normalize: 0901234567 → +421901234567", () => {
  assert.equal(normalizePhoneE164("0901234567"), "+421901234567");
});

test("normalize: +421 901 234 567 → +421901234567", () => {
  assert.equal(normalizePhoneE164("+421 901 234 567"), "+421901234567");
});

test("normalize: 00421901234567 → +421901234567", () => {
  assert.equal(normalizePhoneE164("00421901234567"), "+421901234567");
});

test("normalize: +421-901-234-567", () => {
  assert.equal(normalizePhoneE164("+421-901-234-567"), "+421901234567");
});

test("normalize: (0901) 234 567", () => {
  assert.equal(normalizePhoneE164("(0901) 234 567"), "+421901234567");
});

test("normalize: bare 9-digit mobile 901234567", () => {
  assert.equal(normalizePhoneE164("901234567"), "+421901234567");
});

test("normalize: CZ +420 601 123 456", () => {
  assert.equal(normalizePhoneE164("+420 601 123 456"), "+420601123456");
});

test("normalize: 00420 777 123 456", () => {
  assert.equal(normalizePhoneE164("00420 777 123 456"), "+420777123456");
});

test("normalize: rejects short / junk", () => {
  assert.equal(normalizePhoneE164("12345"), null);
  assert.equal(normalizePhoneE164(""), null);
  assert.equal(normalizePhoneE164("abc"), null);
  assert.equal(normalizePhoneE164("81101"), null);
});

test("normalize: rejects all-same-digit fake", () => {
  assert.equal(normalizePhoneE164("+421111111111"), null);
  assert.equal(normalizePhoneE164("0000000000"), null); // national 0 + zeros of 0
});

// ── extractPhonesFromText ───────────────────────────────────────────

test("extract: plain SK mobile in text", () => {
  const { phones, raw } = extractPhonesFromText(
    "Volajte na 0901 234 567 po 18:00"
  );
  assert.deepEqual(phones, ["+421901234567"]);
  assert.ok(raw[0].includes("0901"));
});

test("extract: multiple formats, unique E.164", () => {
  const text = `
    Kontakt: +421 901 234 567
    Alebo 0901234567
    CZ: +420 601 111 222
  `;
  const { phones } = extractPhonesFromText(text);
  assert.equal(phones.length, 2);
  assert.ok(phones.includes("+421901234567"));
  assert.ok(phones.includes("+420601111222"));
});

test("extract: fabia-like HTML snippet", () => {
  const html = `
    <div class="popis">
      <p>Predám Škodu Fabia 1.2. Cena 1500 €. Lokalita: Nitra.</p>
      <p>Tel: <strong>0948 123 456</strong> alebo +421948123456</p>
      <p>IČO: 12345678 PSČ 949 01</p>
    </div>
  `;
  const { phones } = extractPhonesFromText(html);
  assert.deepEqual(phones, ["+421948123456"]);
});

test("extract: ignores prices and short numbers", () => {
  const text = "Cena 1500 €, rok 2019, km 120000, PSČ 811 01";
  const { phones } = extractPhonesFromText(text);
  assert.deepEqual(phones, []);
});

test("extract: empty / no phones", () => {
  assert.deepEqual(extractPhonesFromText(""), { phones: [], raw: [] });
  assert.deepEqual(extractPhonesFromText("<p>Bez kontaktu</p>"), {
    phones: [],
    raw: [],
  });
});

test("htmlToPlainText strips tags and scripts", () => {
  const plain = htmlToPlainText(
    `<script>var x=1</script><p>Tel 0901111222</p>`
  );
  assert.ok(!plain.includes("script"));
  assert.ok(plain.includes("0901111222"));
});
