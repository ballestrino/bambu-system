-- Feature 53: a dónde se mandó una factura emitida. Aditiva.
CREATE TYPE "InvoiceDeliveryChannel" AS ENUM ('EMAIL', 'WHATSAPP');

CREATE TYPE "InvoiceDeliverySource" AS ENUM ('SYSTEM', 'MANUAL');

CREATE TABLE "InvoiceDelivery" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "channel" "InvoiceDeliveryChannel" NOT NULL,
    "recipient" VARCHAR(254) NOT NULL,
    "source" "InvoiceDeliverySource" NOT NULL,
    "requestId" TEXT,
    "messageId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "InvoiceDelivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InvoiceDelivery_invoiceId_idx" ON "InvoiceDelivery"("invoiceId");

CREATE INDEX "InvoiceDelivery_createdById_idx" ON "InvoiceDelivery"("createdById");

CREATE UNIQUE INDEX "InvoiceDelivery_requestId_recipient_key" ON "InvoiceDelivery"("requestId", "recipient");

ALTER TABLE "InvoiceDelivery" ADD CONSTRAINT "InvoiceDelivery_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InvoiceDelivery" ADD CONSTRAINT "InvoiceDelivery_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
