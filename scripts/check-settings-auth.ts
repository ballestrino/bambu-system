import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import {
  UpdateEmailSchema,
  UpdateNameSchema,
  UpdatePasswordSchema,
  UpdateProfileImageSchema,
} from "../schemas/settings";

// Las acciones de settings toman la identidad de la sesión, nunca
// del cliente. Un checkout con core.autocrlf deja CRLF: se normaliza.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");
const exists = (path: string) => existsSync(join(process.cwd(), path));

// --- The old catch-all file is gone; actions are split by responsibility.
assert.ok(!exists("actions/settings.ts"), "actions/settings.ts volvió");
const actionFiles = {
  "actions/settings/account.ts": ["updateName", "updateEmail", "updateProfileImage"],
  "actions/settings/security.ts": ["updatePassword", "enable2FA", "disable2FA"],
};

const IDENTITY_PARAM = /\b(id|userId|oldemail|oldEmail|email)\s*:/;

for (const [path, names] of Object.entries(actionFiles)) {
  const text = read(path);
  assert.match(text, /^"use server"\n/, `${path} no empieza con "use server"`);

  const exported = [...text.matchAll(/^export const (\w+) = async \(([^)]*)\)/gm)];
  assert.deepEqual(exported.map(([, name]) => name).sort(), [...names].sort(), path);

  for (const [, name, params] of exported) {
    // Identity never travels as a parameter: at most one validated values
    // object whose type comes from schemas/settings.ts.
    assert.doesNotMatch(params, IDENTITY_PARAM, `${name} recibe identidad del cliente`);
    assert.match(params, /^(|values: Update\w+Values)$/, `${name}: ${params}`);

    // The session is the first thing each action reads.
    const from = text.indexOf(`export const ${name} =`);
    const next = text.indexOf("\nexport const ", from + 1);
    const body = text.slice(from, next < 0 ? undefined : next);
    assert.match(body, /^export const \w+ = async \([^)]*\) => \{\n\s+try \{\n\s+const user = await getSessionUser\(\)\n\s+if \(!user\) return \{ error: "No autenticado" \}/, `${name} no arranca por la sesión`);
    assert.doesNotMatch(body, /where: \{ id: (?!user\.id)/, `${name} escribe sobre otro id`);
    if (params) assert.match(body, /Schema\.safeParse\(values\)/, `${name} no valida`);
  }
}

// The replaced address of an email change is the database one.
const account = read("actions/settings/account.ts");
assert.match(account, /generateVerificationToken\(email, user\.email\)/);
assert.doesNotMatch(account, /oldemail/i);

// --- The session helper reads the id from auth(), not from an argument.
const sessionUser = read("lib/session-user.ts");
assert.match(sessionUser, /^import "server-only"/);
assert.match(
  sessionUser,
  /export const getSessionUser = async \(\) => \{\n  const session = await auth\(\)\n  const id = session\?\.user\?\.id\n\n  if \(!id\) return null\n\n  return \(await getUserById\(id\)\) \?\? null\n\}\n$/,
);

// --- Auth read helpers and token generators are not Server Actions: every
// export of a "use server" file is a public endpoint.
for (const path of [
  "data/user.ts",
  "data/verification-token.ts",
  "data/password-reset-token.ts",
  "data/two-factor-token.ts",
  "data/two-factor-confirmation.ts",
  "lib/tokens.ts",
]) {
  assert.doesNotMatch(read(path), /^["']use server["']/m, `${path} sigue siendo "use server"`);
}

// --- Callers send values, never the session user's id.
const callers = [
  "components/settings/account/change-name.tsx",
  "components/settings/account/change-email.tsx",
  "components/settings/security/change-password-form.tsx",
  "components/auth/TwoFactorToggle.tsx",
];
for (const path of callers) {
  const text = read(path);
  assert.match(text, /from "@\/actions\/settings\/(account|security)"|from '@\/actions\/settings\/(account|security)'/, path);
  assert.doesNotMatch(text, /(updateName|updateEmail|updatePassword|enable2FA|disable2FA)\((user\.id|userId|session)/, path);
}
assert.match(read(callers[3]), /await enable2FA\(\)/);
assert.match(read(callers[3]), /await disable2FA\(\)/);
assert.doesNotMatch(read(callers[3]), /userId/);

const settingsComponents = readdirSync(join(process.cwd(), "components/settings"), { recursive: true })
  .map(String)
  .filter((file) => file.endsWith(".tsx"));
for (const file of settingsComponents) {
  assert.doesNotMatch(read(join("components/settings", file)), /from ["']@\/actions\/settings["']/, file);
}

// --- Email links open while logged in: the email change and the reset from
// Configuración are asked for with a session, and an auth route would send
// them to the home without using the token.
const routes = read("routes.ts");
const routeList = (name: string) => routes.match(new RegExp(`export const ${name} = \\[([^\\]]*)\\]`))?.[1] ?? "";
for (const link of ["/auth/new-verification", "/auth/new-password"]) {
  assert.ok(routeList("publicRoutes").includes(`"${link}"`), `${link} no es pública`);
  assert.ok(!routeList("authRoutes").includes(`"${link}"`), `${link} redirige con sesión`);
}
assert.match(read("actions/new-verification.ts"), /return \{ success: "Email actualizado correctamente", emailChanged: true \}/);
assert.match(read("components/auth/NewVerificationForm.tsx"), /router\.push\('emailChanged' in result \? '\/settings' : '\/auth\/login'\)/);

// --- The settings page is a Server Component shell.
const page = read("app/settings/page.tsx");
assert.doesNotMatch(page, /["']use client["']/);
assert.match(page, /const session = await auth\(\)/);
assert.match(page, /if \(!session\?\.user\?\.id\) redirect\("\/auth\/login"\)/);
assert.match(page, /<TwoFactorToggle initialEnabled=\{user\.isTwoFactorEnabled \?\? false\} \/>/);
assert.match(read("components/settings/security/change-password-dialog.tsx"), /^'use client'/);

// --- Schemas.
const ok = <T>(schema: { safeParse: (value: unknown) => { success: boolean; data?: T } }, value: unknown) => {
  const result = schema.safeParse(value);
  assert.ok(result.success, JSON.stringify(value));
  return result.data as T;
};
const fails = (schema: { safeParse: (value: unknown) => { success: boolean; error?: { issues: { message: string; path: PropertyKey[] }[] } } }, value: unknown, message: string) => {
  const result = schema.safeParse(value);
  assert.equal(result.success, false, JSON.stringify(value));
  assert.equal(result.error?.issues[0]?.message, message);
  return result.error!.issues[0]!;
};

assert.deepEqual(ok(UpdateNameSchema, { name: "  Ana  " }), { name: "Ana" });
fails(UpdateNameSchema, { name: " a " }, "El nombre debe tener entre 2 y 50 caracteres");
fails(UpdateNameSchema, { name: "x".repeat(51) }, "El nombre debe tener entre 2 y 50 caracteres");
ok(UpdateNameSchema, { name: "x".repeat(50) });

ok(UpdateEmailSchema, { email: "nueva@bambu.uy", password: "secreto" });
fails(UpdateEmailSchema, { email: "no-es-mail", password: "secreto" }, "Formato de email inválido");
fails(UpdateEmailSchema, { email: "nueva@bambu.uy", password: "" }, "Ingresá tu contraseña");

const passwords = { password: "actual1", newPassword: "nueva12", confirmPassword: "nueva12" };
ok(UpdatePasswordSchema, passwords);
fails(UpdatePasswordSchema, { ...passwords, password: "" }, "Ingresá tu contraseña actual");
fails(UpdatePasswordSchema, { ...passwords, newPassword: "corta", confirmPassword: "corta" }, "La nueva contraseña debe tener al menos 6 caracteres");
const mismatch = fails(UpdatePasswordSchema, { ...passwords, confirmPassword: "otra123" }, "Las contraseñas no coinciden");
assert.deepEqual(mismatch.path, ["confirmPassword"]);

ok(UpdateProfileImageSchema, { image: "data:image/png;base64,AAAA" });
fails(UpdateProfileImageSchema, { image: "https://example.com/a.png" }, "Formato de imagen inválido");
fails(UpdateProfileImageSchema, { image: `data:image/png;base64,${"A".repeat(7_000_000)}` }, "La imagen es demasiado grande. Máximo 5MB.");

console.log("check:settings-auth OK");
