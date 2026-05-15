-- CreateEnum
CREATE TYPE "SupplierTipo" AS ENUM ('PERSONA_NATURAL', 'PERSONA_JURIDICA');

-- CreateEnum
CREATE TYPE "CondicionPago" AS ENUM ('CONTADO', 'DIAS_15', 'DIAS_30', 'DIAS_60');

-- CreateEnum
CREATE TYPE "StockUnit" AS ENUM ('UNIT', 'GRAMS', 'KILOGRAMS', 'ML', 'LITERS');

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "dv" TEXT,
    "tipo" "SupplierTipo" NOT NULL,
    "direccion" TEXT,
    "ciudad" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "contactoNombre" TEXT,
    "condicionPago" "CondicionPago" NOT NULL,
    "cupoCredito" INTEGER NOT NULL,
    "calificacion" DECIMAL(65,30) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insumos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insumos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_products" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "precioUnitario" DECIMAL(65,30) NOT NULL,
    "unidadCompra" "StockUnit" NOT NULL,
    "factorConversion" DECIMAL(65,30) NOT NULL,
    "tiempoEntregaDias" INTEGER NOT NULL,
    "esProveedorPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suppliers_tenantId_isActive_idx" ON "suppliers"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_tenantId_nit_key" ON "suppliers"("tenantId", "nit");

-- CreateIndex
CREATE INDEX "insumos_tenantId_isActive_idx" ON "insumos"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "supplier_products_tenantId_supplierId_idx" ON "supplier_products"("tenantId", "supplierId");

-- CreateIndex
CREATE INDEX "supplier_products_tenantId_insumoId_idx" ON "supplier_products"("tenantId", "insumoId");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_products_tenantId_supplierId_insumoId_key" ON "supplier_products"("tenantId", "supplierId", "insumoId");

-- AddForeignKey
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "insumos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
