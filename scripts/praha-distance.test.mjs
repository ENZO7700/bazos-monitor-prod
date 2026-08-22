import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateDistanceFromVaclavak,
  estimateBoltPrice,
  BOLT_MIN_FARE,
} from "../src/lib/praha-distance.ts";

test("calculateDistanceFromVaclavak: Praha 1 and central neighborhoods", () => {
  const p1 = calculateDistanceFromVaclavak("Praha 1 - Staré Město");
  assert.ok(p1);
  assert.ok(p1.km <= 1.0);
  assert.equal(p1.locationName, "Staré Město");
  assert.match(p1.formattedDistance, /m od Václaváku|km od Václaváku/);

  const vinohrady = calculateDistanceFromVaclavak("Praha 2, Vinohrady");
  assert.ok(vinohrady);
  assert.equal(vinohrady.km, 1.6);
  assert.equal(vinohrady.formattedDistance, "1.6 km od Václaváku");

  const zizkov = calculateDistanceFromVaclavak("Praha 3 - Žižkov");
  assert.ok(zizkov);
  assert.equal(zizkov.km, 2.4);
});

test("calculateDistanceFromVaclavak: Outer Prague districts", () => {
  const chodov = calculateDistanceFromVaclavak("Praha 4, Chodov");
  assert.ok(chodov);
  assert.equal(chodov.km, 9.2);

  const cernyMost = calculateDistanceFromVaclavak("Praha 14 - Černý Most");
  assert.ok(cernyMost);
  assert.equal(cernyMost.km, 12.5);

  const smichov = calculateDistanceFromVaclavak("Praha 5 - Smíchov");
  assert.ok(smichov);
  assert.equal(smichov.km, 2.8);
});

test("calculateDistanceFromVaclavak: Středočeský kraj cities", () => {
  const kladno = calculateDistanceFromVaclavak("Kladno");
  assert.ok(kladno);
  assert.equal(kladno.km, 31);
  assert.equal(kladno.locationName, "Kladno");

  const beroun = calculateDistanceFromVaclavak("Beroun, centrum");
  assert.ok(beroun);
  assert.equal(beroun.km, 34);

  const ricany = calculateDistanceFromVaclavak("Říčany u Prahy");
  assert.ok(ricany);
  assert.equal(ricany.km, 22);
});

test("calculateDistanceFromVaclavak: Prague postal codes (PSČ)", () => {
  const psc1 = calculateDistanceFromVaclavak("110 00");
  assert.ok(psc1);
  assert.ok(psc1.km <= 1.5);

  const psc4 = calculateDistanceFromVaclavak("140 00 Praha");
  assert.ok(psc4);
  assert.ok(psc4.km >= 3.0);
});

test("calculateDistanceFromVaclavak: Non-Czech or invalid locations return null", () => {
  assert.equal(calculateDistanceFromVaclavak("Bratislava"), null);
  assert.equal(calculateDistanceFromVaclavak("Košice"), null);
  assert.equal(calculateDistanceFromVaclavak(null), null);
  assert.equal(calculateDistanceFromVaclavak(""), null);
});

test("estimateBoltPrice: applies minimum fare and standard per-km calculations", () => {
  // Short ride (< 1 km) -> minimum fare 80 Kč
  const shortRide = estimateBoltPrice(0.5);
  assert.equal(shortRide.priceCzk, BOLT_MIN_FARE);
  assert.equal(shortRide.formattedPrice, `~${BOLT_MIN_FARE} Kč`);

  // Vinohrady (~1.6 km) -> 45 + 1.6 * (17 + 9) = 45 + 41.6 = ~87 Kč
  const vinohrady = estimateBoltPrice(1.6);
  assert.ok(vinohrady.priceCzk >= 80);
  assert.equal(vinohrady.priceCzk, 87);

  // Chodov (~9.2 km) -> 45 + 9.2 * 26 = 45 + 239.2 = ~284 Kč
  const chodov = estimateBoltPrice(9.2);
  assert.equal(chodov.priceCzk, 284);
  assert.equal(chodov.formattedPrice, "~284 Kč");

  // Kladno (~31 km) -> 45 + 31 * 26 = 45 + 806 = ~851 Kč
  const kladno = estimateBoltPrice(31);
  assert.equal(kladno.priceCzk, 851);
  assert.equal(kladno.formattedPrice, "~851 Kč");
});
