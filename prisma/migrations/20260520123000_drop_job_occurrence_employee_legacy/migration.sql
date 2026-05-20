ALTER TABLE "JobOccurrence"
DROP CONSTRAINT IF EXISTS "JobOccurrence_employeeId_fkey";

DROP INDEX IF EXISTS "JobOccurrence_employeeId_scheduledStartAt_idx";

ALTER TABLE "JobOccurrence"
DROP COLUMN IF EXISTS "employeeId";
