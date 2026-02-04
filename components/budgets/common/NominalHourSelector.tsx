"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Save, Trash2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";

interface NominalHourSelectorProps {
    value: number;
    onChange: (value: number) => void;
    label?: string;
    error?: string;
}

interface SavedOption {
    name: string;
    value: number;
}

const COOKIE_KEY = "nominal-hours-saved-options";
const MAX_SAVED = 5;

export const NominalHourSelector = ({
    value,
    onChange,
    label = "Precio Hora Nominal",
    error
}: NominalHourSelectorProps) => {
    const [savedOptions, setSavedOptions] = useState<SavedOption[]>([]);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [newOptionName, setNewOptionName] = useState("");

    useEffect(() => {
        // Load saved options from cookies on mount
        const loadOptions = () => {
            if (typeof document === "undefined") return;

            const match = document.cookie.match(new RegExp('(^| )' + COOKIE_KEY + '=([^;]+)'));
            if (match) {
                try {
                    const parsed = JSON.parse(decodeURIComponent(match[2]));
                    if (Array.isArray(parsed)) {
                        // Handle backward compatibility or new format
                        const normalized: SavedOption[] = parsed.map((item: any) => {
                            if (typeof item === 'number') {
                                return { name: `Opción ($${item})`, value: item };
                            }
                            return item;
                        });
                        setSavedOptions(normalized);
                    }
                } catch (e) {
                    console.error("Failed to parse saved nominal hours", e);
                }
            }
        };

        loadOptions();
    }, []);

    const saveToCookie = (options: SavedOption[]) => {
        const stringified = JSON.stringify(options);
        // Set cookie to expire in 1 year
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        document.cookie = `${COOKIE_KEY}=${encodeURIComponent(stringified)}; path=/; expires=${date.toUTCString()}`;
        setSavedOptions(options);
    };

    const handleSaveCurrent = () => {
        if (!value || value <= 0) return;
        if (!newOptionName.trim()) {
            toast.error("Debes ingresar un nombre");
            return;
        }

        // check if value already exists
        const exists = savedOptions.some(opt => opt.value === value);
        if (exists) {
            toast.info("Este valor ya está guardado. Si quieres cambiar el nombre, elimínalo primero.");
            return;
        }

        const newOption: SavedOption = { name: newOptionName, value };

        let newOptions = [newOption, ...savedOptions];
        if (newOptions.length > MAX_SAVED) {
            newOptions = newOptions.slice(0, MAX_SAVED);
        }

        saveToCookie(newOptions);
        toast.success("Valor guardado en preferencias");
        setIsPopoverOpen(false);
        setNewOptionName("");
    };

    const handleDeleteOption = (e: React.MouseEvent, valToDelete: number) => {
        e.stopPropagation();
        const newOptions = savedOptions.filter(opt => opt.value !== valToDelete);
        saveToCookie(newOptions);
        toast.success("Opción eliminada");
    };

    const handleSelectOption = (val: number) => {
        onChange(val);
    };

    return (
        <FormItem>
            <div className="flex items-center justify-between">
                <FormLabel>{label}</FormLabel>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-6 gap-1 text-xs px-2"
                            disabled={savedOptions.length === 0}
                        >
                            <span className="truncate max-w-[100px]">
                                {savedOptions.length > 0 ? "Valores guardados" : "Sin guardados"}
                            </span>
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                        {savedOptions.map((opt) => (
                            <DropdownMenuItem
                                key={opt.value}
                                onClick={() => handleSelectOption(opt.value)}
                                className="flex justify-between items-center group cursor-pointer"
                            >
                                <span className="truncate flex-1">{opt.name} (${opt.value})</span>
                                <div
                                    className="p-1 rounded-sm hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-2"
                                    onClick={(e) => handleDeleteOption(e, opt.value)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
                <FormControl>
                    <Input
                        type="number"
                        value={value || ""}
                        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    />
                </FormControl>

                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            title="Guardar como valor por defecto"
                            disabled={!value || value <= 0 || savedOptions.some(opt => opt.value === value)}
                        >
                            <Save className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Guardar valor actual</h4>
                                <p className="text-sm text-muted-foreground">
                                    Asigna un nombre para identificar este valor en el futuro.
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor="name">Nombre</Label>
                                    <Input
                                        id="name"
                                        value={newOptionName}
                                        onChange={(e) => setNewOptionName(e.target.value)}
                                        placeholder="Ej: Senior"
                                        className="col-span-2 h-8"
                                    />
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label>Valor</Label>
                                    <span className="col-span-2 text-sm font-medium">${value}</span>
                                </div>
                            </div>
                            <Button size="sm" onClick={handleSaveCurrent}>Guardar</Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            {error && <FormMessage>{error}</FormMessage>}
        </FormItem>
    );
};
