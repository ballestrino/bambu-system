import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
try {
  const identity = await db.$queryRaw<
    Array<{ database: string; user: string; address: string; port: number }>
  >`SELECT current_database() AS database,
           current_user AS user,
           inet_server_addr()::text AS address,
           inet_server_port() AS port`;
  const neonIdentity = await db.$queryRaw<
    Array<{
      branch_id: string | null;
      branch_name: string | null;
      endpoint_id: string | null;
      project_id: string | null;
    }>
  >`SELECT current_setting('neon.branch_id', true) AS branch_id,
           current_setting('neon.branch_name', true) AS branch_name,
           current_setting('neon.endpoint_id', true) AS endpoint_id,
           current_setting('neon.project_id', true) AS project_id`;
  const migrations = await db.$queryRaw<
    Array<{
      migration_name: string;
      finished: boolean;
      rolled_back: boolean;
    }>
  >`SELECT migration_name,
           finished_at IS NOT NULL AS finished,
           rolled_back_at IS NOT NULL AS rolled_back
      FROM "_prisma_migrations"
     ORDER BY started_at`;
  const invariants = await db.$queryRaw<
    Array<{
      client_payments_without_month: number;
      operational_costs_without_month: number;
      employee_payments_without_month: number;
      mail_tables: number;
      official_budget_tables: number;
    }>
  >`SELECT
      (SELECT count(*)::int FROM "JobClientPayment" WHERE "assignedMonth" IS NULL)
        AS client_payments_without_month,
      (SELECT count(*)::int FROM "OperationalCost" WHERE "assignedMonth" IS NULL)
        AS operational_costs_without_month,
      (SELECT count(*)::int FROM "EmployeePayment" WHERE "assignedMonth" IS NULL)
        AS employee_payments_without_month,
      (SELECT count(*)::int FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name LIKE 'Mail%') AS mail_tables,
      (SELECT count(*)::int FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name LIKE 'OfficialBudget%')
        AS official_budget_tables`;

  console.log(JSON.stringify({ identity, neonIdentity, migrations, invariants }, null, 2));
} finally {
  await db.$disconnect();
}
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
