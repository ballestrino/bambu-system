CREATE UNIQUE INDEX "JobOccurrence_scheduleRuleId_scheduledStartAt_key"
ON "JobOccurrence"("scheduleRuleId", "scheduledStartAt");
