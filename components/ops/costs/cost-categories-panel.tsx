"use client";

import { Badge } from "@/components/ui/badge";
import DeleteDialog from "@/components/ui/delete-dialog";
import { Button } from "@/components/ui/button";
import { CostCategoryDialog } from "@/components/ops/costs/cost-category-dialog";
import { useOperationalCostCategoryMutations } from "@/components/ops/hooks/useOperationalCostCategoryMutations";
import { OpsScrollContainer, OpsSection } from "@/components/ops/shared";
import type { OpsOperationalCostCategory } from "@/components/ops/types";

const kindLabels = {
  BPS: "BPS",
  GENERAL: "General",
  TRANSPORT: "Transporte",
} as const;

export const CostCategoriesPanel = ({
  categories,
  scrollable = false,
}: {
  categories: OpsOperationalCostCategory[];
  scrollable?: boolean;
}) => {
  const { archiveCategoryAsync } = useOperationalCostCategoryMutations();
  const categoryList = (
    <div className="grid gap-2">
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex flex-col gap-3 rounded-md border border-[#53985E]/15 bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <p className="font-medium">{category.name}</p>
              <Badge variant="outline">{kindLabels[category.kind]}</Badge>
            </div>
            {category.description ? (
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <CostCategoryDialog category={category} />
            <DeleteDialog
              title="Archivar categoria"
              description="La categoria se ocultara para nuevos costes, pero conserva el historial."
              deleteButtonText="Archivar"
              deleteButtonVariant="default"
              onConfirm={async () => {
                await archiveCategoryAsync(category.id);
              }}
              trigger={<Button size="sm" variant="outline">Archivar</Button>}
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <OpsSection
      title="Categorias"
      description="Agrupa costes reales sin mezclar con presupuestos."
      actions={<CostCategoryDialog />}
    >
      {scrollable ? <OpsScrollContainer>{categoryList}</OpsScrollContainer> : categoryList}
    </OpsSection>
  );
};
