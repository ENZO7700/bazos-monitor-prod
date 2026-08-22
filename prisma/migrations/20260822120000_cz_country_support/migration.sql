-- AlterTable
ALTER TABLE "Watch" ADD COLUMN IF NOT EXISTS "countries" TEXT[] DEFAULT ARRAY['SK', 'CZ']::TEXT[];

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "country" TEXT NOT NULL DEFAULT 'SK';
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'EUR';

-- DropIndex
DROP INDEX IF EXISTS "Listing_watchId_externalId_key";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Listing_watchId_externalId_country_key" ON "Listing"("watchId", "externalId", "country");
