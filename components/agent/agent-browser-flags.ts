import { useSyncExternalStore } from "react";

// Preferencias de sí o no de quien usa este navegador, como el modo
// (agent-mode-preference.ts): solo comodidades. Sin localStorage (navegación
// privada, bloqueado) vale el valor por defecto y no se recuerda.
// - foldProposals: "Plegar las propuestas" del "…" de la conversación. Las
//   pendientes arrancan en una línea con sus acciones; por defecto no (las
//   ve desplegadas quien nunca lo tocó, decisión del usuario en la 69).
// - conversationsHidden: la columna de conversaciones de la página, oculta
//   con el botón de la cabecera.
const FLAGS = {
  foldProposals: { key: "bambu.agent.foldProposals", fallback: false },
  conversationsHidden: { key: "bambu.agent.conversationsHidden", fallback: false },
} as const;

export type AgentBrowserFlag = keyof typeof FLAGS;

const CHANGE_EVENT = "bambu-agent-flag";

const readFlag = (flag: AgentBrowserFlag) => {
  try {
    const value = window.localStorage.getItem(FLAGS[flag].key);
    return value === null ? FLAGS[flag].fallback : value === "1";
  } catch {
    return FLAGS[flag].fallback;
  }
};

export const saveAgentFlag = (flag: AgentBrowserFlag, value: boolean) => {
  try {
    window.localStorage.setItem(FLAGS[flag].key, value ? "1" : "0");
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Sin almacenamiento no se recuerda: no es un error para quien usa la app.
  }
};

// Cambios en esta pestaña (el evento propio) y en otras (storage).
const subscribe = (onChange: () => void) => {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
};

// En el servidor vale el valor por defecto: el primer render coincide y
// después se lee el del navegador.
export const useAgentFlag = (flag: AgentBrowserFlag) =>
  useSyncExternalStore(
    subscribe,
    () => readFlag(flag),
    () => FLAGS[flag].fallback
  );
