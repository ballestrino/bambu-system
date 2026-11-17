"use client";

import { useSearchParams } from "next/navigation";

// El diálogo de Configuración vive en la URL (?config=<sección>): se abre
// desde cualquier lado (barra lateral, hoja "Más"), el botón atrás lo cierra
// y un enlace lo abre directo. pushState/replaceState no navegan: Next los
// sincroniza con useSearchParams sin volver a pedir la página.
export const SETTINGS_SECTIONS = ["general", "cuenta", "memoria", "instrucciones"] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

const PARAM = "config";
const OPENED_HERE = "settingsDialog";

const isSection = (value: string | null): value is SettingsSection =>
  SETTINGS_SECTIONS.includes(value as SettingsSection);

const urlWith = (section: SettingsSection | null) => {
  const url = new URL(window.location.href);
  if (section) url.searchParams.set(PARAM, section);
  else url.searchParams.delete(PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
};

export const settingsPath = (pathname: string, section: SettingsSection = "general") =>
  `${pathname}?${PARAM}=${section}`;

export const openSettings = (section: SettingsSection = "general") => {
  window.history.pushState({ [OPENED_HERE]: true }, "", urlWith(section));
};

const openedHere = () => Boolean(window.history.state?.[OPENED_HERE]);

// Nunca se pasa window.history.state entero: con las claves internas de Next
// (__NA) el reemplazo no se sincroniza y useSearchParams no se entera.
export const selectSettingsSection = (section: SettingsSection) => {
  window.history.replaceState(openedHere() ? { [OPENED_HERE]: true } : null, "", urlWith(section));
};

// Si el diálogo se abrió acá, volver atrás deja la historia como estaba; si
// se entró con el enlace, se saca el parámetro sin salir de la página.
export const closeSettings = () => {
  if (openedHere()) window.history.back();
  else window.history.replaceState(null, "", urlWith(null));
};

export const useSettingsSection = (): SettingsSection | null => {
  const value = useSearchParams().get(PARAM);
  return isSection(value) ? value : null;
};
