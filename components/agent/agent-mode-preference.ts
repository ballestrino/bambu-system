import { useSyncExternalStore } from "react";

import { isAgentMode, type AgentMode } from "@/lib/ai/modes";

// El último modo que eligió quien usa este navegador: las conversaciones
// nuevas arrancan con él (si siempre usa Sonnet, le queda elegido). Solo es
// una comodidad: sin localStorage (navegación privada, bloqueado) se usa el
// modo por defecto del servidor, y una conversación guardada sigue con el suyo.
const STORAGE_KEY = "bambu.agent.mode";
const CHANGE_EVENT = "bambu-agent-mode";

const readPreferredMode = (): AgentMode | null => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isAgentMode(value) ? value : null;
  } catch {
    return null;
  }
};

export const savePreferredMode = (mode: AgentMode) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
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

// En el servidor no hay preferencia: el primer render coincide y después se
// lee la del navegador.
export const usePreferredMode = () => useSyncExternalStore(subscribe, readPreferredMode, () => null);
