import { getAgentInstructionVersions, restoreAgentInstructions } from "@/actions/agent/instructions";
import ValidationError from "@/instances/validation-error";

// La pantalla de instrucciones con TanStack Query: un { error } se lanza como
// ValidationError para que la query o la mutación lo muestren.
const FALLBACK = "No se pudo completar la acción";

export const listInstructionVersionsAction = async () => {
  const result = await getAgentInstructionVersions();
  if ("error" in result) throw new ValidationError(result.error ?? FALLBACK);
  return result.versions;
};

export const restoreInstructionsAction = async (input: { version: number; currentVersion: number }) => {
  const result = await restoreAgentInstructions(input);
  if ("error" in result) throw new ValidationError(result.error ?? FALLBACK);
  return result.success;
};
