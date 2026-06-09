-- CreateTable
CREATE TABLE "work_stations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_recipes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "finishedProductId" TEXT NOT NULL,
    "batchSize" DECIMAL(10,3) NOT NULL,
    "batchUnit" "StockUnit" NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_phases" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "workStationId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "standardMinutes" INTEGER NOT NULL,
    "minOperators" INTEGER NOT NULL DEFAULT 1,
    "maxOperators" INTEGER NOT NULL DEFAULT 4,
    "requiresQA" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "production_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phase_inputs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "supplyItemId" TEXT NOT NULL,
    "quantityPerBatch" DECIMAL(10,3) NOT NULL,
    "unit" "StockUnit" NOT NULL,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "phase_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operator_sessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workStationId" TEXT NOT NULL,
    "operatorUserId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_orders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phase_executions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "productionOrderId" TEXT,
    "operatorUserId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phase_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_stations_tenantId_idx" ON "work_stations"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "work_stations_tenantId_code_key" ON "work_stations"("tenantId", "code");

-- CreateIndex
CREATE INDEX "production_recipes_tenantId_isActive_idx" ON "production_recipes"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "production_phases_recipeId_order_idx" ON "production_phases"("recipeId", "order");

-- CreateIndex
CREATE INDEX "phase_inputs_phaseId_idx" ON "phase_inputs"("phaseId");

-- CreateIndex
CREATE INDEX "operator_sessions_tenantId_idx" ON "operator_sessions"("tenantId");

-- CreateIndex
CREATE INDEX "operator_sessions_workStationId_idx" ON "operator_sessions"("workStationId");

-- CreateIndex
CREATE INDEX "operator_sessions_operatorUserId_idx" ON "operator_sessions"("operatorUserId");

-- CreateIndex
CREATE INDEX "production_orders_tenantId_idx" ON "production_orders"("tenantId");

-- CreateIndex
CREATE INDEX "production_orders_recipeId_idx" ON "production_orders"("recipeId");

-- CreateIndex
CREATE INDEX "phase_executions_phaseId_idx" ON "phase_executions"("phaseId");

-- CreateIndex
CREATE INDEX "phase_executions_productionOrderId_idx" ON "phase_executions"("productionOrderId");

-- CreateIndex
CREATE INDEX "phase_executions_operatorUserId_idx" ON "phase_executions"("operatorUserId");

-- AddForeignKey
ALTER TABLE "production_phases" ADD CONSTRAINT "production_phases_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "production_recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_phases" ADD CONSTRAINT "production_phases_workStationId_fkey" FOREIGN KEY ("workStationId") REFERENCES "work_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_inputs" ADD CONSTRAINT "phase_inputs_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "production_phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_sessions" ADD CONSTRAINT "operator_sessions_workStationId_fkey" FOREIGN KEY ("workStationId") REFERENCES "work_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_sessions" ADD CONSTRAINT "operator_sessions_operatorUserId_fkey" FOREIGN KEY ("operatorUserId") REFERENCES "operational_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "production_recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_executions" ADD CONSTRAINT "phase_executions_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "production_phases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_executions" ADD CONSTRAINT "phase_executions_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_executions" ADD CONSTRAINT "phase_executions_operatorUserId_fkey" FOREIGN KEY ("operatorUserId") REFERENCES "operational_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
