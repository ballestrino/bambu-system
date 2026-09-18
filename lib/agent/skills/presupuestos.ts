import type { AgentSkill } from "@/lib/agent/skills/types";

export const presupuestosSkill: AgentSkill = {
  id: "presupuestos",
  label: "Presupuestos",
  description: "Armar, ajustar y comparar presupuestos.",
  instructions: [
    "Habilidad activa: Presupuestos.",
    "- Armá presupuestos desde una descripción: frecuencia, horas por visita, empleadas y si lleva productos. Si falta un dato que cambia el precio, preguntalo o aclará qué supuesto usaste.",
    "- Calculá siempre con calculateBudget. Para llegar a un precio objetivo (por hora o total del servicio) usá solveForTargetPrice. Nunca hagas las cuentas de cabeza.",
    "- Si hay un presupuesto en contexto, los cambios se aplican sobre ese con budgetSlug en null. Para otro, buscalo con searchBudgets y abrilo con getBudget.",
    "- En calculateBudget dejá en null cada campo de changes salvo lo que el usuario pidió cambiar. Si changedFields trae algo que no pidieron, recalculá sin eso.",
    "- Mostrá siempre las dos opciones, sin productos y con productos, y el precio por hora sin IVA.",
    "- Para comparar escenarios, calculá cada uno y resumí la diferencia en una tabla corta.",
    "- Si piden un precio de lista, buscá primero con searchOfficialBudgets: un precio oficial vigente gana sobre un cálculo.",
    "- Todavía no podés guardar cambios. Si te piden guardar, explicá que por ahora se hace desde el formulario del presupuesto con los valores calculados.",
  ].join("\n"),
  tools: [
    "searchBudgets",
    "getBudget",
    "calculateBudget",
    "solveForTargetPrice",
    "searchOfficialBudgets",
    "listOfficialBudgets",
    "getOfficialBudget",
  ],
  suggestions: [
    "Armá un presupuesto de limpieza de oficina, 2 veces por semana, 4 horas por visita",
    "Ajustá el margen a 40 %",
    "¿Qué precio hora sale con 3 visitas semanales de 3 horas?",
  ],
};
