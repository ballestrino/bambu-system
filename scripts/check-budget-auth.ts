import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { slugifyBudgetName } from "../lib/budget-slug";
import { BudgetIdSchema, BudgetSlugSchema } from "../schemas/BudgetSchema";
import { CreateBudgetCategorySchema, UpdateBudgetCategorySchema } from "../schemas/budget-category";

// Feature 3: presupuestos y categorías son un espacio compartido entre admins.
// Cada lectura y cada acción pide la sesión de admin antes de tocar la base.
// Un checkout con core.autocrlf deja CRLF: se normaliza.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");

// The body of each exported function, up to the next export.
const exportsOf = (text: string) =>
  [...text.matchAll(/^export (?:default )?(?:async function|const) (\w+)/gm)].map((match, i, all) => ({
    name: match[1],
    body: text.slice(match.index, all[i + 1]?.index),
  }));

const guardedFirst = (path: string, body: string, name: string) => {
  const guard = body.indexOf("await getBudgetAdminSession()");
  assert.ok(guard > 0, `${path} ${name}: no pide la sesión de admin`);
  const db = body.search(/\bdb\.|\$transaction/);
  if (db >= 0) assert.ok(guard < db, `${path} ${name}: toca la base antes de la sesión`);
  assert.match(body, /if \("error" in admin\) return (\{ error: admin\.error \}|null)|if \("error" in admin\) \{\n\s+return \{ error: admin\.error \};/, `${path} ${name}: no corta sin sesión`);
};

// --- The shared guard.
const guard = read("lib/budget-admin.ts");
assert.match(guard, /^import "server-only";/);
assert.match(guard, /return \{ session: await requireAdminSession\(\) \};/);
assert.match(guard, /if \(error instanceof AdminAuthorizationError\) return \{ error: error\.message \};\n\s+throw error;/);

// --- Reads: server-only (no "use server" endpoints) and guarded.
for (const path of ["data/budget.ts", "data/budgets.ts", "data/budgetCategory.ts"]) {
  const text = read(path);
  assert.match(text, /^import "server-only";?\n/, `${path} no es server-only`);
  assert.doesNotMatch(text, /["']use server["']/, `${path} sigue siendo "use server"`);
  assert.doesNotMatch(text, /from "@\/auth"/, `${path} usa auth() suelto`);
  const reads = exportsOf(text);
  assert.ok(reads.length > 0, path);
  reads.forEach(({ name, body }) => guardedFirst(path, body, name));
}
assert.doesNotMatch(read("data/budget.ts"), /\/\/ if \(budget && budget\.userId/);
for (const name of ["getBudgetCategoryById", "getBudgetSubCategories"]) {
  const body = exportsOf(read("data/budgetCategory.ts")).find((fn) => fn.name === name)!.body;
  assert.match(body, /BudgetCategoryIdSchema\.safeParse\(/, `${name} no valida el id`);
}

// --- The client reaches the reads only through "use server" read files.
for (const path of ["components/budgets/actions/budget-reads.ts", "components/budgets/categories/actions/budget-category-reads.ts"]) {
  assert.match(read(path), /^"use server";\n/, path);
}
const clientFiles = (dir: string): string[] =>
  readdirSync(join(process.cwd(), dir), { recursive: true }).map(String).filter((f) => /\.tsx?$/.test(f)).map((f) => join(dir, f));
for (const path of [...clientFiles("components"), ...clientFiles("app"), ...clientFiles("hooks")]) {
  const text = read(path);
  // The *.action.ts adapters run in the client unless they are "use server".
  const isServerAction = /^["']use server["']/.test(text);
  const isClient = !isServerAction && (/^["']use client["']/.test(text) || /\.action\.ts$/.test(path));
  if (isClient) assert.doesNotMatch(text, /from ["']@\/data\/budget(s|Category)?["']/, `${path} importa una lectura de data/ en el cliente`);
}

// --- Budget actions: session first, schemas, no owner rule, no debug logs.
const budgetActions: Record<string, RegExp[]> = {
  "actions/budgets/create-budget.ts": [/BudgetSchema\.safeParse\(values\)/, /userId: admin\.session\.user\.id,/],
  "actions/budgets/update-budget.ts": [/BudgetSchema\.safeParse\(values\)/, /BudgetIdSchema\.safeParse\(id\)/, /BudgetSlugSchema\.safeParse\(newSlug\)/, /const actorId = admin\.session\.user\.id;/],
  "actions/budgets/delete-budget.ts": [/BudgetIdSchema\.safeParse\(budgetId\)/],
  "actions/budgets/duplicate-budget.ts": [/BudgetIdSchema\.safeParse\(budgetId\)/, /userId: admin\.session\.user\.id,/],
};
for (const [path, required] of Object.entries(budgetActions)) {
  const text = read(path);
  assert.match(text, /^"use server";\n/, path);
  assert.doesNotMatch(text, /from "@\/auth"|requireAdminSession\(\)|console\.log|\{ error: "error" \}/, path);
  assert.doesNotMatch(text, /userId !==|userId ===|session\.user\.role/, `${path} tiene una regla de dueño`);
  exportsOf(text).filter(({ name }) => name !== "findUniqueSlug").forEach(({ name, body }) => guardedFirst(path, body, name));
  required.forEach((pattern) => assert.match(text, pattern, `${path}: ${pattern}`));
}

// --- Category actions: session first, schemas, { category } | { error }.
for (const [path, schema] of [
  ["actions/budgetCategories/create-budget-category.ts", "CreateBudgetCategorySchema.safeParse(data)"],
  ["actions/budgetCategories/update-budget-category.ts", "UpdateBudgetCategorySchema.safeParse(values)"],
  ["actions/budgetCategories/delete-budget-category.ts", "BudgetCategoryIdSchema.safeParse(id)"],
] as const) {
  const text = read(path);
  assert.match(text, /^"use server"\n/, path);
  const [fn] = exportsOf(text);
  guardedFirst(path, fn.body, fn.name);
  assert.ok(text.includes(schema), `${path} no valida`);
  assert.match(text, /return \{ category \}/, `${path} no devuelve { category }`);
  assert.doesNotMatch(text, /return result\n/, `${path} devuelve la fila suelta`);
}
for (const hook of ["useUpdateBudgetCategoryMutation", "useDeleteBudgetCategoryMutation"]) {
  const text = read(`components/budgets/categories/hooks/${hook}.tsx`);
  assert.match(text, /if \("error" in result\) \{\n\s+toast\.error\(result\.error\)/, hook);
}

// --- No debug logs left in the budget flows (criterion 4).
for (const path of [
  "components/budgets/create-budget/hooks/useCreateBudgetForm.tsx",
  "components/budgets/edit-budget/hooks/useEditBudgetForm.tsx",
  "components/budgets/BudgetDropdown.tsx",
]) {
  assert.doesNotMatch(read(path), /console\.log/, path);
}

// --- The agent follows the shared model: any admin duplicates any budget.
assert.doesNotMatch(read("lib/agent/proposal-preconditions.ts"), /Solo quien creó|actorId/);
assert.doesNotMatch(read("lib/agent/stored-budget-proposals.ts"), /not_owner|actorId/);
assert.match(read("docs/architecture.md"), /Budgets and budget categories are one workspace shared by every admin/);

// --- Schemas.
["Limpieza Oficina Norte", "Casa 3 dormitorios (copia)", "Edificio Ñandú 2"].forEach((name) =>
  assert.ok(BudgetSlugSchema.safeParse(slugifyBudgetName(name)).success, name)
);
["Con Mayúscula", "con espacio", "doble--guion", "-borde", "barra/rara", ""].forEach((slug) =>
  assert.equal(BudgetSlugSchema.safeParse(slug).success, false, slug)
);
assert.ok(BudgetIdSchema.safeParse("cmfk2x9a70000abcd1234efgh").success);
assert.equal(BudgetIdSchema.safeParse("1; drop table").success, false);

const category = { name: "  Oficinas  ", description: "", color: "#afddb6", isActive: true };
assert.equal(CreateBudgetCategorySchema.parse(category).name, "Oficinas");
assert.ok(CreateBudgetCategorySchema.safeParse({ ...category, parentCategoryId: "cmfk2x9a70000abcd1234efgh" }).success);
assert.equal(CreateBudgetCategorySchema.safeParse({ ...category, name: "   " }).success, false);
assert.equal(CreateBudgetCategorySchema.safeParse({ ...category, color: "red" }).success, false);
assert.equal(CreateBudgetCategorySchema.safeParse({ ...category, parentCategoryId: "x" }).success, false);
assert.equal(UpdateBudgetCategorySchema.safeParse({ ...category }).success, false, "update sin id");

console.log("check:budget-auth OK");
