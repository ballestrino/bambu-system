-- Let each calendar occurrence represent the assigned visit record.
ALTER TABLE "JobOccurrence" ADD COLUMN "employeeId" TEXT;

DROP INDEX IF EXISTS "JobOccurrence_scheduleRuleId_scheduledStartAt_key";

CREATE INDEX "JobOccurrence_employeeId_scheduledStartAt_idx" ON "JobOccurrence"("employeeId", "scheduledStartAt");

ALTER TABLE "JobOccurrence" ADD CONSTRAINT "JobOccurrence_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
