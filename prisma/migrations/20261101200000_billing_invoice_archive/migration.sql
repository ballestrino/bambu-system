-- Feature 47: archivar una factura emitida. Aditiva.
ALTER TABLE "Invoice" ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "archivedById" TEXT;

CREATE INDEX "Invoice_archivedById_idx" ON "Invoice"("archivedById");

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
