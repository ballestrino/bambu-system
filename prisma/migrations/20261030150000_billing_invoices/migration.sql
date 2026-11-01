-- CreateEnum
CREATE TYPE "InvoiceOrigin" AS ENUM ('BILLER', 'APP');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUING', 'ISSUED', 'ACCEPTED', 'REJECTED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "InvoiceBatchStatus" AS ENUM ('DRAFT', 'ISSUING', 'DONE');

-- CreateEnum
CREATE TYPE "InvoiceBatchOrigin" AS ENUM ('REPEAT', 'AGENT');

-- CreateTable
CREATE TABLE "InvoiceBatch" (
    "id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "origin" "InvoiceBatchOrigin" NOT NULL,
    "conversationId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "origin" "InvoiceOrigin" NOT NULL,
    "status" "InvoiceStatus" NOT NULL,
    "cfeType" INTEGER NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "issueDate" DATE,
    "dueDate" DATE,
    "currency" TEXT NOT NULL DEFAULT 'UYU',
    "total" DECIMAL(14,2) NOT NULL,
    "receiver" JSONB,
    "receiverDocument" TEXT,
    "items" JSONB,
    "adenda" TEXT,
    "purchaseOrder" TEXT,
    "internalNumber" TEXT,
    "paymentForm" INTEGER,
    "billerId" INTEGER,
    "billerSucursal" INTEGER,
    "series" TEXT,
    "number" INTEGER,
    "billerStatus" TEXT,
    "cae" JSONB,
    "references" JSONB,
    "referenceIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "billerCreatedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3),
    "selected" BOOLEAN NOT NULL DEFAULT true,
    "sourceInvoiceId" TEXT,
    "batchId" TEXT,
    "error" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceBatch_period_status_idx" ON "InvoiceBatch"("period", "status");

-- CreateIndex
CREATE INDEX "InvoiceBatch_conversationId_idx" ON "InvoiceBatch"("conversationId");

-- CreateIndex
CREATE INDEX "InvoiceBatch_createdById_idx" ON "InvoiceBatch"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_internalNumber_key" ON "Invoice"("internalNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_billerId_key" ON "Invoice"("billerId");

-- CreateIndex
CREATE INDEX "Invoice_period_cfeType_idx" ON "Invoice"("period", "cfeType");

-- CreateIndex
CREATE INDEX "Invoice_issueDate_idx" ON "Invoice"("issueDate");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_batchId_idx" ON "Invoice"("batchId");

-- CreateIndex
CREATE INDEX "Invoice_receiverDocument_period_idx" ON "Invoice"("receiverDocument", "period");

-- CreateIndex
CREATE INDEX "Invoice_createdById_idx" ON "Invoice"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_sourceInvoiceId_period_key" ON "Invoice"("sourceInvoiceId", "period");

-- AddForeignKey
ALTER TABLE "InvoiceBatch" ADD CONSTRAINT "InvoiceBatch_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AgentConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceBatch" ADD CONSTRAINT "InvoiceBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_sourceInvoiceId_fkey" FOREIGN KEY ("sourceInvoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InvoiceBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

