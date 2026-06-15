-- AddField
ALTER TABLE "OperationalCost" ADD COLUMN "assignedMonth" TIMESTAMP(3);

-- Backfill existing costs to the first day of their cost month.
UPDATE "OperationalCost"
SET "assignedMonth" = date_trunc('month', "costDate")::timestamp(3);

-- Require assigned month after backfill.
ALTER TABLE "OperationalCost" ALTER COLUMN "assignedMonth" SET NOT NULL;

-- CreateIndex
CREATE INDEX "OperationalCost_categoryId_assignedMonth_idx" ON "OperationalCost"("categoryId", "assignedMonth");

-- CreateIndex
CREATE INDEX "OperationalCost_employeeId_assignedMonth_idx" ON "OperationalCost"("employeeId", "assignedMonth");

-- CreateIndex
CREATE INDEX "OperationalCost_jobId_assignedMonth_idx" ON "OperationalCost"("jobId", "assignedMonth");

-- CreateIndex
CREATE INDEX "OperationalCost_status_assignedMonth_idx" ON "OperationalCost"("status", "assignedMonth");
