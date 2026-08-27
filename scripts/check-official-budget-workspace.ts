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
  read("app/(private)/dashboard/official-budgets/page.tsx"),
  read("app/(private)/dashboard/official-budgets/[id]/page.tsx"),
  read("components/dashboard/dashboard-sidebar.tsx"),
  read("components/nav/MobileNav.tsx"),
  read("components/budgets/BudgetCard.tsx"),
  read("components/budgets/budget-details/BudgetView.tsx"),
  read("data/official-budgets.ts"),
  read("components/official-budgets/hooks/use-official-budget-mutations.ts"),
  read("actions/official-budgets/official-budget-actions.ts"),
]);

assert.match(listPage, /ACTIVE[\s\S]*ARCHIVED/);
assert.match(listPage, /isLoading[\s\S]*isError[\s\S]*Reintentar/);
assert.match(listPage, /SearchBar/);
assert.match(detailPage, /versions\.map/);
assert.match(detailPage, /OfficialOptionBreakdown/);
assert.match(detailPage, /ArchiveOfficialBudgetButton/);
assert.match(sidebar, /Generador[\s\S]*Presupuestos oficiales/);
assert.match(mobileNav, /Generador de presupuestos[\s\S]*Presupuestos oficiales/);
assert.match(generatorCard, /GeneratorOfficialControl/);
assert.match(generatorDetail, /no puede eliminarse hasta archivarlo/);
assert.match(reads, /requireAdminSession/);
assert.match(reads, /contains: query/);
assert.match(serverActions, /requireAdminSession/);
assert.match(serverActions, /publishOfficialBudgetInTransaction/);
assert.match(serverActions, /archiveOfficialBudgetInTransaction/);
assert.match(mutations, /officialBudgetKeys\.all/);
assert.match(mutations, /\["budgets"\]/);
assert.match(mutations, /\["budget"\]/);

console.log("Official budget workspace checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
