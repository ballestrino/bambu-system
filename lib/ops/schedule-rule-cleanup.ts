import "server-only";

import { db } from "@/lib/db";
import { assertScheduleRuleExists } from "@/lib/ops/assertions";
import {
  dayKeyOf,
  dayStartUtc,
  getAdjustedRuleDates,
  getCleanupWindow,
} from "@/lib/ops/schedule-rule-cleanup-window";
import { DEFAULT_OPS_TIMEZONE } from "@/lib/ops/timezone";
import type {
  ScheduleRuleCleanupUndoInput,
  ScheduleRuleCleanupValues as CleanupInput,
  ScheduleRuleVisitsInput,
} from "@/schemas/ops/schedule-rule-board";

// Lo que nunca pasó: programada, sin horario real y sin horas cargadas.
const deletableWhere = {
  actualEndAt: null,
  actualStartAt: null,
  archivedAt: null,
  status: "SCHEDULED" as const,
  timeEntries: { none: {} },
};

// Archiva (como "Eliminar visita") las visitas de la regla del tramo elegido
// que nunca pasaron y, si se pide, termina la regla o mueve su inicio. Todo en
// una transacción: si algo falla no cambia nada. Devuelve lo necesario para
// deshacer.
export const cleanupScheduleRuleVisitsInDb = async (input: CleanupInput, updatedById: string) => {
  const rule = await assertScheduleRuleExists(input.scheduleRuleId);
  const timeZone = rule.timezone || DEFAULT_OPS_TIMEZONE;
  const previousStartDate = dayKeyOf(rule.startDate, timeZone);
  const previousEndDate = rule.endDate ? dayKeyOf(rule.endDate, timeZone) : null;

  const adjusted = input.adjustRule
    ? getAdjustedRuleDates(input.direction, input.cutDate, { endKey: previousEndDate, startKey: previousStartDate })
    : null;
  if (adjusted && !adjusted.valid) {
    return {
      error:
        input.direction === "FORWARD"
          ? "El corte queda antes del inicio del horario: para sacarlo entero, eliminá el horario"
          : "El corte queda después del final del horario: para sacarlo entero, eliminá el horario",
    } as const;
  }

  const archivedIds = await db.$transaction(async (tx) => {
    const candidates = await tx.jobOccurrence.findMany({
      where: {
        ...deletableWhere,
        scheduleRuleId: rule.id,
        scheduledStartAt: getCleanupWindow(input.direction, input.cutDate),
      },
      select: { id: true },
    });
    const ids = candidates.map((candidate) => candidate.id);
    if (ids.length) {
      await tx.jobOccurrence.updateMany({
        where: { ...deletableWhere, id: { in: ids } },
        data: { archivedAt: new Date(), updatedById },
      });
    }
    if (adjusted) {
      await tx.jobScheduleRule.update({
        where: { id: rule.id },
        data: {
          endDate: adjusted.endKey ? dayStartUtc(adjusted.endKey, timeZone) : null,
          startDate: dayStartUtc(adjusted.startKey, timeZone),
          updatedById,
        },
      });
    }
    return ids;
  });

  return {
    archivedIds,
    endDate: adjusted ? adjusted.endKey : previousEndDate,
    previousEndDate,
    previousStartDate,
    ruleChanged: Boolean(adjusted),
    startDate: adjusted ? adjusted.startKey : previousStartDate,
  } as const;
};

// Deshace una limpieza: vuelve a mostrar esas visitas y deja las fechas de la
// regla como estaban.
export const undoScheduleRuleCleanupInDb = async (input: ScheduleRuleCleanupUndoInput, updatedById: string) => {
  const rule = await assertScheduleRuleExists(input.scheduleRuleId);
  const timeZone = rule.timezone || DEFAULT_OPS_TIMEZONE;

  const [restored] = await db.$transaction([
    db.jobOccurrence.updateMany({
      where: { archivedAt: { not: null }, id: { in: input.occurrenceIds }, scheduleRuleId: rule.id },
      data: { archivedAt: null, updatedById },
    }),
    db.jobScheduleRule.update({
      where: { id: rule.id },
      data: {
        endDate: input.previousEndDate ? dayStartUtc(input.previousEndDate, timeZone) : null,
        startDate: dayStartUtc(input.previousStartDate, timeZone),
        updatedById,
      },
    }),
  ]);

  return { restored: restored.count } as const;
};

// Las visitas visibles de una regla, para la tira de semanas y las cuentas de
// "Limpiar visitas".
export const findScheduleRuleVisits = async ({ scheduleRuleId }: ScheduleRuleVisitsInput) => {
  const rows = await db.jobOccurrence.findMany({
    where: { archivedAt: null, scheduleRuleId },
    select: {
      _count: { select: { timeEntries: true } },
      actualEndAt: true,
      actualStartAt: true,
      id: true,
      scheduledStartAt: true,
      status: true,
    },
    orderBy: { scheduledStartAt: "asc" },
  });

  return rows.map(({ _count, ...row }) => ({ ...row, timeEntryCount: _count.timeEntries }));
};
