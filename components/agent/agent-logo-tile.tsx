import Image from "next/image";

import { cn } from "@/lib/utils";

// El logo de Bambú sobre un cuadro verde claro: el avatar de las respuestas
// (sm) y el estado vacío (lg).
export function AgentLogoTile({ size, className }: { size: "sm" | "lg"; className?: string }) {
  const large = size === "lg";
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center bg-ops-bamboo-soft",
        large ? "size-12 rounded-[14px]" : "size-7 rounded-lg",
        className
      )}
      aria-hidden
    >
      <Image
        src="/images/logo.png"
        alt=""
        width={329}
        height={391}
        className={large ? "h-[26px] w-auto" : "h-[15px] w-auto"}
      />
    </span>
  );
}
