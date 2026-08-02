ALTER TABLE "EmployeePayment"
ADD COLUMN "assignedMonth" TIMESTAMP(3);

UPDATE "EmployeePayment"
SET "assignedMonth" = date_trunc('month', "paymentDate");

ALTER TABLE "EmployeePayment"
ALTER COLUMN "assignedMonth" SET NOT NULL;

CREATE INDEX "EmployeePayment_employeeId_assignedMonth_idx"
ON "EmployeePayment"("employeeId", "assignedMonth");

CREATE INDEX "EmployeePayment_employeeId_status_assignedMonth_idx"
ON "EmployeePayment"("employeeId", "status", "assignedMonth");

CREATE INDEX "EmployeePayment_status_assignedMonth_idx"
ON "EmployeePayment"("status", "assignedMonth");
