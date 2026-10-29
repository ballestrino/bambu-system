import "server-only";

import { tool } from "ai";

import { getCurrentInstructions } from "@/data/agent/instructions";
import { buildInstructionChangeProposal } from "@/lib/agent/team-instructions";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { saveProposal } from "@/lib/agent/tools/proposals";
import { runTool, toolError } from "@/lib/agent/tool-result";
import { proposeInstructionChangeInputSchema } from "@/schemas/agent-instructions";

// Cambiar cómo trabaja el agente es una propuesta: la regla antes y después
// en una tarjeta que un admin confirma. Las reglas fijas no están en la lista
// del equipo y su contenido no se puede contradecir (protected-rules.ts).
export const createInstructionTools = (ctx: AgentToolContext) => ({
  proposeInstructionChange: tool({
    description:
      'Prepara agregar, cambiar o quitar una regla de "Instrucciones del equipo" (cómo tenés que trabajar en todas las conversaciones) para que un admin la confirme en una tarjeta con el antes y el después: no guarda nada. Una regla por llamada. Las reglas fijas no se cambian. Para un dato o una preferencia usá proposeMemory.',
    inputSchema: proposeInstructionChangeInputSchema,
    execute: (input, { toolCallId }) =>
      runTool("proposeInstructionChange", async () => {
        const built = buildInstructionChangeProposal(await getCurrentInstructions(), input);
        if (!built.ok) return toolError(built.code, built.message);
        return saveProposal(ctx, toolCallId, built);
      }),
  }),
});
