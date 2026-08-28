export const opsBrand = {
  bamboo: "var(--ops-bamboo)",
  bambooDark: "var(--ops-bamboo-strong)",
  bambooSoft: "var(--ops-bamboo-soft)",
  ink: "var(--ops-text)",
  amber: "var(--ops-amber)",
} as const;

export const opsSurface = {
  shell: "bg-ops-canvas",
  panel:
    "rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface",
  panelSoft:
    "rounded-[var(--ops-radius-row)] border border-ops-border bg-ops-surface-muted",
  headerAccent: "border-b border-ops-border pb-4",
  toolbar: "rounded-[var(--ops-radius-row)] bg-ops-surface-muted p-3",
} as const;

export const opsToneClasses = {
  neutral:
    "border-ops-border bg-ops-surface text-ops-text-muted",
  active:
    "border-ops-bamboo/35 bg-ops-bamboo-soft text-ops-bamboo-strong",
  warning:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200",
  success:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200",
  danger:
    "border-red-300 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200",
  archived:
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200",
  money:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200",
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
