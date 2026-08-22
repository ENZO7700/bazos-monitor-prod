import test from "node:test";
import assert from "node:assert/strict";
import {
  extractContactsFromListings,
  generateVcfContacts,
  generateCsvContacts,
} from "../src/lib/contacts-export.ts";

test("Contacts: extracts and aggregates contacts with multi-ad detection", () => {
  const mockListings = [
    {
      id: "ad-1",
      title: "iPhone 16 Pro Max",
      price: 30000,
      country: "CZ",
      location: "Praha 2 - Vinohrady",
      url: "https://www.bazos.cz/inzerat/123/iphone.php",
      listingPhones: [{ phoneE164: "+420777123456", phoneRaw: "777 123 456" }],
    },
    {
      id: "ad-2",
      title: "Apple Watch Ultra 2",
      price: 15000,
      country: "CZ",
      location: "Praha 2 - Vinohrady",
      url: "https://www.bazos.cz/inzerat/124/watch.php",
      listingPhones: [{ phoneE164: "+420777123456", phoneRaw: "777 123 456" }],
    },
    {
      id: "ad-3",
      title: "PlayStation 5",
      price: 450,
      country: "SK",
      location: "Bratislava - Ružinov",
      url: "https://www.bazos.sk/inzerat/456/ps5.php",
      listingPhones: [{ phoneE164: "+421901234567", phoneRaw: "0901 234 567" }],
    },
  ];

  const contacts = extractContactsFromListings(mockListings);
  assert.equal(contacts.length, 2);

  // First contact should be the multi-seller (+420777123456 with 2 ads)
  const c1 = contacts[0];
  assert.equal(c1.phone, "+420777123456");
  assert.equal(c1.listingCount, 2);
  assert.equal(c1.country, "CZ");
  assert.equal(c1.location, "Praha 2 - Vinohrady");

  // Second contact (+421901234567 with 1 ad)
  const c2 = contacts[1];
  assert.equal(c2.phone, "+421901234567");
  assert.equal(c2.listingCount, 1);
  assert.equal(c2.country, "SK");
});

test("Contacts: generates standard vCard 3.0 string for mobile import", () => {
  const contacts = [
    {
      phone: "+420777123456",
      name: "Predajca Praha",
      location: "Praha 1",
      country: "CZ",
      listingCount: 2,
      listings: [
        { id: "1", title: "iPhone 16", price: 20000, priceFormatted: "20 000 Kč", url: "https://bazos.cz/1" },
        { id: "2", title: "MacBook", price: 30000, priceFormatted: "30 000 Kč", url: "https://bazos.cz/2" },
      ],
    },
  ];

  const vcf = generateVcfContacts(contacts);
  assert.ok(vcf.includes("BEGIN:VCARD"));
  assert.ok(vcf.includes("VERSION:3.0"));
  assert.ok(vcf.includes("TEL;TYPE=CELL:+420777123456"));
  assert.ok(vcf.includes("ADR;TYPE=HOME:;;;Praha 1;;;"));
  assert.ok(vcf.includes("END:VCARD"));
});

test("Contacts: generates CSV table with UTF-8 BOM for Excel", () => {
  const contacts = [
    {
      phone: "+420777123456",
      name: "Predajca Praha",
      location: "Praha 1",
      country: "CZ",
      listingCount: 1,
      listings: [
        { id: "1", title: "iPhone 16", price: 20000, priceFormatted: "20 000 Kč", url: "https://bazos.cz/1" },
      ],
    },
  ];

  const csv = generateCsvContacts(contacts);
  assert.ok(csv.startsWith("\uFEFF")); // UTF-8 BOM
  assert.ok(csv.includes("Telefón,Krajina,Lokalita,Počet inzerátov,Inzeráty"));
  assert.ok(csv.includes('"+420777123456","CZ","Praha 1",1'));
});
