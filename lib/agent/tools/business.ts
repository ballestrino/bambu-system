import "server-only";

import { tool } from "ai";

import { BUSINESS_PROFILE } from "@/lib/agent/business-profile";
import { formatMonthLabel, formatToday, getCurrentMonthKey } from "@/lib/agent/month";
import { toolOk } from "@/lib/agent/tool-result";
import { emptyInputSchema } from "@/schemas/agent-tools";

export const createBusinessTools = () => ({
  getBusinessProfile: tool({
    description:
      "Datos fijos del negocio (contacto, IVA, Literal E, aportes BPS, transporte, multiplicador semanal, valores por defecto) y la fecha y el mes actuales en Montevideo. Ya están en tus instrucciones: usala si necesitás la fecha o el detalle completo.",
    inputSchema: emptyInputSchema,
    execute: async () => {
      const month = getCurrentMonthKey();
      return toolOk({
        card: "business" as const,
        profile: BUSINESS_PROFILE,
        today: formatToday(),
        month,
        monthLabel: formatMonthLabel(month),
      });
    },
  }),
});
