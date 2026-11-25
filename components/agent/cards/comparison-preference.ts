import { useSyncExternalStore } from "react";

import {
  DEFAULT_COMPARISON_FIELDS,
  isComparisonFieldId,
  type ComparisonFieldId,
} from "@/components/agent/cards/comparison-fields";
import type { ComparisonPriceOption } from "@/lib/agent/budget-comparison";

// Los campos y la opción de productos que eligió quien usa este navegador en
// la tabla comparativa (feature 71): todas las tablas arrancan así, también
// las de conversaciones viejas. Sin localStorage se usan los de por defecto.
const STORAGE_KEY = "bambu.agent.comparison";
const CHANGE_EVENT = "bambu-agent-comparison";

export type ComparisonPreference = {
  fields: ComparisonFieldId[];
  option: ComparisonPriceOption;
};

const DEFAULT_PREFERENCE: ComparisonPreference = {
  fields: [...DEFAULT_COMPARISON_FIELDS],
  option: "without",
};

const readRaw = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

// Lo guardado se lee sin confiar en su forma: un campo que ya no existe se
// descarta y una lista vacía vuelve a los de por defecto.
export const parseComparisonPreference = (raw: string | null): ComparisonPreference => {
  if (!raw) return DEFAULT_PREFERENCE;
  try {
    const value = JSON.parse(raw) as { fields?: unknown; option?: unknown };
    const fields = Array.isArray(value.fields) ? value.fields.filter(isComparisonFieldId) : [];
    return {
      fields: fields.length ? fields : DEFAULT_PREFERENCE.fields,
      option: value.option === "with" ? "with" : "without",
    };
  } catch {
    return DEFAULT_PREFERENCE;
  }
};

export const saveComparisonPreference = (preference: ComparisonPreference) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Sin almacenamiento no se recuerda: no es un error para quien usa la app.
  }
};

const subscribe = (onChange: () => void) => {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
};

// El texto crudo es la instantánea (estable entre renders); se interpreta
// afuera. En el servidor, los de por defecto.
export const useComparisonPreference = () =>
  parseComparisonPreference(useSyncExternalStore(subscribe, readRaw, () => null));
