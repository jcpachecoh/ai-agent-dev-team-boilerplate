-- Ley 1581 — consentimiento biométrico y geolocalización (OS-499/500/505)

CREATE TYPE "ConsentType" AS ENUM ('BIOMETRICO_FACIAL', 'GEOLOCALIZACION');

CREATE TABLE "data_processing_policies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "consentLabel" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "data_processing_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "data_consents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "consentType" "ConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_consents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "data_processing_policies_tenantId_version_key" ON "data_processing_policies"("tenantId", "version");
CREATE INDEX "data_processing_policies_tenantId_idx" ON "data_processing_policies"("tenantId");
CREATE INDEX "data_processing_policies_tenantId_isActive_idx" ON "data_processing_policies"("tenantId", "isActive");
CREATE INDEX "data_processing_policies_deletedAt_idx" ON "data_processing_policies"("deletedAt");

CREATE UNIQUE INDEX "data_consents_employeeId_consentType_policyVersion_key" ON "data_consents"("employeeId", "consentType", "policyVersion");
CREATE INDEX "data_consents_tenantId_idx" ON "data_consents"("tenantId");
CREATE INDEX "data_consents_employeeId_idx" ON "data_consents"("employeeId");
CREATE INDEX "data_consents_tenantId_employeeId_consentType_idx" ON "data_consents"("tenantId", "employeeId", "consentType");

ALTER TABLE "data_consents" ADD CONSTRAINT "data_consents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;
