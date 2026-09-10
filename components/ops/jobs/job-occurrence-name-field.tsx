"use client";

import { OpsFormField, opsFormControlClass } from "@/components/ops/shared";
import { Input } from "@/components/ui/input";

export const JobOccurrenceNameField = ({
  jobName,
  onChange,
  scheduleName,
  value,
}: {
  jobName?: string;
  onChange: (value: string) => void;
  scheduleName?: string | null;
  value: string;
}) => {
  const inherited = scheduleName?.trim() || jobName?.trim() || "";

  return (
    <OpsFormField
      description={
        inherited
          ? `Si lo dejás vacío, la empleada ve "${inherited}".`
          : "Nombre que ve la empleada en su cronograma, si difiere del interno."
      }
      label="Nombre en el cronograma"
    >
      <Input
        className={opsFormControlClass}
        onChange={(event) => onChange(event.target.value)}
        placeholder={inherited || "Igual que el trabajo"}
        value={value}
      />
    </OpsFormField>
  );
};
