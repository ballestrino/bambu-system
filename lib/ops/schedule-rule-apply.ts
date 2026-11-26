import "server-only";

import { db } from "@/lib/db";
import { assertScheduleRuleExists } from "@/lib/ops/assertions";
import { generateOccurrences } from "@/lib/ops/job-occurrence-generator";
import { getTodayKey, laterDateKey } from "@/lib/ops/occurrence-generation-presets";
import { resolveOccurrenceGenerationRange } from "@/lib/ops/occurrence-generation-range";
import { findReplaceableOccurrences } from "@/lib/ops/occurrence-replacement-query";
import { dayKeyOf, dayStartUtc, mondayOfKey, shiftDayKey } from "@/lib/ops/schedule-rule-cleanup-window";
import type { ApplyScheduleRuleChangeInput } from "@/schemas/ops/schedule-rule-board";

// "El cambio corre desde": después de guardar la regla, rehace sus visitas sin
// tocar desde esa fecha (o desde hoy, si es antes) hasta la semana de la última
// visita que ya tenía. No genera más allá de lo que ya estaba generado. Las
// editadas, con horas o realizadas quedan como están.
export const applyScheduleRuleChangeInDb = async (
  { applyFrom, scheduleRuleId }: ApplyScheduleRuleChangeInput,
  userId: string
) => {
  await assertScheduleRuleExists(scheduleRuleId);
  const fromKey = laterDateKey(applyFrom, getTodayKey());

  const last = await db.jobOccurrence.findFirst({
    where: { archivedAt: null, scheduleRuleId, scheduledStartAt: { gte: dayStartUtc(fromKey) } },
    orderBy: { scheduledStartAt: "desc" },
    select: { scheduledStartAt: true },
  });
  if (!last) return { deleted: 0, kept: 0, visits: 0 };

  const endKey = shiftDayKey(mondayOfKey(dayKeyOf(last.scheduledStartAt)), 6);
  const range = resolveOccurrenceGenerationRange(fromKey, endKey);
  if (!range || range.isEmpty) return { deleted: 0, kept: 0, visits: 0 };

  const filters = { scheduleRuleId };
  const { kept, replaceable } = await findReplaceableOccurrences(range, filters);
  const result = await generateOccurrences(
    range,
    filters,
    userId,
    replaceable.map((occurrence) => occurrence.id)
  );

  return { deleted: result.deleted, kept, visits: result.visits };
};
