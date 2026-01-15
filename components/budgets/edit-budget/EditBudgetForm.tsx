"use client";

import { BudgetSlugSection } from "./BudgetSlugSection";
import { BudgetDetailsSection } from "./BudgetDetailsSection";
import { BudgetCostsSection } from "./BudgetCostsSection";
import { BudgetContributionsSection } from "./BudgetContributionsSection";
import { BudgetFormValues } from "@/schemas/BudgetSchema";

interface EditBudgetFormProps {
    slug: string;
    setSlug: (slug: string) => void;
    activeSection: string;
    toggleSection: (section: "details" | "costs" | "contributions" | "slug") => void;
    values: BudgetFormValues;
}

export const EditBudgetForm = ({
    slug,
    setSlug,
    activeSection,
    toggleSection,
    values
}: EditBudgetFormProps) => {

    return (
        <div className="space-y-6">

            <BudgetSlugSection
                isOpen={activeSection === "slug"}
                onToggle={() => toggleSection("slug")}
                slug={slug}
                onSlugChange={setSlug}
            />

            <BudgetDetailsSection
                isOpen={activeSection === "details"}
                onToggle={() => toggleSection("details")}
                values={values as BudgetFormValues}
            />

            <BudgetCostsSection
                isOpen={activeSection === "costs"}
                onToggle={() => toggleSection("costs")}
                values={values as BudgetFormValues}
            />

            <BudgetContributionsSection
                isOpen={activeSection === "contributions"}
                onToggle={() => toggleSection("contributions")}
                values={values as BudgetFormValues}
            />
        </div>
    );
};
