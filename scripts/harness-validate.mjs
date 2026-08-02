#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
let exitCode = 0;

const requiredFiles = [
  "AGENTS.md",
  "CHECKPOINTS.md",
  "feature_list.json",
  "init.ps1",
  "init.sh",
  "progress/current.md",
  "progress/history.md",
  "docs/architecture.md",
  "docs/conventions.md",
  "docs/verification.md",
  ".codex/agents/leader.md",
  ".codex/agents/implementer.md",
  ".codex/agents/reviewer.md",
];

function log(prefix, message) {
  console.log(`${prefix} ${message}`);
}

function ok(message) {
  log("[OK]", message);
}

function fail(message) {
  exitCode = 1;
  log("[FAIL]", message);
}

function warn(message) {
  log("[WARN]", message);
}

function readJson(file) {
  const target = path.join(root, file);
  return JSON.parse(readFileSync(target, "utf8"));
}

log("==", "Harness file check");
for (const file of requiredFiles) {
  if (existsSync(path.join(root, file))) {
    ok(`exists ${file}`);
  } else {
    fail(`missing ${file}`);
  }
}

log("==", "Package scripts");
try {
  const pkg = readJson("package.json");
  for (const scriptName of ["dev", "build", "lint", "harness"]) {
    if (pkg.scripts?.[scriptName]) {
      ok(`package.json script: ${scriptName}`);
    } else {
      fail(`package.json missing script: ${scriptName}`);
    }
  }
} catch (error) {
  fail(`package.json invalid: ${error.message}`);
}

log("==", "Feature state");
try {
  const data = readJson("feature_list.json");
  const valid = new Set(data.rules?.valid_status ?? []);

  if (!Array.isArray(data.features)) {
    fail("feature_list.json must contain a features array");
  } else {
    const ids = new Set();
    const names = new Set();
    const inProgress = [];

    for (const feature of data.features) {
      if (ids.has(feature.id)) {
        fail(`duplicate feature id: ${feature.id}`);
      }
      if (names.has(feature.name)) {
        fail(`duplicate feature name: ${feature.name}`);
      }
      ids.add(feature.id);
      names.add(feature.name);

      if (!valid.has(feature.status)) {
        fail(`invalid status for ${feature.name}: ${feature.status}`);
      }
      if (feature.status === "in_progress") {
        inProgress.push(feature.name);
      }
      if (!Array.isArray(feature.acceptance) || feature.acceptance.length === 0) {
        warn(`feature ${feature.name} has no acceptance criteria`);
      }
    }

    if (inProgress.length > 1) {
      fail(`multiple features in_progress: ${inProgress.join(", ")}`);
    } else {
      ok(`in_progress count: ${inProgress.length}`);
    }

    ok(`features checked: ${data.features.length}`);
  }
} catch (error) {
  fail(`feature_list.json invalid: ${error.message}`);
}

if (exitCode === 0) {
  ok("harness validation passed");
} else {
  fail("harness validation failed");
}

process.exit(exitCode);
