import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// La columna de conversaciones de la página se oculta desde la cabecera y el
// navegador lo recuerda (feature 69); el teléfono no cambia. Lo usa
// check:agent-page.
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");

assert.match(read("components/agent/agent-browser-flags.ts"), /conversationsHidden: \{ key: "bambu\.agent\.conversationsHidden", fallback: false \}/);
const host = read("components/agent/agent-page-host.tsx");
assert.match(host, /const conversationsHidden = useAgentFlag\("conversationsHidden"\);/);
assert.match(host, /!conversationsHidden && "@4xl\/panel:grid-cols-\[300px_minmax\(0,1fr\)\]"/);
assert.match(host, /onToggleConversations=\{\(\) => saveAgentFlag\("conversationsHidden", !conversationsHidden\)\}/);
const header = read("components/agent/agent-page-header.tsx");
// Only with the column (desktop): the buttons are hidden below @4xl/panel.
assert.match(header, /const iconButton =\n\s+"hidden [^"]*@4xl\/panel:grid";/);
assert.match(header, /\{conversationsHidden && \(\n\s+<button type="button" onClick=\{onNew\} aria-label="Nueva conversación"/);
