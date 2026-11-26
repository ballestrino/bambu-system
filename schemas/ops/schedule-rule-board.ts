import { z } from "zod";

import { cuidSchema } from "@/schemas/ops/common";

// Vista de reglas de calendario (feature 73): limpiar las visitas de una regla
// desde una semana de corte, deshacerlo y aplicar un cambio desde una fecha.
const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Fecha inválida" });

export const scheduleRuleCleanupDirections = ["FORWARD", "BACK"] as const;

// Todas las visitas visibles de la regla: limpiar hacia atrás o hacia
// adelante alcanza también a las que quedan fuera de la tira de semanas.
export const ScheduleRuleVisitsSchema = z.object({ scheduleRuleId: cuidSchema });

// FORWARD borra desde cutDate inclusive; BACK, hasta cutDate inclusive.
// adjustRule termina la regla el día anterior al corte o la hace empezar el
// día siguiente, según el sentido.
export const ScheduleRuleCleanupSchema = z.object({
  scheduleRuleId: cuidSchema,
  direction: z.enum(scheduleRuleCleanupDirections),
  cutDate: dateKeySchema,
  adjustRule: z.boolean().default(false),
});

export const ScheduleRuleCleanupUndoSchema = z.object({
  scheduleRuleId: cuidSchema,
  occurrenceIds: z.array(cuidSchema).max(2000),
  previousStartDate: dateKeySchema,
  previousEndDate: dateKeySchema.nullable(),
});

export const ApplyScheduleRuleChangeSchema = z.object({
  scheduleRuleId: cuidSchema,
  applyFrom: dateKeySchema,
});

export type ScheduleRuleCleanupDirection = (typeof scheduleRuleCleanupDirections)[number];
export type ScheduleRuleVisitsInput = z.infer<typeof ScheduleRuleVisitsSchema>;
export type ScheduleRuleCleanupInput = z.input<typeof ScheduleRuleCleanupSchema>;
export type ScheduleRuleCleanupValues = z.infer<typeof ScheduleRuleCleanupSchema>;
export type ScheduleRuleCleanupUndoInput = z.infer<typeof ScheduleRuleCleanupUndoSchema>;
export type ApplyScheduleRuleChangeInput = z.infer<typeof ApplyScheduleRuleChangeSchema>;
