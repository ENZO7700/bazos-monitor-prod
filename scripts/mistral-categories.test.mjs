import test from "node:test";
import assert from "node:assert/strict";
import { localMistralClassifier, MISTRAL_PRODUCTION_SYSTEM_PROMPT } from "../src/lib/mistral.ts";
import { BAZOS_CATEGORIES } from "../src/lib/categories.ts";

test("MISTRAL_PRODUCTION_SYSTEM_PROMPT contains all 15 Bazos categories", () => {
  for (const cat of BAZOS_CATEGORIES) {
    assert.ok(
      MISTRAL_PRODUCTION_SYSTEM_PROMPT.includes(`"${cat.code}"`),
      `Prompt must include category code "${cat.code}" (${cat.name})`
    );
  }
});

// Test 1: Auto (au)
test("Mistral: Kategória [au] Auto (SK a CZ)", () => {
  const res1 = localMistralClassifier("Škoda Octavia Combi do 7000 eur v Žiline");
  assert.equal(res1.category, "au");
  assert.equal(res1.maxPrice, 7000);
  assert.deepEqual(res1.countries, ["SK"]);

  const res2 = localMistralClassifier("Prodej auta Volkswagen Golf v Praze do 150000 kč");
  assert.equal(res2.category, "au");
  assert.equal(res2.maxPrice, 150000);
  assert.deepEqual(res2.countries, ["CZ"]);
});

// Test 2: Mobilné telefóny (mo)
test("Mistral: Kategória [mo] Mobilné telefóny", () => {
  const res = localMistralClassifier("iPhone 15 Pro Max 256gb do 900 eur");
  assert.equal(res.category, "mo");
  assert.equal(res.maxPrice, 900);
  assert.ok(res.keywords.includes("iphone"));
});

// Test 3: PC (pc)
test("Mistral: Kategória [pc] PC, notebooky a konzoly", () => {
  const res1 = localMistralClassifier("Herný notebook Asus ROG do 800 eur");
  assert.equal(res1.category, "pc");
  assert.equal(res1.maxPrice, 800);

  const res2 = localMistralClassifier("Grafická karta RTX 4070 v Brně do 14000 kč");
  assert.equal(res2.category, "pc");
  assert.deepEqual(res2.countries, ["CZ"]);
});

// Test 4: Reality (re)
test("Mistral: Kategória [re] Reality a prenájom", () => {
  const res = localMistralClassifier("2-izbový byt na prenájom v Bratislave do 650 eur");
  assert.equal(res.category, "re");
  assert.equal(res.maxPrice, 650);
  assert.deepEqual(res.countries, ["SK"]);
});

// Test 5: Nábytok (na)
test("Mistral: Kategória [na] Nábytok", () => {
  const res = localMistralClassifier("Rozťahovacia rohová sedačka a stôl do obývačky");
  assert.equal(res.category, "na");
  assert.ok(res.keywords.includes("stôl") || res.keywords.includes("sedačka"));
});

// Test 6: Šport (sp)
test("Mistral: Kategória [sp] Šport a bicykle", () => {
  const res = localMistralClassifier("Horský bicykel CTM veľkosť L do 450 eur");
  assert.equal(res.category, "sp");
  assert.equal(res.maxPrice, 450);
});

// Test 7: Hudba (hu)
test("Mistral: Kategória [hu] Hudobné nástroje", () => {
  const res = localMistralClassifier("Elektrická gitara Fender Stratocaster");
  assert.equal(res.category, "hu");
  assert.ok(res.keywords.includes("gitara"));
});

// Test 8: Deti (de)
test("Mistral: Kategória [de] Deti a kočíky", () => {
  const res = localMistralClassifier("Kombinovaný kočík Cybex Priam s vajíčkom");
  assert.equal(res.category, "de");
  assert.ok(res.keywords.includes("kočík"));
});

// Test 9: Zvieratá (zv)
test("Mistral: Kategória [zv] Zvieratá a chov", () => {
  const res = localMistralClassifier("Šteniatko nemecký ovčiak s preukazom pôvodu");
  assert.equal(res.category, "zv");
  assert.ok(res.keywords.includes("šteniatko") || res.keywords.includes("ovčiak"));
});

// Test 10: Stroje (st)
test("Mistral: Kategória [st] Stroje a traktory", () => {
  const res = localMistralClassifier("Traktor Zetor 7245 s čelným nakladačom");
  assert.equal(res.category, "st");
  assert.ok(res.keywords.includes("traktor"));
});

// Test 11: Dom a záhrada (do)
test("Mistral: Kategória [do] Dom a záhrada", () => {
  const res = localMistralClassifier("Benzínová kosačka Stihl s pojazdom");
  assert.equal(res.category, "do");
  assert.ok(res.keywords.includes("kosačka"));
});

// Test 12: Služby (sl)
test("Mistral: Kategória [sl] Služby a remeslá", () => {
  const res = localMistralClassifier("Rekonštrukcia bytu a obkladačské práce");
  assert.equal(res.category, "sl");
  assert.ok(res.keywords.includes("rekonštrukcia") || res.keywords.includes("obkladačské"));
});

// Test 13: Práca (pr)
test("Mistral: Kategória [pr] Práca a zamestnanie", () => {
  const res = localMistralClassifier("Hľadám prácu ako vodič C+E medzinárodná doprava");
  assert.equal(res.category, "pr");
});

// Test 14: Motocykle (mc)
test("Mistral: Kategória [mc] Motocykle a skútre", () => {
  const res = localMistralClassifier("Yamaha MT-07 motorka do 6000 eur");
  assert.equal(res.category, "mc");
  assert.equal(res.maxPrice, 6000);
});

// Test 15: Hodinky a ostatné (os)
test("Mistral: Kategória [os] Hodinky a ostatné", () => {
  const res = localMistralClassifier("Pánske hodinky Garmin Fenix 7 Sapphire");
  assert.equal(res.category, "os");
  assert.ok(res.keywords.includes("hodinky"));
});
