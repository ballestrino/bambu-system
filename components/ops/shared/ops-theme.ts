export const opsBrand = {
  bamboo: "#53985E",
  bambooDark: "#244C2D",
  bambooSoft: "#EAF5EC",
  ink: "#18251D",
  amber: "#C58A2A",
  amberSoft: "#FFF4DA",
} as const;

export const opsSurface = {
  shell:
    "bg-[linear-gradient(180deg,#F7FBF7_0%,#FFFFFF_44%,#F2F7F1_100%)] dark:bg-[linear-gradient(180deg,#101811_0%,#111827_100%)]",
  panel:
    "rounded-md border border-[#53985E]/15 bg-background/95 shadow-sm shadow-[#244C2D]/5",
  panelSoft:
    "rounded-md border border-[#53985E]/15 bg-[#F7FBF7] shadow-sm shadow-[#244C2D]/5 dark:bg-[#132016]",
  headerAccent:
    "before:absolute before:left-0 before:top-1 before:h-10 before:w-1 before:rounded-full before:bg-[#53985E]",
  toolbar:
    "rounded-md bg-background/70 p-3 shadow-sm shadow-[#244C2D]/5",
} as const;

export const opsToneClasses = {
  neutral:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200",
  active:
    "border-[#53985E]/25 bg-[#EAF5EC] text-[#244C2D] dark:border-[#53985E]/40 dark:bg-[#53985E]/15 dark:text-[#A7D8AE]",
  warning:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200",
  success:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200",
  danger:
    "border-red-300 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200",
  archived:
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200",
  money:
    "border-[#C58A2A]/30 bg-[#FFF4DA] text-[#6F4B12] dark:border-[#C58A2A]/50 dark:bg-[#C58A2A]/15 dark:text-[#F5D28C]",
} as const;

export type OpsTone = keyof typeof opsToneClasses;

export type OpsStatusConfig = {
  label: string;
  tone: OpsTone;
  description?: string;
};

export const opsJobStatus = {
  DRAFT: { label: "Borrador", tone: "neutral" },
  ACTIVE: { label: "Activo", tone: "active" },
  PAUSED: { label: "Pausado", tone: "warning" },
  COMPLETED: { label: "Completado", tone: "success" },
  ARCHIVED: { label: "Archivado", tone: "archived" },
} satisfies Record<string, OpsStatusConfig>;

export const opsOccurrenceStatus = {
  SCHEDULED: { label: "Programada", tone: "active" },
  DONE: { label: "Realizada", tone: "success" },
  SKIPPED: { label: "Omitida", tone: "warning" },
  CANCELED: { label: "Cancelada", tone: "danger" },
} satisfies Record<string, OpsStatusConfig>;

export const opsPaymentStatus = {
  RECORDED: { label: "Registrado", tone: "money" },
  VOIDED: { label: "Anulado", tone: "archived" },
} satisfies Record<string, OpsStatusConfig>;

export const opsFrequencyLabels = {
  DAILY: "Diaria",
  WEEKLY: "Semanal",
  MONTHLY: "Mensual",
} as const;

export const getOpsStatusConfig = <T extends string>(
  map: Partial<Record<T, OpsStatusConfig>>,
  value: T
): OpsStatusConfig => map[value] ?? { label: value, tone: "neutral" };
