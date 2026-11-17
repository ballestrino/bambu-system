"use client";

import { useSyncExternalStore } from "react";
import { Check } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

type Preview = { canvas: string; side: string; line: string; card: string; border: string; text: string };

const LIGHT: Preview = { canvas: "#F5F7F3", side: "#FAFCF9", line: "#244C2D", card: "#FFFFFF", border: "#DCE4D9", text: "#18251D" };
const DARK: Preview = { canvas: "#121811", side: "#151C14", line: "#4C653F", card: "#1A211A", border: "#2E3A2C", text: "#F0F3E8" };

const THEMES = [
  { value: "light", label: "Claro", previews: [LIGHT] },
  { value: "dark", label: "Oscuro", previews: [DARK] },
  { value: "system", label: "Sistema", previews: [LIGHT, DARK] },
] as const;

const subscribeToNothing = () => () => undefined;

// Una miniatura del panel con esos colores: barra lateral y una tarjeta.
function ThemePreview({ preview }: { preview: Preview }) {
  return (
    <span className="flex flex-1" style={{ background: preview.canvas }}>
      <span
        className="flex w-[30%] flex-col gap-1.5 px-1.5 py-2"
        style={{ background: preview.side, borderRight: `1px solid ${preview.border}` }}
      >
        <span className="h-1.5 rounded-full" style={{ background: preview.line }} />
        <span className="h-1.5 w-4/5 rounded-full" style={{ background: preview.border }} />
        <span className="h-1.5 w-2/3 rounded-full" style={{ background: preview.border }} />
      </span>
      <span className="flex flex-1 flex-col gap-1.5 p-2.5">
        <span className="h-[7px] w-1/2 rounded-full opacity-80" style={{ background: preview.text }} />
        <span
          className="flex-1 rounded-[5px]"
          style={{ background: preview.card, border: `1px solid ${preview.border}` }}
        />
      </span>
    </span>
  );
}

export function SettingsGeneral() {
  const { theme, setTheme } = useTheme();
  // next-themes conoce el tema recién al montar: hasta entonces no se marca.
  const mounted = useSyncExternalStore(subscribeToNothing, () => true, () => false);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3.5">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Tema</h3>
          <p className="text-[13px] text-ops-text-muted">Cómo se ve Bambú en este dispositivo.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {THEMES.map((option) => {
            const selected = mounted && theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex min-w-0 flex-col gap-2 rounded-xl border-2 bg-ops-surface p-1.5 text-left sm:gap-2.5 sm:p-2.5 transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                  selected ? "border-ops-bamboo" : "border-ops-border hover:border-ops-bamboo/50"
                )}
              >
                <span className="flex h-16 overflow-hidden rounded-lg border border-ops-border sm:h-[84px]">
                  {option.previews.map((preview) => (
                    <ThemePreview key={preview.canvas} preview={preview} />
                  ))}
                </span>
                <span className="flex items-center justify-between text-[13px] font-medium">
                  {option.label}
                  {selected && <Check className="size-4 text-ops-bamboo" aria-hidden />}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="hidden items-center justify-between gap-4 border-t border-ops-border pt-5 md:flex">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Barra lateral</h3>
          <p className="text-[13px] text-ops-text-muted">
            Abrila o compactala con el botón de arriba o con el teclado.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <kbd className="rounded-md border border-ops-border bg-ops-surface-muted px-2 py-1 font-sans text-xs font-medium">Ctrl</kbd>
          <kbd className="rounded-md border border-ops-border bg-ops-surface-muted px-2 py-1 font-sans text-xs font-medium">B</kbd>
        </div>
      </section>
    </div>
  );
}
