import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getChatCopyPayload } from "../lib/ai-chat-copy";
import { replyDocSchema, replyDocToHtml, replyDocToText } from "../lib/web-forms/reply-doc";
import { looksLikeMarkdown, markdownToReplyDoc, parseInlineMarkdown } from "../lib/web-forms/reply-markdown";

// Formato de la respuesta de Formularios (feature 75): listas, Markdown del
// agente y el copiado como email. Lo importa check-web-forms.ts.

// --- Listas con viñetas, numeradas y anidadas: texto y HTML.
const listDoc = replyDocSchema.parse({
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Incluye:" }] },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Pisos", marks: [{ type: "bold" }] }] }] },
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Baños" }] },
            { type: "orderedList", attrs: { start: 1, type: null }, content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "<a>" }] }] }] },
          ],
        },
      ],
    },
    { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Tres" }] }] }] },
  ],
});
assert.equal(replyDocToText(listDoc), "Incluye:\n- Pisos\n- Baños\n  1. <a>\n3. Tres");
const listHtml = replyDocToHtml(listDoc);
assert.ok(listHtml.includes('<ul style="margin:0;padding-left:24px"><li><p style="margin:0"><strong>Pisos</strong></p></li>'));
assert.ok(listHtml.includes("&lt;a&gt;") && !listHtml.includes("<a>"));
assert.ok(listHtml.includes('<ol style="margin:0;padding-left:24px" start="3">'));
assert.equal(replyDocSchema.safeParse({ type: "doc", content: [{ type: "bulletList", content: [] }] }).success, false);

// --- Markdown del agente al documento.
assert.deepEqual(parseInlineMarkdown("Precio **$ 54.100** e *IVA*"), [
  { type: "text", text: "Precio " },
  { type: "text", text: "$ 54.100", marks: [{ type: "bold" }] },
  { type: "text", text: " e " },
  { type: "text", text: "IVA", marks: [{ type: "italic" }] },
]);
const fromMarkdown = markdownToReplyDoc("Hola Ana,\n\n\nIncluye:\n- **Pisos**\n- Baños\n  1. Lavado\n\nGracias");
assert.equal(replyDocToText(fromMarkdown), "Hola Ana,\n\nIncluye:\n- Pisos\n- Baños\n  1. Lavado\n\nGracias");
assert.ok(replyDocSchema.safeParse(fromMarkdown).success);
assert.equal(markdownToReplyDoc("1. Uno\n2. Dos").content[0].type, "orderedList");
assert.equal(markdownToReplyDoc("# Título").content[0].type, "paragraph");
assert.ok(looksLikeMarkdown("- uno\n- dos") && looksLikeMarkdown("es **clave**") && !looksLikeMarkdown("Hola, ¿cómo estás?"));

// --- "Copiar como email" lleva negrita, cursiva y listas en el HTML.
const copied = getChatCopyPayload("Hola **Ana**, *gracias*.\n\n- uno\n- dos", "email");
assert.ok(copied.html?.includes("<strong>Ana</strong>") && copied.html.includes("<em>gracias</em>"));
assert.ok(copied.html?.includes("<ul><li>uno</li><li>dos</li></ul>"));

// --- El editor separa los bloques pegados y la tool solo va con un formulario.
assert.ok(readFileSync("components/web-forms/reply-editor.tsx", "utf8").includes("transformPastedHTML: spacePastedBlocks"));
assert.ok(readFileSync("lib/agent/run.ts", "utf8").includes("input.budgetContext.webFormId ? WEB_FORM_ONLY_TOOLS"));
assert.ok(readFileSync("lib/agent/tools/web-form-reply.ts", "utf8").includes("validateEmailDraft(input.body, ctx.grounding)"));
