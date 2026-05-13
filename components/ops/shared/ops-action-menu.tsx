"use client";

import type { ComponentType } from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type OpsActionMenuItem = {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onSelect: () => void | Promise<void>;
  disabled?: boolean;
  variant?: "default" | "destructive";
  separated?: boolean;
};

type OpsActionMenuProps = {
  items: OpsActionMenuItem[];
  label?: string;
};

export const OpsActionMenu = ({
  items,
  label = "Abrir acciones",
}: OpsActionMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label={label}>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="min-w-44">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.label}>
            {item.separated ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              disabled={item.disabled}
              variant={item.variant}
              onSelect={(event) => {
                event.preventDefault();
                void item.onSelect();
              }}
            >
              {Icon ? <Icon className="h-4 w-4" /> : null}
              {item.label}
            </DropdownMenuItem>
          </div>
        );
      })}
    </DropdownMenuContent>
  </DropdownMenu>
);
