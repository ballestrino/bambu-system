"use client";

import { useState } from "react";
import { LoaderCircle, Save } from "lucide-react";

import { useOpsCostSettingsMutation } from "@/components/ops/hooks/useOpsCostSettingsMutation";
import { OpsSection, opsFormControlClass } from "@/components/ops/shared";
import type { OpsCostSettings } from "@/components/ops/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const BpsSettingsPanel = ({
  settings,
}: {
  settings?: OpsCostSettings;
}) => (
  <BpsSettingsForm
    key={String(settings?.updatedAt ?? "empty")}
    initialValue={Number(settings?.bpsEstimatePercent ?? 0)}
  />
);

const BpsSettingsForm = ({
  initialValue,
}: {
  initialValue: number;
}) => {
  const [value, setValue] = useState(String(initialValue));
  const { updateSettingsAsync, isUpdating } = useOpsCostSettingsMutation();

  const handleSave = async () => {
    await updateSettingsAsync({ bpsEstimatePercent: Number(value) || 0 });
  };

  return (
    <OpsSection
      title="BPS estimado"
      description="Se calcula sobre pagos reales a empleadas del periodo."
      actions={
        <Button size="sm" disabled={isUpdating} onClick={handleSave}>
          {isUpdating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </Button>
      }
    >
      <div className="max-w-xs">
        <Input
          className={opsFormControlClass}
          min="0"
          max="100"
          step="0.01"
          type="number"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
    </OpsSection>
  );
};
