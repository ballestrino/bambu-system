"use client";

import { Settings2 } from "lucide-react";

import { BpsSettingsPanel } from "@/components/ops/costs/bps-settings-panel";
import { CostCategoriesPanel } from "@/components/ops/costs/cost-categories-panel";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Configuration is deliberately secondary here: the one primary action on
// Costes is Registrar coste. Moving it out of the right rail also gives the
// list the full width of the section.
export const FinancialCostSettingsSheet = ({
  workspace,
}: {
  workspace: FinancialWorkspace;
}) => (
  <Sheet>
    <SheetTrigger asChild>
      <Button className={dashboardSecondaryActionClass} variant="outline">
        <Settings2 />
        Configuración
      </Button>
    </SheetTrigger>
    <SheetContent
      className="flex w-full flex-col gap-0 bg-background sm:max-w-xl"
      side="right"
    >
      <SheetHeader className="text-left">
        <SheetTitle>Configuración de costes</SheetTitle>
        <SheetDescription>
          Porcentaje de BPS estimado y categorías con las que se agrupan los
          egresos.
        </SheetDescription>
      </SheetHeader>
      <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto px-4 pb-4">
        <BpsSettingsPanel settings={workspace.settings} />
        <CostCategoriesPanel categories={workspace.categories} />
      </div>
    </SheetContent>
  </Sheet>
);
