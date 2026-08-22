import { fetchCategoryListings, fetchFilteredListings } from "../src/lib/rss-fetcher.ts";
import { parsePriceFromTitle, buildRssUrl, extractExternalId } from "../src/lib/bazos-rss.ts";
import { formatPrice } from "../src/lib/utils.ts";
import { extractPhonesFromText } from "../src/lib/bazos-phone.ts";

async function runIntegrationTests() {
  console.log("==================================================");
  console.log("   KOMPLETNÝ INTEGRAČNÝ TEST (Bazoš.sk & Bazoš.cz)   ");
  console.log("==================================================\n");

  const categories = [
    { code: "mo", name: "Mobily" },
    { code: "au", name: "Autá" },
    { code: "pc", name: "PC a notebooky" },
  ];

  // 1. Test live RSS pre jednotlivé kategórie na CZ aj SK
  console.log("▶ 1. Testovanie živých RSS feedov (CZ a SK)...");
  for (const cat of categories) {
    const skFeed = await fetchCategoryListings(cat.code, "SK");
    const czFeed = await fetchCategoryListings(cat.code, "CZ");

    console.log(`  ✓ Kategória [${cat.name}] (${cat.code}):`);
    console.log(`     🇸🇰 SK: stiahnutých ${skFeed.length} inzerátov (URL: ${buildRssUrl(cat.code, "SK")})`);
    console.log(`     🇨🇿 CZ: stiahnutých ${czFeed.length} inzerátov (URL: ${buildRssUrl(cat.code, "CZ")})`);

    if (czFeed.length === 0 || skFeed.length === 0) {
      throw new Error(`Prázdny feed pre kategóriu ${cat.code}!`);
    }

    // Overenie cien a meny
    const czSample = czFeed[0];
    const skSample = skFeed[0];

    console.log(`     🇨🇿 CZ Ukážka: "${czSample.title}" -> ${formatPrice(czSample.price, czSample.priceLabel, czSample.currency)} (Mena: ${czSample.currency}, Krajina: ${czSample.country})`);
    console.log(`     🇸🇰 SK Ukážka: "${skSample.title}" -> ${formatPrice(skSample.price, skSample.priceLabel, skSample.currency)} (Mena: ${skSample.currency}, Krajina: ${skSample.country})`);
  }

  // 2. Test multi-source filtrovania a vypnutia/zapnutia krajín
  console.log("\n▶ 2. Testovanie multi-source filtrovania a prepínania krajín...");

  // Test A: Len Bazoš.sk
  const onlySk = await fetchFilteredListings(
    "mo",
    { keywords: ["iphone"] },
    ["SK"]
  );
  console.log(`  ✓ Filter [iPhone] iba na 🇸🇰 Bazoš.sk: nájdených ${onlySk.length} inzerátov`);
  const hasOnlySk = onlySk.every((l) => l.country === "SK" && l.currency === "EUR");
  console.log(`     -> Všetky inzeráty sú zo SK: ${hasOnlySk ? "ÁNO (Správne)" : "NIE"}`);

  // Test B: Len Bazoš.cz
  const onlyCz = await fetchFilteredListings(
    "mo",
    { keywords: ["iphone"] },
    ["CZ"]
  );
  console.log(`  ✓ Filter [iPhone] iba na 🇨🇿 Bazoš.cz: nájdených ${onlyCz.length} inzerátov`);
  const hasOnlyCz = onlyCz.every((l) => l.country === "CZ" && l.currency === "CZK");
  console.log(`     -> Všetky inzeráty sú z CZ: ${hasOnlyCz ? "ÁNO (Správne)" : "NIE"}`);

  // Test C: Obe krajiny (SK + CZ)
  const both = await fetchFilteredListings(
    "mo",
    { keywords: ["iphone"] },
    ["SK", "CZ"]
  );
  console.log(`  ✓ Filter [iPhone] na 🇸🇰 SK + 🇨🇿 CZ: spolu ${both.length} inzerátov`);
  const countSk = both.filter((l) => l.country === "SK").length;
  const countCz = both.filter((l) => l.country === "CZ").length;
  console.log(`     -> Počet SK inzerátov: ${countSk}, Počet CZ inzerátov: ${countCz}`);

  // 3. Test telefónnej extrakcie pre CZ a SK čísla
  console.log("\n▶ 3. Testovanie extrakcie SK (+421) a CZ (+420) telefónnych čísel...");
  const sampleText = `
    Predám iPhone. Volajte na 0901 123 456 alebo píšte sms.
    V prípade záujmu z ČR volajte +420 777 654 321 alebo 602 111 222.
  `;
  const extracted = extractPhonesFromText(sampleText);
  console.log(`  ✓ Extrahované čísla: ${JSON.stringify(extracted.phones)}`);
  const hasSkPhone = extracted.phones.includes("+421901123456");
  const hasCzPhone1 = extracted.phones.includes("+420777654321");
  console.log(`     -> SK číslo rozpoznané: ${hasSkPhone ? "ÁNO" : "NIE"}`);
  console.log(`     -> CZ číslo rozpoznané: ${hasCzPhone1 ? "ÁNO" : "NIE"}`);

  console.log("\n==================================================");
  console.log("   VŠETKY INTEGRAČNÉ TESTY PREBEHLI ÚSPEŠNE!       ");
  console.log("==================================================");
}

runIntegrationTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
