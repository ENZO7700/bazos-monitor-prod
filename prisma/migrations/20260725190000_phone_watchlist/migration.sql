-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "phonesFetchedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ListingPhone" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "phoneRaw" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingPhone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneWatch" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "phoneE164" TEXT NOT NULL,
    "phoneRaw" TEXT NOT NULL,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneWatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneMatch" (
    "id" TEXT NOT NULL,
    "phoneWatchId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seen" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PhoneMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListingPhone_phoneE164_idx" ON "ListingPhone"("phoneE164");

-- CreateIndex
CREATE UNIQUE INDEX "ListingPhone_listingId_phoneE164_key" ON "ListingPhone"("listingId", "phoneE164");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneWatch_phoneE164_key" ON "PhoneWatch"("phoneE164");

-- CreateIndex
CREATE INDEX "PhoneMatch_seen_idx" ON "PhoneMatch"("seen");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneMatch_phoneWatchId_listingId_key" ON "PhoneMatch"("phoneWatchId", "listingId");

-- AddForeignKey
ALTER TABLE "ListingPhone" ADD CONSTRAINT "ListingPhone_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneMatch" ADD CONSTRAINT "PhoneMatch_phoneWatchId_fkey" FOREIGN KEY ("phoneWatchId") REFERENCES "PhoneWatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneMatch" ADD CONSTRAINT "PhoneMatch_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
