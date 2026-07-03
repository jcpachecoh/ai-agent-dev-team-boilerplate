-- OS-582 — Asignación de Turnos: extiende turno_assignments (NOM-08) con tipo (ASSIGNED/REST),
-- auditoría (createdBy/updatedBy) y unicidad por colaborador+fecha.

-- CreateEnum
CREATE TYPE "TurnoAssignmentType" AS ENUM ('ASSIGNED', 'REST');

-- AlterTable: turnoId pasa a ser opcional (REST no referencia un turno)
ALTER TABLE "turno_assignments" ALTER COLUMN "turnoId" DROP NOT NULL;

-- AlterTable: nuevas columnas
ALTER TABLE "turno_assignments"
  ADD COLUMN "type" "TurnoAssignmentType" NOT NULL DEFAULT 'ASSIGNED',
  ADD COLUMN "createdByUserId" TEXT,
  ADD COLUMN "updatedByUserId" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Regla de negocio: ASSIGNED requiere turnoId; REST requiere turnoId = null
ALTER TABLE "turno_assignments"
  ADD CONSTRAINT "turno_assignments_type_turno_check"
  CHECK (
    ("type" = 'ASSIGNED' AND "turnoId" IS NOT NULL)
    OR ("type" = 'REST' AND "turnoId" IS NULL)
  );

-- CreateIndex (unicidad: una asignación explícita por colaborador y fecha)
CREATE UNIQUE INDEX "turno_assignments_tenantId_employeeId_workDate_key" ON "turno_assignments"("tenantId", "employeeId", "workDate");

-- AddForeignKey
ALTER TABLE "turno_assignments" ADD CONSTRAINT "turno_assignments_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turno_assignments" ADD CONSTRAINT "turno_assignments_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
