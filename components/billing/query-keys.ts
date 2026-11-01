export const billingQueryKeys = {
  root: ["billing"] as const,
  month: (periodKey: string) => ["billing", "month", periodKey] as const,
  sync: (periodKey: string) => ["billing", "sync", periodKey] as const,
  draftRowMutation: ["billing", "draft-row"] as const,
};
