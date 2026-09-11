import "server-only";

import { Prisma } from "@prisma/client";

export const opsAuditUserSelect = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;

// "guarani" tiene que encontrar "Guaraní": saca acentos y mayúsculas para que
// el buscador no dependa de como se escribio el nombre.
export const normalizeOpsSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-UY")
    .trim();

export const matchesOpsSearchQuery = (
  query: string,
  fields: (string | null | undefined)[]
) => {
  const needle = normalizeOpsSearchText(query);

  if (!needle) {
    return true;
  }

  return fields.some(
    (field) => field && normalizeOpsSearchText(field).includes(needle)
  );
};

export const buildDateTimeRange = (
  startDate?: Date,
  endDate?: Date
): Prisma.DateTimeFilter | undefined => {
  if (!startDate && !endDate) {
    return undefined;
  }

  return {
    gte: startDate,
    lte: endDate,
  };
};

// Oculta las visitas programadas de trabajos archivados, pero conserva su
// historial ya realizado.
export const visibleOccurrenceWhere = {
  archivedAt: null,
  NOT: {
    job: { archivedAt: { not: null } },
    status: "SCHEDULED",
  },
} satisfies Prisma.JobOccurrenceWhereInput;
