-- AlterTable
ALTER TABLE "locations" ADD COLUMN "address" TEXT NOT NULL DEFAULT '';
ALTER TABLE "locations" ADD COLUMN "city" TEXT;
ALTER TABLE "locations" ADD COLUMN "phone" TEXT;
ALTER TABLE "locations" ADD COLUMN "latitude" TEXT;
ALTER TABLE "locations" ADD COLUMN "longitude" TEXT;
ALTER TABLE "locations" ADD COLUMN "deletedAt" TIMESTAMP(3);

UPDATE "locations" SET "address" = COALESCE("name", 'Sin dirección') WHERE "address" = '';

-- CreateIndex
CREATE INDEX "locations_deletedAt_idx" ON "locations"("deletedAt");

-- CreateTable
CREATE TABLE "user_locations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_locations_tenantId_idx" ON "user_locations"("tenantId");

-- CreateIndex
CREATE INDEX "user_locations_locationId_idx" ON "user_locations"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "user_locations_userId_locationId_key" ON "user_locations"("userId", "locationId");

-- AddForeignKey
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
