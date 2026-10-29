import { BadgeCheck } from "lucide-react";

// Guardar un generador vinculado publica una versión nueva del oficial.
export const BudgetOfficialNotice = ({ currentVersion }: { currentVersion: number }) => (
  <div className="flex items-start gap-3 rounded-[var(--ops-radius-panel)] border border-amber-300 bg-amber-50 px-4 py-3.5 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
    <BadgeCheck className="mt-0.5 size-[18px] shrink-0" />
    <div className="flex flex-col gap-0.5 text-[13.5px]">
      <span className="font-semibold">Es un presupuesto oficial: al guardar se publica la versión {currentVersion + 1}.</span>
      <span>La versión {currentVersion} queda en el historial y los trabajos vinculados conservan su imagen.</span>
    </div>
  </div>
);
