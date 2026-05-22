-- CreateEnum
CREATE TYPE "OperationalCostCategoryKind" AS ENUM ('GENERAL', 'BPS', 'TRANSPORT');

-- CreateTable
CREATE TABLE "OperationalCostCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#53985E',
    "kind" "OperationalCostCategoryKind" NOT NULL DEFAULT 'GENERAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalCostCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalCost" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "jobId" TEXT,
    "employeeId" TEXT,
    "costDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'RECORDED',
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsCostSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "bpsEstimatePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsCostSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperationalCostCategory_name_key" ON "OperationalCostCategory"("name");

-- CreateIndex
CREATE INDEX "OperationalCostCategory_kind_isActive_archivedAt_idx" ON "OperationalCostCategory"("kind", "isActive", "archivedAt");

-- CreateIndex
CREATE INDEX "OperationalCostCategory_createdById_idx" ON "OperationalCostCategory"("createdById");

-- CreateIndex
CREATE INDEX "OperationalCostCategory_updatedById_idx" ON "OperationalCostCategory"("updatedById");

-- CreateIndex
CREATE INDEX "OperationalCost_categoryId_costDate_idx" ON "OperationalCost"("categoryId", "costDate");

-- CreateIndex
CREATE INDEX "OperationalCost_employeeId_costDate_idx" ON "OperationalCost"("employeeId", "costDate");

-- CreateIndex
CREATE INDEX "OperationalCost_jobId_costDate_idx" ON "OperationalCost"("jobId", "costDate");

-- CreateIndex
CREATE INDEX "OperationalCost_status_costDate_idx" ON "OperationalCost"("status", "costDate");

-- CreateIndex
CREATE INDEX "OperationalCost_createdById_idx" ON "OperationalCost"("createdById");

-- CreateIndex
CREATE INDEX "OperationalCost_updatedById_idx" ON "OperationalCost"("updatedById");

-- CreateIndex
CREATE INDEX "OpsCostSettings_updatedById_idx" ON "OpsCostSettings"("updatedById");

-- AddForeignKey
ALTER TABLE "OperationalCostCategory" ADD CONSTRAINT "OperationalCostCategory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalCostCategory" ADD CONSTRAINT "OperationalCostCategory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalCost" ADD CONSTRAINT "OperationalCost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "OperationalCostCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalCost" ADD CONSTRAINT "OperationalCost_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalCost" ADD CONSTRAINT "OperationalCost_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalCost" ADD CONSTRAINT "OperationalCost_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalCost" ADD CONSTRAINT "OperationalCost_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpsCostSettings" ADD CONSTRAINT "OpsCostSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
