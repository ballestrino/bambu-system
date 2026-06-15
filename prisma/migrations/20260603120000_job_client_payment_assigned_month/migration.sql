-- AddField
ALTER TABLE "JobClientPayment" ADD COLUMN "assignedMonth" TIMESTAMP(3);

-- Backfill existing payments to the first day of their payment month.
UPDATE "JobClientPayment"
SET "assignedMonth" = date_trunc('month', "paymentDate")::timestamp(3);

-- Require assigned month after backfill.
ALTER TABLE "JobClientPayment" ALTER COLUMN "assignedMonth" SET NOT NULL;

-- CreateIndex
CREATE INDEX "JobClientPayment_jobId_assignedMonth_idx" ON "JobClientPayment"("jobId", "assignedMonth");

-- CreateIndex
CREATE INDEX "JobClientPayment_jobId_status_assignedMonth_idx" ON "JobClientPayment"("jobId", "status", "assignedMonth");

-- CreateIndex
CREATE INDEX "JobClientPayment_status_assignedMonth_idx" ON "JobClientPayment"("status", "assignedMonth");
