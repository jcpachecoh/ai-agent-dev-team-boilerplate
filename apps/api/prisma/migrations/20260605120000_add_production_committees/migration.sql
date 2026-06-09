-- MES-10: Production committees for grouped OP creation.
-- Committee consecutive (OP0001) is independent from production_orders.number.

-- CreateEnum
CREATE TYPE "ProductionCommitteeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "production_committees" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "ProductionCommitteeStatus" NOT NULL DEFAULT 'DRAFT',
    "ordersCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_committees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_committee_members" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_committee_members_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "production_orders" ADD COLUMN "committeeId" TEXT;

-- CreateIndex
CREATE INDEX "production_committees_tenantId_status_idx" ON "production_committees"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "production_committees_tenantId_number_key" ON "production_committees"("tenantId", "number");

-- CreateIndex
CREATE INDEX "production_committee_members_committeeId_idx" ON "production_committee_members"("committeeId");

-- CreateIndex
CREATE INDEX "production_committee_members_userId_idx" ON "production_committee_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "production_committee_members_committeeId_userId_key" ON "production_committee_members"("committeeId", "userId");

-- CreateIndex
CREATE INDEX "production_orders_committeeId_idx" ON "production_orders"("committeeId");

-- AddForeignKey
ALTER TABLE "production_committee_members" ADD CONSTRAINT "production_committee_members_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "production_committees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_committee_members" ADD CONSTRAINT "production_committee_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "production_committees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
