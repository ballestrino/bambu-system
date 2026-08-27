export const getLinkedBudgetDeletionError = (
  linkedOfficialBudgetId: string | null | undefined
) =>
  linkedOfficialBudgetId
    ? "Archiva el presupuesto oficial vinculado antes de eliminar el generador"
    : null;
