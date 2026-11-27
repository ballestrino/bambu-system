import { useSyncExternalStore } from "react";

// Si la respuesta lleva "Saludos," antes de la firma: se recuerda lo último
// que eligió quien usa este navegador. Solo es una comodidad: sin
// localStorage (navegación privada, bloqueado) va con saludo.
const STORAGE_KEY = "bambu.web-forms.closing";
const CHANGE_EVENT = "bambu-web-forms-closing";

const readIncludeClosing = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
};

export const saveIncludeClosing = (value: boolean) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
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

// En el servidor va con saludo; después se lee la del navegador.
export const useIncludeClosing = () => useSyncExternalStore(subscribe, readIncludeClosing, () => true);
