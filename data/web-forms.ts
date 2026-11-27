import "server-only";

import type { Prisma, WebFormKind, WebFormStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-admin-session";

// Lecturas de los formularios web. Son del equipo: cualquier admin los ve.
const LIST_LIMIT = 200;

type ListFilters = { status: WebFormStatus | "ALL"; kind: WebFormKind | "ALL"; search: string };

const filterWhere = ({ kind, search }: ListFilters): Prisma.WebFormSubmissionWhereInput => ({
  ...(kind === "ALL" ? {} : { kind }),
  ...(search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { message: { contains: search, mode: "insensitive" } },
        ],
      }
    : {}),
});

const listSelect = {
  id: true,
  kind: true,
  status: true,
  name: true,
  email: true,
  phone: true,
  service: true,
  location: true,
  message: true,
  fromTrebol: true,
  readAt: true,
  createdAt: true,
  attachment: { select: { filename: true } },
  _count: { select: { replies: { where: { sentAt: { not: null } } } } },
} as const satisfies Prisma.WebFormSubmissionSelect;

export const listWebForms = async (filters: ListFilters) => {
  await requireAdminSession();
  const where = filterWhere(filters);
  const [rows, grouped, newGrouped] = await Promise.all([
    db.webFormSubmission.findMany({
      where: filters.status === "ALL" ? where : { ...where, status: filters.status },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: LIST_LIMIT,
      select: listSelect,
    }),
    db.webFormSubmission.groupBy({ by: ["status"], where, _count: { _all: true } }),
    // Los nuevos de cada pestaña (Pedidos de servicio, Currículums), sin filtros.
    db.webFormSubmission.groupBy({ by: ["kind"], where: { status: "NEW" }, _count: { _all: true } }),
  ]);
  const counts = { NEW: 0, REPLIED: 0, ARCHIVED: 0, ALL: 0 };
  for (const group of grouped) {
    counts[group.status] = group._count._all;
    counts.ALL += group._count._all;
  }
  const newByKind = { CONTACT: 0, JOB_APPLICATION: 0 };
  for (const group of newGrouped) newByKind[group.kind] = group._count._all;
  return {
    counts,
    newByKind,
    rows: rows.map(({ _count, attachment, ...row }) => ({
      ...row,
      cvFilename: attachment?.filename ?? null,
      replyCount: _count.replies,
    })),
  };
};

export type WebFormListRow = Awaited<ReturnType<typeof listWebForms>>["rows"][number];

export const getWebForm = async (id: string) => {
  await requireAdminSession();
  return db.webFormSubmission.findUnique({
    where: { id },
    select: {
      ...listSelect,
      _count: undefined,
      handledAt: true,
      handledBy: { select: { name: true } },
      attachment: { select: { filename: true, mimeType: true, sizeBytes: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          subject: true,
          body: true,
          toAddress: true,
          savedToSent: true,
          sentAt: true,
          createdAt: true,
          sentBy: { select: { name: true } },
        },
      },
    },
  });
};

export type WebFormDetail = NonNullable<Awaited<ReturnType<typeof getWebForm>>>;

// Para el número de la barra lateral.
export const countNewWebForms = async () => {
  await requireAdminSession();
  return db.webFormSubmission.count({ where: { status: "NEW" } });
};
