"use client";

import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Optional free-text search a filter bar can host next to its selects.
export type OpsSearchControl = {
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
};

export const OpsSearchInput = ({
  "aria-label": ariaLabel,
  className,
  isSearching,
  placeholder,
  value,
  onChange,
  onSubmit,
}: {
  "aria-label"?: string;
  className?: string;
  isSearching?: boolean;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}) => {
  const trackRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const bar = barRef.current;

    if (!track || !bar) {
      return;
    }

    if (isSearching) {
      track.style.transitionDelay = "0ms";
      track.style.opacity = "1";
      const current = Number.parseFloat(bar.style.width) || 0;
      bar.style.width = `${current > 0 && current < 92 ? current : 12}%`;

      const intervalId = window.setInterval(() => {
        const value = Number.parseFloat(bar.style.width) || 0;
        bar.style.width = `${value >= 92 ? 92 : value + (92 - value) * 0.18 + 0.6}%`;
      }, 70);

      return () => window.clearInterval(intervalId);
    }

    if (!bar.style.width || bar.style.width === "0%") {
      return;
    }

    bar.style.width = "100%";
    track.style.transitionDelay = "200ms";
    track.style.opacity = "0";

    const timeoutId = window.setTimeout(() => {
      track.style.transitionDelay = "0ms";
      bar.style.width = "0%";
    }, 520);

    return () => window.clearTimeout(timeoutId);
  }, [isSearching]);

  return (
    <div
      className={cn(
        "group relative flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[var(--ops-radius-control)] border border-ops-border bg-ops-surface px-3 text-ops-text shadow-none transition-all focus-within:border-ops-bamboo focus-within:ring-2 focus-within:ring-ops-bamboo/20",
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-ops-bamboo transition-colors group-focus-within:text-ops-bamboo-strong" />
      <Input
        aria-label={ariaLabel ?? placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit?.();
          }
        }}
        placeholder={placeholder}
        className="h-full min-w-0 border-0 bg-transparent px-0 py-0 text-sm leading-none shadow-none outline-none placeholder:text-ops-text-muted focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      {value ? (
        <button
          type="button"
          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-ops-bamboo-soft hover:text-ops-bamboo-strong"
          onClick={() => onChange("")}
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Limpiar búsqueda</span>
        </button>
      ) : null}
      {isSearching === undefined ? null : (
        <span
          ref={trackRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] overflow-hidden rounded-b-[inherit] bg-ops-bamboo/15 opacity-0 transition-opacity duration-300"
        >
          <span
            ref={barRef}
            className="block h-full w-0 rounded-r-full bg-ops-bamboo transition-[width] duration-150 ease-out"
          />
        </span>
      )}
    </div>
  );
};
