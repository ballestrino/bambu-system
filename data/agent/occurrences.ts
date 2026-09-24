import "server-only";

import type { OccurrenceStatus } from "@prisma/client";

import { opsOccurrenceInclude } from "@/data/ops/includes";
import { visibleOccurrenceWhere } from "@/data/ops/shared";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";

// Visitas en modo solo lectura: el agente lee solo lo que ya existe. Desde la
// feature 9 las visitas se generan a mano (Generar visitas), así que ninguna
// lectura escribe filas.
export const getAgentOccurrences = async ({
  start,
  end,
  statuses,
  jobId,
  employeeId,
  take,
}: {
  start: Date;
  end: Date;
  statuses?: OccurrenceStatus[];
  jobId?: string;
  employeeId?: string;
  take?: number;
}) => {
  await requireAdminSession();

  return db.jobOccurrence.findMany({
    where: {
      ...visibleOccurrenceWhere,
      jobId,
      employees: employeeId ? { some: { employeeId } } : undefined,
      status: statuses?.length ? { in: statuses } : undefined,
      scheduledStartAt: { gte: start, lte: end },
    },
    include: opsOccurrenceInclude,
    orderBy: [{ scheduledStartAt: "asc" }],
    take,
  });
};
