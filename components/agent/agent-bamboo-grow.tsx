import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

// Tres cañas que crecen tramo por tramo, les salen las hojas y se desvanecen
// para volver a empezar. `s` es en qué momento de la vuelta (0 a 1) arranca
// cada pieza; el movimiento está en app/agent-thinking.css.
const SEGMENTS = [
  { x: 7.5, y: 18.5, w: 3, h: 5.5, s: 0 },
  { x: 12.4, y: 18, w: 3.2, h: 6, s: 0.04 },
  { x: 17.8, y: 19, w: 3, h: 5, s: 0.08 },
  { x: 7.5, y: 12.5, w: 3, h: 5.5, s: 0.12 },
  { x: 12.4, y: 11.5, w: 3.2, h: 6, s: 0.16 },
  { x: 17.8, y: 14, w: 3, h: 4.5, s: 0.2 },
  { x: 7.5, y: 7.5, w: 3, h: 4.5, s: 0.24 },
  { x: 12.4, y: 4, w: 3.2, h: 7, s: 0.28 },
  { x: 17.8, y: 9.5, w: 3, h: 4, s: 0.32 },
];

// Cada hoja nace pegada a un nudo: el origen es la punta que toca la caña.
const LEAVES = [
  { d: "M15.6 11 q3.5 -3.5 7 -2.5 q-3.5 2.5 -7 2.5z", origin: "0% 100%", s: 0.42 },
  { d: "M7.5 12.2 q-3 -3 -6 -2 q3 2.2 6 2z", origin: "100% 100%", s: 0.48 },
  { d: "M20.8 14 q2.5 -2.8 5.5 -2.2 q-2.8 2.2 -5.5 2.2z", origin: "0% 100%", s: 0.54 },
  { d: "M12.4 5 q-2.5 -2.5 -5 -1.5 q2.5 1.8 5 1.5z", origin: "100% 100%", s: 0.58 },
];

const start = (s: number, origin?: string) => ({ "--s": s, transformOrigin: origin }) as CSSProperties;

// Sin fondo: solo el bambú, del tamaño del logo de las respuestas.
export function AgentBambooGrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={cn("agent-bamboo size-7 shrink-0", className)} aria-hidden>
      <g className="agent-bamboo-fade">
        {SEGMENTS.map((segment) => (
          <rect
            key={`${segment.x}-${segment.y}`}
            className="agent-bamboo-grow fill-ops-bamboo"
            x={segment.x}
            y={segment.y}
            width={segment.w}
            height={segment.h}
            rx={1}
            style={start(segment.s)}
          />
        ))}
        {LEAVES.map((leaf) => (
          <path
            key={leaf.d}
            className="agent-bamboo-leaf fill-ops-bamboo-strong/70"
            d={leaf.d}
            style={start(leaf.s, leaf.origin)}
          />
        ))}
      </g>
    </svg>
  );
}
