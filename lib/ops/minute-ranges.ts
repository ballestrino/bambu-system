// Los tramos del cronograma se miden en minutos desde la medianoche local. La
// grilla, la disponibilidad y los huecos comparten esta aritmetica para que un
// cruce y un hueco se calculen con la misma regla.
export type MinuteRange = {
  endMinute: number;
  startMinute: number;
};

export const DAY_MINUTES = 24 * 60;

export const getRangeMinutes = (range: MinuteRange) =>
  Math.max(0, range.endMinute - range.startMinute);

export const rangesOverlap = (left: MinuteRange, right: MinuteRange) =>
  left.startMinute < right.endMinute && right.startMinute < left.endMinute;

export const containsRange = (ranges: MinuteRange[], range: MinuteRange) =>
  ranges.some(
    (current) =>
      current.startMinute <= range.startMinute && range.endMinute <= current.endMinute
  );

// Ordena, descarta los vacios y funde los que se tocan: sin esto dos reglas
// pegadas dejarian un hueco de cero minutos entre ellas.
export const normalizeRanges = (ranges: MinuteRange[]): MinuteRange[] => {
  const sorted = ranges
    .filter((range) => range.endMinute > range.startMinute)
    .sort((left, right) => left.startMinute - right.startMinute);

  return sorted.reduce<MinuteRange[]>((merged, range) => {
    const previous = merged[merged.length - 1];

    if (previous && range.startMinute <= previous.endMinute) {
      previous.endMinute = Math.max(previous.endMinute, range.endMinute);
      return merged;
    }

    merged.push({ ...range });
    return merged;
  }, []);
};

export const subtractRange = (ranges: MinuteRange[], block: MinuteRange) =>
  ranges.flatMap((range) => {
    if (!rangesOverlap(range, block)) {
      return [range];
    }

    const remainder: MinuteRange[] = [];

    if (range.startMinute < block.startMinute) {
      remainder.push({ endMinute: block.startMinute, startMinute: range.startMinute });
    }

    if (block.endMinute < range.endMinute) {
      remainder.push({ endMinute: range.endMinute, startMinute: block.endMinute });
    }

    return remainder;
  });

export const subtractRanges = (ranges: MinuteRange[], blocks: MinuteRange[]) =>
  blocks.reduce(subtractRange, normalizeRanges(ranges));

const pad = (value: number) => String(value).padStart(2, "0");

// Una visita nocturna puede terminar despues de las 24:00; la etiqueta vuelve
// al reloj de 24 horas en vez de mostrar 25:30.
export const formatMinuteOfDay = (minute: number) => {
  const normalized = ((Math.round(minute) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`;
};

export const formatMinuteRange = (range: MinuteRange) =>
  `${formatMinuteOfDay(range.startMinute)} - ${formatMinuteOfDay(range.endMinute)}`;

export const parseMinuteOfDay = (value: string) => {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, hour, minute] = match;
  const total = Number(hour) * 60 + Number(minute);
  return total > DAY_MINUTES || Number(minute) > 59 ? null : total;
};

export const formatDurationMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (!hours) {
    return `${rest} min`;
  }

  return rest ? `${hours} h ${rest} min` : `${hours} h`;
};
