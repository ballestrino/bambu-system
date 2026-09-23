// El slug de un presupuesto a partir de su nombre. Una sola regla para crear,
// duplicar y para las propuestas del agente, que verifican el slug antes de
// que la acción lo use. Sin la bandera u, \w es ASCII: "Ó" se descarta.
export const slugifyBudgetName = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
