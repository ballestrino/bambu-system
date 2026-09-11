"use client";

import type { ReactNode } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type OpsViewTab<Id extends string> = {
  count?: number;
  id: Id;
  label: string;
};

// Segmented switch between the views of one section. Built on Radix Tabs, so
// arrow keys, roving focus and the tab/tabpanel wiring come for free; the
// children are the matching `TabsContent` panels.
export const OpsViewTabs = <Id extends string>({
  children,
  label,
  onValueChange,
  value,
  views,
}: {
  children: ReactNode;
  label: string;
  onValueChange: (value: Id) => void;
  value: Id;
  views: readonly OpsViewTab<Id>[];
}) => (
  <Tabs
    className="gap-3"
    onValueChange={(next) => onValueChange(next as Id)}
    value={value}
  >
    <TabsList
      aria-label={label}
      className="flex h-auto w-full gap-1 rounded-[var(--ops-radius-row)] bg-ops-surface-muted p-1 sm:w-fit"
    >
      {views.map((view) => (
        <TabsTrigger
          className="h-auto min-h-11 flex-1 rounded-[var(--ops-radius-control)] px-3 text-ops-text-muted data-[state=inactive]:hover:text-ops-text data-[state=active]:bg-ops-surface data-[state=active]:text-ops-bamboo-strong data-[state=active]:shadow-none sm:flex-none dark:text-ops-text-muted dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-ops-surface dark:data-[state=active]:text-ops-bamboo-strong"
          key={view.id}
          value={view.id}
        >
          {view.label}
          {view.count === undefined ? null : (
            <span className="rounded-full bg-ops-bamboo-soft px-1.5 text-xs font-semibold tabular-nums text-ops-bamboo-strong">
              {view.count}
            </span>
          )}
        </TabsTrigger>
      ))}
    </TabsList>
    {children}
  </Tabs>
);
