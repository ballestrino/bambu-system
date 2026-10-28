// Clases compartidas de la tabla de Trabajos (diseño "Trabajos Bambu 1a").

export const jobsOutlineButtonClass =
  "h-10 min-h-10 gap-[7px] rounded-[10px] border-ops-border bg-ops-surface px-3.5 text-[13.5px] font-semibold text-ops-text shadow-none hover:bg-ops-surface-muted";

export const jobsPrimaryButtonClass =
  "h-10 min-h-10 gap-[7px] rounded-[10px] bg-ops-bamboo-strong px-4 text-[13.5px] font-semibold text-white shadow-none hover:bg-ops-bamboo-strong/90 dark:text-ops-canvas";

// Columnas: casilla, trabajo, tipo, presupuesto, opción, rentabilidad, estado
// y acciones. En un panel más angosto se caen tipo y presupuesto (van debajo
// del nombre) y en el celular la fila se apila.
export const jobsGridClass =
  "grid grid-cols-[44px_minmax(0,1fr)_auto] @3xl/jobs:grid-cols-[52px_minmax(0,2fr)_124px_156px_112px_76px] @5xl/jobs:grid-cols-[52px_minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1.3fr)_124px_156px_112px_76px]";

export const jobsPillClass =
  "inline-flex h-6 items-center gap-[5px] rounded-full border px-2 text-xs font-semibold whitespace-nowrap";
