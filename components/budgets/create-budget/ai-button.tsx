"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIButtonProps extends React.ComponentProps<typeof Button> {
    onGenerate?: () => void;
}

export const AIButton = ({ className, onGenerate, ...props }: AIButtonProps) => {
    return (
        <Button
            onClick={onGenerate}
            className={cn(
                "relative overflow-hidden bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 border-none",
                className
            )}
            {...props}
        >
            <span className="relative z-10 flex items-center gap-2 font-semibold">
                Generar con IA
                <Sparkles className="h-4 w-4 animate-pulse text-yellow-200" />
            </span>
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-size-[250%_250%] animate-shimmer" />
        </Button>
    );
};
