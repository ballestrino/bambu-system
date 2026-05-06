-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "OccurrenceStatus" AS ENUM ('SCHEDULED', 'DONE', 'SKIPPED', 'CANCELED');

-- CreateEnum
CREATE TYPE "TimeEntryStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('RECORDED', 'VOIDED');

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serviceAddress" TEXT,
    "serviceLocation" TEXT,
    "operationalNotes" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceBudgetId" TEXT,
    "sourceBudgetOptionId" TEXT,
    "budgetSnapshot" JSONB,
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobScheduleRule" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "frequency" "RecurrenceFrequency" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "weekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "dayOfMonth" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "startTimeMinutes" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Montevideo',
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobScheduleRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobOccurrence" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "scheduleRuleId" TEXT,
    "scheduledStartAt" TIMESTAMP(3) NOT NULL,
    "scheduledEndAt" TIMESTAMP(3) NOT NULL,
    "actualStartAt" TIMESTAMP(3),
    "actualEndAt" TIMESTAMP(3),
    "status" "OccurrenceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "isDetached" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobEmployeeAssignment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "roleLabel" TEXT,
    "assignedFrom" TIMESTAMP(3) NOT NULL,
    "assignedTo" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobEmployeeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobOccurrenceId" TEXT,
    "workDate" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "hours" DECIMAL(10,2) NOT NULL,
    "status" "TimeEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobClientPayment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'RECORDED',
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobClientPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeePayment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'RECORDED',
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_status_archivedAt_idx" ON "Job"("status", "archivedAt");

-- CreateIndex
CREATE INDEX "Job_sourceBudgetId_idx" ON "Job"("sourceBudgetId");

-- CreateIndex
CREATE INDEX "Job_sourceBudgetOptionId_idx" ON "Job"("sourceBudgetOptionId");

-- CreateIndex
CREATE INDEX "Job_createdById_idx" ON "Job"("createdById");

-- CreateIndex
CREATE INDEX "Job_updatedById_idx" ON "Job"("updatedById");

-- CreateIndex
CREATE INDEX "JobScheduleRule_jobId_isActive_idx" ON "JobScheduleRule"("jobId", "isActive");

-- CreateIndex
CREATE INDEX "JobScheduleRule_createdById_idx" ON "JobScheduleRule"("createdById");

-- CreateIndex
CREATE INDEX "JobScheduleRule_updatedById_idx" ON "JobScheduleRule"("updatedById");

-- CreateIndex
CREATE INDEX "JobOccurrence_jobId_scheduledStartAt_idx" ON "JobOccurrence"("jobId", "scheduledStartAt");

-- CreateIndex
CREATE INDEX "JobOccurrence_status_archivedAt_idx" ON "JobOccurrence"("status", "archivedAt");

-- CreateIndex
CREATE INDEX "JobOccurrence_createdById_idx" ON "JobOccurrence"("createdById");

-- CreateIndex
CREATE INDEX "JobOccurrence_updatedById_idx" ON "JobOccurrence"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "JobOccurrence_scheduleRuleId_scheduledStartAt_key" ON "JobOccurrence"("scheduleRuleId", "scheduledStartAt");

-- CreateIndex
CREATE INDEX "Employee_isActive_archivedAt_idx" ON "Employee"("isActive", "archivedAt");

-- CreateIndex
CREATE INDEX "Employee_email_idx" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_createdById_idx" ON "Employee"("createdById");

-- CreateIndex
CREATE INDEX "Employee_updatedById_idx" ON "Employee"("updatedById");

-- CreateIndex
CREATE INDEX "JobEmployeeAssignment_jobId_assignedFrom_idx" ON "JobEmployeeAssignment"("jobId", "assignedFrom");

-- CreateIndex
CREATE INDEX "JobEmployeeAssignment_employeeId_assignedFrom_idx" ON "JobEmployeeAssignment"("employeeId", "assignedFrom");

-- CreateIndex
CREATE INDEX "JobEmployeeAssignment_createdById_idx" ON "JobEmployeeAssignment"("createdById");

-- CreateIndex
CREATE INDEX "JobEmployeeAssignment_updatedById_idx" ON "JobEmployeeAssignment"("updatedById");

-- CreateIndex
CREATE INDEX "TimeEntry_employeeId_workDate_idx" ON "TimeEntry"("employeeId", "workDate");

-- CreateIndex
CREATE INDEX "TimeEntry_jobId_workDate_idx" ON "TimeEntry"("jobId", "workDate");

-- CreateIndex
CREATE INDEX "TimeEntry_jobOccurrenceId_idx" ON "TimeEntry"("jobOccurrenceId");

-- CreateIndex
CREATE INDEX "TimeEntry_status_approvedAt_idx" ON "TimeEntry"("status", "approvedAt");

-- CreateIndex
CREATE INDEX "TimeEntry_createdById_idx" ON "TimeEntry"("createdById");

-- CreateIndex
CREATE INDEX "TimeEntry_updatedById_idx" ON "TimeEntry"("updatedById");

-- CreateIndex
CREATE INDEX "JobClientPayment_jobId_paymentDate_idx" ON "JobClientPayment"("jobId", "paymentDate");

-- CreateIndex
CREATE INDEX "JobClientPayment_status_paymentDate_idx" ON "JobClientPayment"("status", "paymentDate");

-- CreateIndex
CREATE INDEX "JobClientPayment_createdById_idx" ON "JobClientPayment"("createdById");

-- CreateIndex
CREATE INDEX "JobClientPayment_updatedById_idx" ON "JobClientPayment"("updatedById");

-- CreateIndex
CREATE INDEX "EmployeePayment_employeeId_paymentDate_idx" ON "EmployeePayment"("employeeId", "paymentDate");

-- CreateIndex
CREATE INDEX "EmployeePayment_status_paymentDate_idx" ON "EmployeePayment"("status", "paymentDate");

-- CreateIndex
CREATE INDEX "EmployeePayment_createdById_idx" ON "EmployeePayment"("createdById");

-- CreateIndex
CREATE INDEX "EmployeePayment_updatedById_idx" ON "EmployeePayment"("updatedById");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_sourceBudgetId_fkey" FOREIGN KEY ("sourceBudgetId") REFERENCES "Budget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_sourceBudgetOptionId_fkey" FOREIGN KEY ("sourceBudgetOptionId") REFERENCES "BudgetOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobScheduleRule" ADD CONSTRAINT "JobScheduleRule_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobScheduleRule" ADD CONSTRAINT "JobScheduleRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobScheduleRule" ADD CONSTRAINT "JobScheduleRule_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOccurrence" ADD CONSTRAINT "JobOccurrence_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOccurrence" ADD CONSTRAINT "JobOccurrence_scheduleRuleId_fkey" FOREIGN KEY ("scheduleRuleId") REFERENCES "JobScheduleRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOccurrence" ADD CONSTRAINT "JobOccurrence_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOccurrence" ADD CONSTRAINT "JobOccurrence_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEmployeeAssignment" ADD CONSTRAINT "JobEmployeeAssignment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEmployeeAssignment" ADD CONSTRAINT "JobEmployeeAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEmployeeAssignment" ADD CONSTRAINT "JobEmployeeAssignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEmployeeAssignment" ADD CONSTRAINT "JobEmployeeAssignment_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_jobOccurrenceId_fkey" FOREIGN KEY ("jobOccurrenceId") REFERENCES "JobOccurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobClientPayment" ADD CONSTRAINT "JobClientPayment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobClientPayment" ADD CONSTRAINT "JobClientPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobClientPayment" ADD CONSTRAINT "JobClientPayment_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePayment" ADD CONSTRAINT "EmployeePayment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePayment" ADD CONSTRAINT "EmployeePayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePayment" ADD CONSTRAINT "EmployeePayment_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

