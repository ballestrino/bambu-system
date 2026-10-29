"use client";

import { CreatorAffixInput, CreatorField } from "@/components/budgets/create-budget/creator-ui";

// La dirección del presupuesto: no es parte del formulario, la guarda la acción
// junto con los valores.
export const BudgetSlugField = ({ onChange, value }: { onChange: (value: string) => void; value: string }) => (
  <CreatorField hint="Cambiarla rompe los enlaces que ya compartiste." htmlFor="budget-slug" label="Dirección del presupuesto">
    <CreatorAffixInput
      autoCapitalize="none"
      id="budget-slug"
      onChange={(event) => onChange(event.target.value)}
      prefix={<span className="text-[13.5px]">/budget/</span>}
      spellCheck={false}
      value={value}
    />
  </CreatorField>
);
