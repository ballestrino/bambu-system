"use server";

import { db } from "@/lib/db";
import { getActionErrorMessage } from "@/lib/ops/action-error";
import { requireAdminSession } from "@/lib/require-admin-session";

const defaultCategories = [
  { name: "BPS", kind: "BPS", color: "#3B82F6" },
  { name: "Taxi", kind: "TRANSPORT", color: "#F59E0B" },
  { name: "Bus", kind: "TRANSPORT", color: "#10B981" },
  { name: "Otros", kind: "GENERAL", color: "#64748B" },
] as const;

// Seeding lives here, behind an explicit admin action, so that reading the
// categories stays a pure read. See data/ops/operational-costs.ts.
export const initializeDefaultCostCategories = async () => {
  try {
    const session = await requireAdminSession();

    await Promise.all(
      defaultCategories.map((category) =>
        db.operationalCostCategory.upsert({
          where: { name: category.name },
          create: { ...category, createdById: session.user.id },
          update: {},
        })
      )
    );

    return { success: "Categorias por defecto creadas" };
  } catch (error) {
    console.error("Error initializing default cost categories:", error);
    return {
      error: getActionErrorMessage(
        error,
        "Error al crear las categorias por defecto"
      ),
    };
  }
};
