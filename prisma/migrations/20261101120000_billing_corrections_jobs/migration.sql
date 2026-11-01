-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "referenceReason" TEXT;

-- CreateTable
CREATE TABLE "BillingReceiverJob" (
    "id" TEXT NOT NULL,
    "receiverKey" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingReceiverJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingReceiverJob_receiverKey_key" ON "BillingReceiverJob"("receiverKey");

-- CreateIndex
CREATE INDEX "BillingReceiverJob_jobId_idx" ON "BillingReceiverJob"("jobId");

-- CreateIndex
CREATE INDEX "BillingReceiverJob_createdById_idx" ON "BillingReceiverJob"("createdById");

-- AddForeignKey
ALTER TABLE "BillingReceiverJob" ADD CONSTRAINT "BillingReceiverJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingReceiverJob" ADD CONSTRAINT "BillingReceiverJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

