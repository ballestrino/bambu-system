"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const options = [
    { icon: Monitor, label: "Tema del sistema", value: "system" },
    { icon: Sun, label: "Tema claro", value: "light" },
    { icon: Moon, label: "Tema oscuro", value: "dark" },
] as const;

const subscribeToNothing = () => () => undefined;

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    // next-themes solo conoce el tema tras montar: hasta entonces ninguno se
    // marca activo para no romper la hidratacion.
    const mounted = useSyncExternalStore(
        subscribeToNothing,
        () => true,
        () => false
    );

    return (
        <div
            aria-label="Tema"
            className="flex items-center gap-0.5 rounded-md border border-[#53985E]/20 bg-background p-0.5"
            role="group"
        >
            {options.map(({ icon: Icon, label, value }) => {
                const isActive = mounted && theme === value;

                return (
                    <Button
                        aria-label={label}
                        aria-pressed={isActive}
                        className={cn("h-7 w-7 rounded-sm", !isActive && "text-muted-foreground")}
                        key={value}
                        onClick={() => setTheme(value)}
                        size="icon"
                        title={label}
                        type="button"
                        variant={isActive ? "default" : "ghost"}
                    >
                        <Icon className="h-3.5 w-3.5" />
                    </Button>
                );
            })}
        </div>
    );
}
