import { z } from "zod";

import { INSTRUCTION_ACTIONS, TEAM_RULE_MAX } from "@/lib/agent/team-instructions";

// Instrucciones del equipo: la entrada de la tool (obligatoria y nullable,
// como las demás), el payload de CHANGE_INSTRUCTIONS y restaurar una versión.
const ruleIdSchema = z.string().trim().min(1).max(32);

const actionSchema = z.enum(INSTRUCTION_ACTIONS);

export const proposeInstructionChangeInputSchema = z.object({
  action: actionSchema.describe("ADD suma una regla, UPDATE cambia el texto de una, REMOVE la quita"),
  ruleId: ruleIdSchema
    .nullable()
    .describe('id de la regla de "Instrucciones del equipo" que cambia o se quita; null al agregar'),
  text: z
    .string()
    .trim()
    .max(TEAM_RULE_MAX)
    .nullable()
    .describe("La regla completa como queda, corta e imperativa (\"Antes de agendar, preguntá la dirección\"); null al quitar"),
});

export const changeInstructionsPayloadSchema = z.object({
  action: actionSchema,
  ruleId: ruleIdSchema.nullable(),
  text: z.string().trim().min(1).max(TEAM_RULE_MAX).nullable(),
  // La versión vigente al proponer: si cambió, la propuesta no se aplica.
  baseVersion: z.number().int().min(0),
});

export const restoreInstructionVersionSchema = z.object({
  version: z.number().int().min(1),
  // La vigente que vio la pantalla: si cambió en el medio, no se restaura.
  currentVersion: z.number().int().min(0),
});
