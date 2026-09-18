// Catálogo de tools del agente: nombre, etiqueta en español y tipo. Módulo
// puro: lo usan las habilidades (allowlist), el check y la UI (chips).
export const AGENT_TOOL_KINDS = {
  read: "Lectura",
  calc: "Cálculo",
  proposal: "Propuesta",
  draft: "Borrador",
} as const;

export type AgentToolKind = keyof typeof AGENT_TOOL_KINDS;

export const AGENT_TOOL_CATALOG = {
  getBusinessProfile: { label: "Datos del negocio", kind: "read" },
  searchOfficialBudgets: { label: "Busca precios oficiales", kind: "read" },
  listOfficialBudgets: { label: "Lista presupuestos oficiales", kind: "read" },
  getOfficialBudget: { label: "Abre un presupuesto oficial", kind: "read" },
  searchBudgets: { label: "Busca presupuestos", kind: "read" },
  getBudget: { label: "Abre un presupuesto", kind: "read" },
  calculateBudget: { label: "Calcula un presupuesto", kind: "calc" },
  solveForTargetPrice: { label: "Calcula el margen para un precio", kind: "calc" },
  getFinancialSnapshot: { label: "Resumen financiero del mes", kind: "read" },
  getFinancialTrend: { label: "Tendencia financiera", kind: "read" },
  getJobProfitability: { label: "Rentabilidad de trabajos", kind: "read" },
  getPayrollSummary: { label: "Sueldos del mes", kind: "read" },
  queryOperations: { label: "Consulta operaciones", kind: "read" },
  draftEmail: { label: "Redacta un mensaje", kind: "draft" },
  proposeCreateBudget: { label: "Propone crear un presupuesto", kind: "proposal" },
  proposeUpdateBudget: { label: "Propone guardar cambios", kind: "proposal" },
  proposeDuplicateBudget: { label: "Propone duplicar un presupuesto", kind: "proposal" },
  proposePublishOfficialBudget: { label: "Propone publicar como oficial", kind: "proposal" },
} as const satisfies Record<string, { label: string; kind: AgentToolKind }>;

export type AgentToolName = keyof typeof AGENT_TOOL_CATALOG;

export const AGENT_TOOL_NAMES = Object.keys(AGENT_TOOL_CATALOG) as AgentToolName[];

export const isAgentToolName = (value: string): value is AgentToolName =>
  Object.hasOwn(AGENT_TOOL_CATALOG, value);
