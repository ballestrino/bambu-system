export const MAIL_TIME_ZONE = "America/Montevideo";

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: MAIL_TIME_ZONE,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const getLocalParts = (date: Date) => {
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map(({ type, value }) => [type, value])
  );
  return {
    weekday: parts.weekday,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
};
export const isMailSendWindowOpen = (date: Date) => {
  const { weekday, minutes } = getLocalParts(date);
  const weekend = weekday === "Sat" || weekday === "Sun";
  const start = weekend ? 10 * 60 : 7 * 60;
  const end = weekend ? 16 * 60 : 21 * 60;
  return minutes >= start && minutes < end;
};

export const getNextMailSendAt = (date: Date) => {
  if (isMailSendWindowOpen(date)) return date;
  const candidate = new Date(date);
  candidate.setUTCSeconds(0, 0);
  for (let step = 0; step < 2 * 24 * 60; step += 1) {
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
    if (isMailSendWindowOpen(candidate)) return candidate;
  }
  throw new Error("No se pudo calcular la próxima ventana de envío");
};
