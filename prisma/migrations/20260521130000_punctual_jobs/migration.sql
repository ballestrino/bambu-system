-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('ONGOING', 'PUNCTUAL');

-- AlterTable
ALTER TABLE "Job"
ADD COLUMN "jobType" "JobType" NOT NULL DEFAULT 'ONGOING',
ADD COLUMN "punctualStartDate" TIMESTAMP(3),
ADD COLUMN "punctualEndDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Job_jobType_punctualStartDate_punctualEndDate_idx" ON "Job"("jobType", "punctualStartDate", "punctualEndDate");
