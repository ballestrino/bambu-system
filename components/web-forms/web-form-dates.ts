// Fechas de la pantalla de formularios, en hora de Montevideo.
const TIME_ZONE = "America/Montevideo";

const dayKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);

// En la lista: la hora si es de hoy, "ayer" o el día y el mes.
export const formatWebFormDate = (value: Date | string, now = new Date()) => {
  const date = new Date(value);
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const key = dayKey(date);
  if (key === today) {
    return new Intl.DateTimeFormat("es-UY", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" }).format(date);
  }
  if (key === yesterday) return "ayer";
  return new Intl.DateTimeFormat("es-UY", { timeZone: TIME_ZONE, day: "numeric", month: "short" }).format(date);
};

export const formatWebFormDateTime = (value: Date | string) =>
  new Intl.DateTimeFormat("es-UY", { timeZone: TIME_ZONE, dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
