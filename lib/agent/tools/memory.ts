import "server-only";

import { tool } from "ai";

import { getAgentMemoryState, MEMORY_SEARCH_LIMIT, searchAgentMemories } from "@/data/agent/memories";
import { buildSaveMemoryProposal, MEMORY_KIND_LABELS } from "@/lib/agent/memory";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { saveProposal } from "@/lib/agent/tools/proposals";
import { runTool, toolError, toolOk } from "@/lib/agent/tool-result";
import { proposeMemoryInputSchema, searchMemoryInputSchema } from "@/schemas/agent-memory";

// La memoria del agente: buscar es libre; recordar es una propuesta que un
// admin confirma en su tarjeta. Nada se guarda durante el turno.
export const createMemoryTools = (ctx: AgentToolContext) => ({
  searchMemory: tool({
    description:
      "Busca en la memoria del equipo (datos del negocio, de clientes, estilo y acuerdos de precio confirmados por un admin) lo que no entró en el prompt. Usala cuando el prompt dice que hay más memorias y el pedido puede necesitarlas, por ejemplo con el nombre de un cliente.",
    inputSchema: searchMemoryInputSchema,
    execute: (input) =>
      runTool("searchMemory", async () => {
        const rows = await searchAgentMemories({ query: input.query ?? undefined, kind: input.kind ?? undefined });
        return toolOk({
          card: "list" as const,
          kind: "memories" as const,
          total: rows.length,
          truncated: rows.length >= MEMORY_SEARCH_LIMIT,
          rows: rows.map((row) => ({
            id: row.id,
            kind: row.kind,
            kindLabel: MEMORY_KIND_LABELS[row.kind],
            text: row.text,
            expiresAt: row.expiresAt,
          })),
        });
      }),
  }),

  proposeMemory: tool({
    description:
      "Prepara recordar un dato o una preferencia en todas las conversaciones (o cambiar una memoria con replacesId) para que un admin lo confirme en una tarjeta: no guarda nada. Un dato por llamada. Solo si el usuario lo pide o te corrige algo que va a servir en otras conversaciones.",
    inputSchema: proposeMemoryInputSchema,
    execute: (input, { toolCallId }) =>
      runTool("proposeMemory", async () => {
        const replaces = input.replacesId ? await getAgentMemoryState(input.replacesId) : null;
        if (input.replacesId && !replaces) {
          return toolError("not_found", "No encontré esa memoria. Buscala con searchMemory o proponela como nueva.");
        }
        const built = buildSaveMemoryProposal({ ...input, replaces });
        if (!built.ok) return toolError(built.code, built.message);
        return saveProposal(ctx, toolCallId, built);
      }),
  }),
});
