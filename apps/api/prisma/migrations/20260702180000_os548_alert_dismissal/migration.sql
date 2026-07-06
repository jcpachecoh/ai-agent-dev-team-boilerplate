-- CreateTable
CREATE TABLE "attendance_alert_dismissals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertKey" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_alert_dismissals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_alert_dismissals_tenantId_userId_idx" ON "attendance_alert_dismissals"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_alert_dismissals_tenantId_userId_alertKey_key" ON "attendance_alert_dismissals"("tenantId", "userId", "alertKey");
