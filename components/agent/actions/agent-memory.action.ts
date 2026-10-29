import {
  deleteAgentMemory,
  expireAgentMemory,
  getAgentMemories,
  updateAgentMemory,
} from "@/actions/agent/memories";
import ValidationError from "@/instances/validation-error";
import type { UpdateAgentMemoryInput } from "@/schemas/agent-memory";

// La pantalla de Memoria con TanStack Query: un { error } se lanza como
// ValidationError para que la query o la mutación lo muestren.
const FALLBACK = "No se pudo completar la acción";

export const listMemoriesAction = async () => {
  const result = await getAgentMemories();
  if ("error" in result) throw new ValidationError(result.error ?? FALLBACK);
  return result.memories;
};

const write = async (run: Promise<{ success?: string; error?: string }>) => {
  const result = await run;
  if (!result.success) throw new ValidationError(result.error ?? FALLBACK);
  return result.success;
};

export const updateMemoryAction = (input: UpdateAgentMemoryInput) => write(updateAgentMemory(input));

export const expireMemoryAction = (id: string) => write(expireAgentMemory(id));

export const deleteMemoryAction = (id: string) => write(deleteAgentMemory(id));
