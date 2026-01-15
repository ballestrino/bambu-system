"use client";

import { useFormContext } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { BudgetFormValues } from "@/schemas/BudgetSchema";
import { BudgetSection } from "./BudgetSection";

interface BudgetContributionsSectionProps {
    isOpen: boolean;
    onToggle: () => void;
    values: BudgetFormValues;
}

export const BudgetContributionsSection = ({ isOpen, onToggle, values }: BudgetContributionsSectionProps) => {
    const { control } = useFormContext<BudgetFormValues>();

    return (
        <BudgetSection
            title="Contribuciones"
            isOpen={isOpen}
            onToggle={onToggle}
            summary={
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                    <div>
                        <span className="text-muted-foreground block text-xs">Aguinaldo y salario vacacional</span>
                        <span className="font-medium text-foreground">{values.incidence_enabled ? `${values.incidence_contribution}%` : 'No'}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block text-xs">Patronales</span>
                        <span className="font-medium text-foreground">{values.company_enabled ? `${values.company_contribution}%` : 'No'}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block text-xs">Personales</span>
                        <span className="font-medium text-foreground">{values.personal_enabled ? `${values.personal_contribution}%` : 'No'}</span>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                <FormField
                    control={control}
                    name="incidence_enabled"
                    render={({ field: enabledField }) => (
                        <Card className={cn("transition-colors", enabledField.value && "border-blue-500 bg-blue-50/10")}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-medium">Aguinaldo y salario vacacional</CardTitle>
                                <FormControl>
                                    <Switch
                                        checked={enabledField.value}
                                        onCheckedChange={enabledField.onChange}
                                    />
                                </FormControl>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={control}
                                    name="incidence_contribution"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Porcentaje (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} disabled={!enabledField.value} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    )}
                />
                <FormField
                    control={control}
                    name="company_enabled"
                    render={({ field: enabledField }) => (
                        <Card className={cn("transition-colors", enabledField.value && "border-blue-500 bg-blue-50/10")}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-medium">Patronales</CardTitle>
                                <FormControl>
                                    <Switch
                                        checked={enabledField.value}
                                        onCheckedChange={enabledField.onChange}
                                    />
                                </FormControl>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={control}
                                    name="company_contribution"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Porcentaje (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} disabled={!enabledField.value} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    )}
                />
                <FormField
                    control={control}
                    name="personal_enabled"
                    render={({ field: enabledField }) => (
                        <Card className={cn("transition-colors", enabledField.value && "border-blue-500 bg-blue-50/10")}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-medium">Personales</CardTitle>
                                <FormControl>
                                    <Switch
                                        checked={enabledField.value}
                                        onCheckedChange={enabledField.onChange}
                                    />
                                </FormControl>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={control}
                                    name="personal_contribution"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Porcentaje (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} disabled={!enabledField.value} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    )}
                />
            </div>
        </BudgetSection>
    );
};
