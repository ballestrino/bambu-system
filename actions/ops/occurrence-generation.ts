"use server";

import { getActionErrorMessage } from "@/lib/ops/action-error";
import {
  generateOccurrences,
  previewOccurrenceGeneration,
} from "@/lib/ops/job-occurrence-generator";
import { resolveOccurrenceGenerationRange } from "@/lib/ops/occurrence-generation-range";
import { toLocalDateKey } from "@/lib/ops/schedule-week";
import { DEFAULT_OPS_TIMEZONE, getLocalDate } from "@/lib/ops/timezone";
import { requireAdminSession } from "@/lib/require-admin-session";
import { OccurrenceGenerationSchema } from "@/schemas/ops";

const parseGeneration = (input: unknown) => {
  const parsed = OccurrenceGenerationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Rango inválido" };
  }

  const { startDate, endDate, jobId, scheduleRuleId, replaceIds } = parsed.data;
  const range = resolveOccurrenceGenerationRange(startDate, endDate);
  if (!range) return { error: "Rango inválido" };

  return { range, filters: { jobId, scheduleRuleId }, replaceIds: replaceIds ?? [] };
};

const rangeFlags = (range: NonNullable<ReturnType<typeof resolveOccurrenceGenerationRange>>) => ({
  cappedAtHorizon: range.cappedAtHorizon,
  // A day key, not a Date: the client wrapper serializes the result as JSON.
  horizonKey: toLocalDateKey(getLocalDate(range.horizonEnd, DEFAULT_OPS_TIMEZONE)),
  startsInPast: range.startsInPast,
});

// How many visits a manual generation would create. Writes nothing.
export const previewJobOccurrenceGeneration = async (input: unknown) => {
  try {
    await requireAdminSession();
    const parsed = parseGeneration(input);
    if (!parsed.range) return { error: parsed.error };

    const counts = parsed.range.isEmpty
      ? { jobs: 0, kept: 0, replaceable: [], visits: 0 }
      : await previewOccurrenceGeneration(parsed.range, parsed.filters);

    // Day keys and ISO strings, not Dates: the client wrapper serializes JSON.
    const replaceable = counts.replaceable.map((occurrence) => ({
      ...occurrence,
      endAt: occurrence.endAt.toISOString(),
      startAt: occurrence.startAt.toISOString(),
    }));

    return { preview: { ...counts, ...rangeFlags(parsed.range), replaceable } };
  } catch (error) {
    console.error("Error previewing occurrence generation:", error);
    return {
      error: getActionErrorMessage(error, "No se pudo calcular qué visitas faltan"),
    };
  }
};

// Creates the visits the active rules have in the range and are still missing.
export const generateJobOccurrences = async (input: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = parseGeneration(input);
    if (!parsed.range) return { error: parsed.error };

    const result = parsed.range.isEmpty
      ? { deleted: 0, jobs: 0, visits: 0 }
      : await generateOccurrences(
          parsed.range,
          parsed.filters,
          session.user.id,
          parsed.replaceIds
        );

    return { result };
  } catch (error) {
    console.error("Error generating occurrences:", error);
    return {
      error: getActionErrorMessage(error, "No se pudieron generar las visitas"),
    };
  }
};
