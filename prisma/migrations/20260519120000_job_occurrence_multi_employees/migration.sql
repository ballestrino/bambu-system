-- CreateTable
CREATE TABLE "JobOccurrenceEmployee" (
    "id" TEXT NOT NULL,
    "jobOccurrenceId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobOccurrenceEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobOccurrenceEmployee_jobOccurrenceId_employeeId_key" ON "JobOccurrenceEmployee"("jobOccurrenceId", "employeeId");

-- CreateIndex
CREATE INDEX "JobOccurrenceEmployee_employeeId_idx" ON "JobOccurrenceEmployee"("employeeId");

-- CreateIndex
CREATE INDEX "JobOccurrenceEmployee_jobOccurrenceId_idx" ON "JobOccurrenceEmployee"("jobOccurrenceId");

-- Backfill existing single-employee visits into the new relation.
INSERT INTO "JobOccurrenceEmployee" ("id", "jobOccurrenceId", "employeeId")
SELECT 'legacy_' || "id", "id", "employeeId"
FROM "JobOccurrence"
WHERE "employeeId" IS NOT NULL
ON CONFLICT ("jobOccurrenceId", "employeeId") DO NOTHING;

-- AddForeignKey
ALTER TABLE "JobOccurrenceEmployee" ADD CONSTRAINT "JobOccurrenceEmployee_jobOccurrenceId_fkey" FOREIGN KEY ("jobOccurrenceId") REFERENCES "JobOccurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOccurrenceEmployee" ADD CONSTRAINT "JobOccurrenceEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
