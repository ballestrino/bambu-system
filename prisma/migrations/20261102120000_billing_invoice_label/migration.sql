-- Feature 51: título interno de una factura (consumidor final). Aditiva.
ALTER TABLE "Invoice" ADD COLUMN "label" VARCHAR(60);
