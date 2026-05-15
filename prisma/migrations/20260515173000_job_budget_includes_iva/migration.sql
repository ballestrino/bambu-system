ALTER TABLE "Job"
ADD COLUMN "budgetIncludesIva" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Job"
SET "budgetIncludesIva" = false;
