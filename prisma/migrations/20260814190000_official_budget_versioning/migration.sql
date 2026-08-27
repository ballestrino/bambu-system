-- CreateEnum
CREATE TYPE "OfficialBudgetStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "OfficialBudget" (
    "id" TEXT NOT NULL,
    "status" "OfficialBudgetStatus" NOT NULL DEFAULT 'ACTIVE',
    "sourceBudgetId" TEXT,
    "sourceBudgetName" TEXT NOT NULL,
    "sourceBudgetSlug" TEXT NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "archivedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficialBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialBudgetVersion" (
    "id" TEXT NOT NULL,
    "officialBudgetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "serviceName" TEXT NOT NULL,
    "serviceDescription" TEXT,
    "serviceCategories" JSONB NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UYU',
    "sourceBudgetUpdatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedById" TEXT NOT NULL,

    CONSTRAINT "OfficialBudgetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialBudgetVersionOption" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "hasProducts" BOOLEAN NOT NULL,
    "visits" INTEGER NOT NULL,
    "visitType" "VisitType" NOT NULL,
    "hoursPerVisit" DECIMAL(10,4) NOT NULL,
    "employees" INTEGER NOT NULL,
    "effectiveMonthlyVisits" DECIMAL(12,4) NOT NULL,
    "monthlyWorkload" DECIMAL(12,4) NOT NULL,
    "monthlyWorkloadIsEstimate" BOOLEAN NOT NULL DEFAULT true,
    "weeklyMultiplier" DECIMAL(4,2) NOT NULL DEFAULT 4.32,
    "nominalHour" DECIMAL(14,2) NOT NULL,
    "nominalSalary" DECIMAL(14,2) NOT NULL,
    "incidenceContributionPercent" DECIMAL(8,4) NOT NULL,
    "companyContributionPercent" DECIMAL(8,4) NOT NULL,
    "personalContributionPercent" DECIMAL(8,4) NOT NULL,
    "transportationCost" DECIMAL(14,2) NOT NULL,
    "productsCost" DECIMAL(14,2) NOT NULL,
    "productsIvaPercent" DECIMAL(8,4) NOT NULL,
    "productsRevenuePercent" DECIMAL(8,4) NOT NULL,
    "serviceRevenuePercent" DECIMAL(8,4) NOT NULL,
    "ivaPercent" DECIMAL(8,4) NOT NULL,
    "netPrice" DECIMAL(14,2) NOT NULL,
    "ivaAmount" DECIMAL(14,2) NOT NULL,
    "finalPrice" DECIMAL(14,2) NOT NULL,
    "hourlyPrice" DECIMAL(14,2) NOT NULL,
    "finalPriceIsAuthoritative" BOOLEAN NOT NULL DEFAULT true,
    "calculatedPriceIsEstimate" BOOLEAN NOT NULL DEFAULT true,
    "calculatedEffectiveNominalHour" DECIMAL(14,4) NOT NULL,
    "calculatedLaborCost" DECIMAL(14,2) NOT NULL,
    "calculatedPersonalContribution" DECIMAL(14,2) NOT NULL,
    "calculatedIncidenceContribution" DECIMAL(14,2) NOT NULL,
    "calculatedCompanyContribution" DECIMAL(14,2) NOT NULL,
    "calculatedContributionsTotal" DECIMAL(14,2) NOT NULL,
    "calculatedServiceCostBasis" DECIMAL(14,2) NOT NULL,
    "calculatedServiceRevenue" DECIMAL(14,2) NOT NULL,
    "calculatedProductsRevenue" DECIMAL(14,2) NOT NULL,
    "calculatedProductsNetPrice" DECIMAL(14,2) NOT NULL,
    "calculatedNetPrice" DECIMAL(14,2) NOT NULL,
    "calculatedIvaAmount" DECIMAL(14,2) NOT NULL,
    "calculatedFinalPrice" DECIMAL(14,2) NOT NULL,
    "calculationMetadata" JSONB NOT NULL,

    CONSTRAINT "OfficialBudgetVersionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialBudgetAuditEvent" (
    "id" TEXT NOT NULL,
    "officialBudgetId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "version" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfficialBudgetAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OfficialBudget_sourceBudgetId_key" ON "OfficialBudget"("sourceBudgetId");
CREATE INDEX "OfficialBudget_status_publishedAt_idx" ON "OfficialBudget"("status", "publishedAt");
CREATE INDEX "OfficialBudget_sourceBudgetSlug_idx" ON "OfficialBudget"("sourceBudgetSlug");
CREATE UNIQUE INDEX "OfficialBudgetVersion_officialBudgetId_version_key" ON "OfficialBudgetVersion"("officialBudgetId", "version");
CREATE INDEX "OfficialBudgetVersion_publishedAt_idx" ON "OfficialBudgetVersion"("publishedAt");
CREATE UNIQUE INDEX "OfficialBudgetVersionOption_versionId_position_key" ON "OfficialBudgetVersionOption"("versionId", "position");
CREATE INDEX "OfficialBudgetVersionOption_hasProducts_visitType_visits_em_idx" ON "OfficialBudgetVersionOption"("hasProducts", "visitType", "visits", "employees");
CREATE INDEX "OfficialBudgetAuditEvent_officialBudgetId_createdAt_idx" ON "OfficialBudgetAuditEvent"("officialBudgetId", "createdAt");
CREATE INDEX "OfficialBudgetAuditEvent_actorId_createdAt_idx" ON "OfficialBudgetAuditEvent"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "OfficialBudget" ADD CONSTRAINT "OfficialBudget_sourceBudgetId_fkey" FOREIGN KEY ("sourceBudgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OfficialBudget" ADD CONSTRAINT "OfficialBudget_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OfficialBudget" ADD CONSTRAINT "OfficialBudget_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OfficialBudgetVersion" ADD CONSTRAINT "OfficialBudgetVersion_officialBudgetId_fkey" FOREIGN KEY ("officialBudgetId") REFERENCES "OfficialBudget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OfficialBudgetVersion" ADD CONSTRAINT "OfficialBudgetVersion_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OfficialBudgetVersionOption" ADD CONSTRAINT "OfficialBudgetVersionOption_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "OfficialBudgetVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OfficialBudgetAuditEvent" ADD CONSTRAINT "OfficialBudgetAuditEvent_officialBudgetId_fkey" FOREIGN KEY ("officialBudgetId") REFERENCES "OfficialBudget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OfficialBudgetAuditEvent" ADD CONSTRAINT "OfficialBudgetAuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Immutable snapshot contract
CREATE FUNCTION "reject_official_budget_snapshot_mutation"() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'official budget versions and options are immutable'
        USING ERRCODE = '55000';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "OfficialBudgetVersion_immutable"
BEFORE UPDATE OR DELETE ON "OfficialBudgetVersion"
FOR EACH ROW EXECUTE FUNCTION "reject_official_budget_snapshot_mutation"();

CREATE TRIGGER "OfficialBudgetVersionOption_immutable"
BEFORE UPDATE OR DELETE ON "OfficialBudgetVersionOption"
FOR EACH ROW EXECUTE FUNCTION "reject_official_budget_snapshot_mutation"();
