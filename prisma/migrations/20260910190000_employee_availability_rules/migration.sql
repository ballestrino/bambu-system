-- Cuando puede trabajar cada empleada: la regla AVAILABLE reemplaza la ventana
-- por defecto del cronograma y la UNAVAILABLE la recorta. Sin reglas, la
-- empleada queda con la ventana por defecto y el buscador de huecos la usa.
CREATE TYPE "EmployeeAvailabilityKind" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

CREATE TABLE "EmployeeAvailabilityRule" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "kind" "EmployeeAvailabilityKind" NOT NULL DEFAULT 'UNAVAILABLE',
    "weekdays" INTEGER[],
    "startMinute" INTEGER NOT NULL DEFAULT 0,
    "endMinute" INTEGER NOT NULL DEFAULT 1440,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeAvailabilityRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmployeeAvailabilityRule_employeeId_idx" ON "EmployeeAvailabilityRule"("employeeId");
CREATE INDEX "EmployeeAvailabilityRule_createdById_idx" ON "EmployeeAvailabilityRule"("createdById");

ALTER TABLE "EmployeeAvailabilityRule" ADD CONSTRAINT "EmployeeAvailabilityRule_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeAvailabilityRule" ADD CONSTRAINT "EmployeeAvailabilityRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
