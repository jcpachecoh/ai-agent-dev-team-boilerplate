-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SOLTERO', 'CASADO', 'UNION_LIBRE', 'DIVORCIADO', 'VIUDO');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMENINO', 'OTRO');

-- CreateTable
CREATE TABLE "employee_personal_data" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeDetailsId" TEXT NOT NULL,
    "nombres" TEXT,
    "primerApellido" TEXT,
    "segundoApellido" TEXT,
    "fechaNacimiento" DATE,
    "estadoCivil" "MaritalStatus",
    "sexo" "Gender",
    "departamento" TEXT,
    "ciudad" TEXT,
    "localidad" TEXT,
    "barrio" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "contactoEmergenciaNombre" TEXT,
    "contactoEmergenciaTelefono" TEXT,
    "contactoEmergenciaParentesco" TEXT,
    "profilePhotoStorageObjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_personal_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_personal_data_employeeDetailsId_key" ON "employee_personal_data"("employeeDetailsId");

-- CreateIndex
CREATE INDEX "employee_personal_data_tenantId_idx" ON "employee_personal_data"("tenantId");

-- AddForeignKey
ALTER TABLE "employee_personal_data" ADD CONSTRAINT "employee_personal_data_employeeDetailsId_fkey" FOREIGN KEY ("employeeDetailsId") REFERENCES "employee_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;
