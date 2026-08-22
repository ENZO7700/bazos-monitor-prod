import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const db = new PrismaClient({ adapter });

const defaultWatches = [
  {
    name: "🇨🇿 iPhone 16 / 17 (Praha & ČR)",
    category: "mo",
    keywords: ["iphone 16", "iphone 17", "iphone"],
    countries: ["CZ"],
  },
  {
    name: "🇨🇿 Apple MacBook od 20 000 Kč (Praha & ČR)",
    category: "pc",
    keywords: ["macbook"],
    minPrice: 20000,
    countries: ["CZ"],
  },
  {
    name: "🇨🇿 Notebook Razer Gaming (Praha & ČR)",
    category: "pc",
    keywords: ["razer"],
    countries: ["CZ"],
  },
  {
    name: "🇸🇰 Mobilné telefóny",
    category: "mo",
    keywords: ["iphone"],
    countries: ["SK"],
  },
];

async function main() {
  for (const watch of defaultWatches) {
    const existing = await db.watch.findFirst({
      where: { name: watch.name, category: watch.category },
    });

    if (existing) {
      await db.watch.update({
        where: { id: existing.id },
        data: {
          keywords: watch.keywords,
          minPrice: watch.minPrice ?? null,
          countries: watch.countries,
          isActive: true,
        },
      });
      console.log(`Updated watch: ${watch.name}`);
    } else {
      await db.watch.create({ data: watch });
      console.log(`Created watch: ${watch.name}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
