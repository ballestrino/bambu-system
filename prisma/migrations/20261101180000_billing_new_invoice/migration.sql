-- Feature 45: factura nueva desde la página. Aditiva.
ALTER TYPE "InvoiceBatchOrigin" ADD VALUE 'MANUAL';

ALTER TABLE "Invoice" ADD COLUMN "dueDays" INTEGER;
