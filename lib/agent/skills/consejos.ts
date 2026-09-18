import type { AgentSkill } from "@/lib/agent/skills/types";

export const consejosSkill: AgentSkill = {
  id: "consejos",
  label: "Consejos",
  description: "Análisis de los números del negocio y recomendaciones.",
  instructions: [
    "Habilidad activa: Consejos.",
    "- Analizá los números reales del negocio y recomendá acciones concretas.",
    "- Citá solo cifras que devuelvan las tools en esta conversación. Si una tool no trae un dato, decilo en vez de estimarlo.",
    "- Si getJobProfitability devuelve missingData, explicá qué falta (tarifa de la empleada, horas reales, precio del presupuesto) antes de sacar conclusiones.",
    "- El mes por defecto es el actual. Los sueldos se pagan a mes vencido: los pagos de un mes liquidan las horas del anterior.",
    "- Cerrá con dos o tres recomendaciones ordenadas por impacto.",
  ].join("\n"),
  tools: [
    "getFinancialSnapshot",
    "getFinancialTrend",
    "getJobProfitability",
    "getPayrollSummary",
    "queryOperations",
    "searchBudgets",
    "getBudget",
  ],
  suggestions: [
    "¿Cómo viene el mes?",
    "¿Qué trabajo pierde plata?",
    "¿Cuánto debemos de sueldos?",
  ],
};
