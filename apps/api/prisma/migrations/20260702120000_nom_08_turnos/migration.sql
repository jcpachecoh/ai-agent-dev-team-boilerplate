-- CreateEnum
CREATE TYPE "TurnoTipo" AS ENUM ('PERMANENTE', 'VARIABLE');

-- CreateEnum
CREATE TYPE "TurnoJornada" AS ENUM ('DIURNO', 'NOCTURNO', 'MIXTO');

-- CreateTable
CREATE TABLE "turnos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "sigla" VARCHAR(30) NOT NULL,
    "tipo" "TurnoTipo" NOT NULL,
    "jornada" "TurnoJornada" NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turno_assignments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "turnoId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turno_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "turnos_tenantId_estado_idx" ON "turnos"("tenantId", "estado");

-- CreateIndex
CREATE INDEX "turnos_tenantId_nombre_idx" ON "turnos"("tenantId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "turnos_tenantId_sigla_key" ON "turnos"("tenantId", "sigla");

-- CreateIndex
CREATE INDEX "turno_assignments_tenantId_turnoId_workDate_idx" ON "turno_assignments"("tenantId", "turnoId", "workDate");

-- CreateIndex
CREATE INDEX "turno_assignments_tenantId_employeeId_workDate_idx" ON "turno_assignments"("tenantId", "employeeId", "workDate");

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turno_assignments" ADD CONSTRAINT "turno_assignments_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "turnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turno_assignments" ADD CONSTRAINT "turno_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
