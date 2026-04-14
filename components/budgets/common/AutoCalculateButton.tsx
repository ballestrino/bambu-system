"use client";

import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { MouseEvent } from "react";

interface AutoCalculateButtonProps {
    onAutoCalculate: () => void;
    title?: string;
}

export const AutoCalculateButton = ({ onAutoCalculate, title }: AutoCalculateButtonProps) => {
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onAutoCalculate();
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            title={title ?? "Calcular automáticamente"}
            className="gap-1"
        >
            <Wand2 className="h-4 w-4" />
            Auto
        </Button>
    );
};
