import { format } from "date-fns";

import {
  OPTION_LABELS,
  visibleComparisonFields,
  type ComparisonFieldId,
} from "@/components/agent/cards/comparison-fields";
import type { ComparisonColumn, ComparisonPriceOption } from "@/lib/agent/budget-comparison";
import { FIELD_LABELS } from "@/lib/agent/proposal-summary";

// Lo que copia "Copiar" de la tabla comparativa (feature 71): Markdown con
// título, fecha, la tabla tal como se ve (los campos marcados y la opción de
// productos elegida) y de dónde sale cada escenario. Es para pegarlo en otra
// IA (Claude, por ejemplo) y pedirle un PDF, o en cualquier editor. Puro.

const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ").trim();

const describeBase = (column: ComparisonColumn) => {
  switch (column.base.source) {
    case "budget":
    case "context":
      return `presupuesto "${column.base.name}"`;
    case "form":
      return "formulario sin guardar";
    default:
      return "presupuesto nuevo";
  }
};

const describeChanges = (column: ComparisonColumn) => {
  const labels: Record<string, string> = FIELD_LABELS;
  const changed = column.changedFields.map((field) => (labels[field] ?? field).toLowerCase());
  return changed.length ? `, cambiando ${changed.join(", ")}` : "";
};

export const buildComparisonMarkdown = ({
  title,
  columns,
  fields,
  option,
  date = new Date(),
}: {
  title: string;
  columns: readonly ComparisonColumn[];
  fields: readonly ComparisonFieldId[];
  option: ComparisonPriceOption;
  date?: Date;
}) => {
  const visible = visibleComparisonFields(fields);
  const header = `| Campo | ${columns.map((column) => cell(column.label)).join(" | ")} |`;
  const divider = `| --- | ${columns.map(() => "---:").join(" | ")} |`;
  const rows = visible.map((field) => {
    const label = field.strong ? `**${field.label}**` : field.label;
    return `| ${label} | ${columns.map((column) => cell(field.value(column, option))).join(" | ")} |`;
  });
  const scenarios = columns.map((column) => {
    const noProducts = option === "with" && !column.withProducts ? " No lleva productos." : "";
    return `- **${cell(column.label)}**: ${describeBase(column)}${describeChanges(column)}.${noProducts}`;
  });

  return [
    `# ${title}`,
    "",
    `Fecha: ${format(date, "dd/MM/yyyy")} · Precios ${OPTION_LABELS[option].toLowerCase()} · Importes mensuales en pesos uruguayos.`,
    "",
    header,
    divider,
    ...rows,
    "",
    "## Escenarios",
    "",
    ...scenarios,
    "",
  ].join("\n");
};
