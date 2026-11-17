import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => readFile(path.join(root, file), "utf8");

async function main() {
const [
  listPage,
  detailPage,
  sidebar,
  mobileNav,
  generatorCard,
  generatorDetail,
  reads,
  mutations,
  serverActions,
] = await Promise.all([
  read("components/official-budgets/list/official-budgets-page.tsx"),
  read("components/official-budgets/detail/official-budget-view.tsx"),
  read("components/dashboard/dashboard-nav.ts"),
  read("components/nav/MobileNav.tsx"),
  read("components/budgets/list/budget-row-actions.tsx"),
  read("components/budgets/budget-details/budget-detail-official.tsx"),
  read("data/official-budgets.ts"),
  read("components/official-budgets/hooks/use-official-budget-mutations.ts"),
  read("actions/official-budgets/official-budget-actions.ts"),
]);

assert.match(listPage, /ACTIVE[\s\S]*ARCHIVED/);
assert.match(listPage, /isLoading[\s\S]*isError[\s\S]*Reintentar/);
assert.match(listPage, /OfficialBudgetsToolbar/);
assert.match(detailPage, /OfficialVersionsBand/);
assert.match(detailPage, /buildOfficialDetailOption/);
assert.match(detailPage, /OfficialDetailActions/);
const archiveDialog = await read("components/official-budgets/official-archive-dialog.tsx");
assert.match(archiveDialog, /archive\.mutate\(id/);
assert.doesNotMatch(archiveDialog, /window\.confirm/);
assert.match(sidebar, /Generador[\s\S]*Presupuestos oficiales/);
assert.match(mobileNav, /Generador de presupuestos[\s\S]*Presupuestos oficiales/);
assert.match(generatorCard, /publish\.mutate\(budget\.id\)/);
assert.match(generatorDetail, /Para eliminarlo, primero archivalo/);
assert.match(generatorDetail, /publish\.mutate\(budgetId\)/);
assert.match(reads, /requireAdminSession/);
assert.match(reads, /contains: query/);
assert.match(serverActions, /requireAdminSession/);
assert.match(serverActions, /publishOfficialBudgetInTransaction/);
assert.match(serverActions, /archiveOfficialBudgetInTransaction/);
assert.match(mutations, /officialBudgetKeys\.all/);
assert.match(mutations, /invalidateBudgetScopes\(queryClient\)/);

console.log("Official budget workspace checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
