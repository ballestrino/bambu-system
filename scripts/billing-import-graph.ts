import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Lo que importa un archivo del repo, siguiendo los "@/…" y los relativos
// (docs/billing.md, regla 1): sirve para ver si algo del agente llega, aunque
// sea por el medio, al código que emite.
const IMPORT = /(?:import|export)\s[^"']*?from\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
const EXTENSIONS = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

export type ReadSource = (path: string) => string | null;

export const readRepoSource =
  (root: string): ReadSource =>
  (path) => {
    const full = join(root, path);
    return existsSync(full) ? readFileSync(full, "utf8") : null;
  };

const resolveImport = (from: string, specifier: string, read: ReadSource) => {
  let base: string;
  if (specifier.startsWith("@/")) base = specifier.slice(2);
  else if (specifier.startsWith(".")) {
    const parts = from.split("/").slice(0, -1);
    for (const piece of specifier.split("/")) {
      if (piece === "..") parts.pop();
      else if (piece !== ".") parts.push(piece);
    }
    base = parts.join("/");
  } else return null;
  return EXTENSIONS.map((extension) => `${base}${extension}`).find((path) => /\.tsx?$/.test(path) && read(path) !== null) ?? null;
};

// La primera cadena de imports desde `entries` hasta un archivo que cumpla
// `isForbidden`, o null si no hay ninguna.
export const findForbiddenImport = (entries: string[], isForbidden: (path: string) => boolean, read: ReadSource) => {
  const parent = new Map<string, string | null>(entries.map((entry) => [entry, null]));
  const queue = [...entries];
  while (queue.length) {
    const file = queue.shift()!;
    if (isForbidden(file)) {
      const chain = [file];
      for (let step = parent.get(file); step; step = parent.get(step)) chain.unshift(step);
      return chain;
    }
    const source = read(file) ?? "";
    for (const match of source.matchAll(IMPORT)) {
      const target = resolveImport(file, match[1] ?? match[2], read);
      if (target && !parent.has(target)) {
        parent.set(target, file);
        queue.push(target);
      }
    }
  }
  return null;
};

export const isIssueCode = (path: string) =>
  path === "lib/billing/biller-issue.ts" ||
  path === "lib/billing/biller-issue-server.ts" ||
  path === "lib/billing/issue-run.ts" ||
  path.startsWith("actions/billing/issue-");
