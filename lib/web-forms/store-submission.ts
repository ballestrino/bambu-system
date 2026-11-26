import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type { WebFormInbound } from "@/schemas/web-forms";

type StoredCv = { filename: string; mimeType: string; bytes: Uint8Array };

export const WEB_FORMS_PAGE_PATH = "/dashboard/web-forms";

export const webFormUrl = (id: string) => {
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") ?? "";
  return `${base}${WEB_FORMS_PAGE_PATH}?id=${id}`;
};

// Guarda el formulario con su CV en una sola escritura. Si la web reintenta con
// el mismo externalId, devuelve el que ya estaba en vez de duplicarlo.
export const storeWebFormSubmission = async (input: WebFormInbound, cv: StoredCv | null) => {
  const existing = await db.webFormSubmission.findUnique({
    where: { externalId: input.externalId },
    select: { id: true },
  });
  if (existing) return { id: existing.id, created: false };

  try {
    const created = await db.webFormSubmission.create({
      data: {
        externalId: input.externalId,
        kind: input.kind,
        name: input.name,
        email: input.email,
        phone: input.phone,
        service: input.kind === "CONTACT" ? input.service : null,
        location: input.kind === "CONTACT" ? input.location : null,
        message: input.message,
        fromTrebol: input.kind === "CONTACT" && input.fromTrebol,
        attachment: cv
          ? {
              create: {
                filename: cv.filename,
                mimeType: cv.mimeType,
                sizeBytes: cv.bytes.byteLength,
                data: Buffer.from(cv.bytes),
              },
            }
          : undefined,
      },
      select: { id: true },
    });
    return { id: created.id, created: true };
  } catch (error) {
    // Dos reintentos a la vez: el segundo choca con el único y lee el primero.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const row = await db.webFormSubmission.findUniqueOrThrow({
        where: { externalId: input.externalId },
        select: { id: true },
      });
      return { id: row.id, created: false };
    }
    throw error;
  }
};
