"use client";

import type { ComponentProps, ReactNode } from "react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Piezas del creador de presupuestos con el lenguaje de Operaciones
// (Visitas, Empleados, Trabajos): controles de 44 px, bordes y fondos ops.
export const creatorInputClass =
  "h-11 w-full min-w-0 rounded-[10px] border border-ops-border bg-ops-surface px-3 text-[15px] text-ops-text tabular-nums outline-none placeholder:text-ops-text-muted/70 focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 aria-invalid:border-red-400";

export const creatorOutlineButtonClass =
  "inline-flex h-11 items-center justify-center gap-[7px] whitespace-nowrap rounded-[10px] border border-ops-border bg-ops-surface px-4 text-[13.5px] font-semibold text-ops-text hover:bg-ops-surface-muted disabled:opacity-60";

export const creatorPrimaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-[7px] whitespace-nowrap rounded-[10px] bg-ops-bamboo-strong px-[18px] text-[13.5px] font-semibold text-white hover:bg-ops-bamboo-strong/90 disabled:opacity-60 dark:text-ops-canvas";

type CreatorFieldProps = {
  children: ReactNode;
  className?: string;
  error?: string;
  hint?: ReactNode;
  htmlFor?: string;
  label: ReactNode;
};

export const CreatorField = ({ children, className, error, hint, htmlFor, label }: CreatorFieldProps) => (
  <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
    {htmlFor ? (
      <label className="text-[13px] font-semibold text-ops-text" htmlFor={htmlFor}>
        {label}
      </label>
    ) : (
      <span className="text-[13px] font-semibold text-ops-text">{label}</span>
    )}
    {children}
    {error ? (
      <p className="text-[12.5px] text-red-700 dark:text-red-300">{error}</p>
    ) : hint ? (
      <p className="text-[12.5px] text-ops-text-muted">{hint}</p>
    ) : null}
  </div>
);

type CreatorAffixInputProps = Omit<ComponentProps<"input">, "prefix"> & {
  prefix?: ReactNode;
  suffix?: ReactNode;
  wrapperClassName?: string;
};

export const CreatorAffixInput = ({ className, prefix, suffix, wrapperClassName, ...props }: CreatorAffixInputProps) => (
  <div
    className={cn(
      "flex h-11 min-w-0 items-center gap-1.5 rounded-[10px] border border-ops-border bg-ops-surface px-3 focus-within:ring-2 focus-within:ring-ops-bamboo/40 has-[input[aria-invalid=true]]:border-red-400 has-[input:disabled]:opacity-60",
      wrapperClassName
    )}
  >
    {prefix ? <span className="text-ops-text-muted">{prefix}</span> : null}
    <input
      className={cn("min-w-0 flex-1 bg-transparent text-[15px] text-ops-text tabular-nums outline-none", className)}
      {...props}
    />
    {suffix ? <span className="whitespace-nowrap text-[13px] text-ops-text-muted">{suffix}</span> : null}
  </div>
);

type SegmentedOption<T extends string> = { label: string; value: T };

type CreatorSegmentedProps<T extends string> = {
  className?: string;
  label: string;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  value: T;
};

export const CreatorSegmented = <T extends string>({ className, label, onChange, options, value }: CreatorSegmentedProps<T>) => (
  <div aria-label={label} className={cn("flex w-fit max-w-full rounded-[11px] bg-ops-surface-muted p-[3px]", className)} role="radiogroup">
    {options.map((option) => {
      const active = option.value === value;

      return (
        <button
          aria-checked={active}
          className={cn(
            "h-[38px] flex-1 whitespace-nowrap rounded-lg px-3.5 text-[13px] font-semibold transition-colors",
            active
              ? "bg-ops-surface text-ops-bamboo-strong shadow-[0_1px_3px_rgb(24_37_29/0.14)]"
              : "text-ops-text/75 hover:text-ops-text"
          )}
          key={option.value}
          onClick={() => onChange(option.value)}
          role="radio"
          type="button"
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

export const CreatorSwitch = ({ className, ...props }: ComponentProps<typeof Switch>) => (
  <Switch className={cn("data-[state=checked]:bg-ops-bamboo-strong", className)} {...props} />
);
