const dateTimeFormat = new Intl.DateTimeFormat("es-UY", {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateFormat = new Intl.DateTimeFormat("es-UY", {
  dateStyle: "medium",
});

const timeFormat = new Intl.DateTimeFormat("es-UY", {
  timeStyle: "short",
});

export const formatDate = (value: Date | string | null | undefined) => {
  if (!value) {
    return "-";
  }

  return dateFormat.format(new Date(value));
};

export const formatDateTime = (value: Date | string | null | undefined) => {
  if (!value) {
    return "-";
  }

  return dateTimeFormat.format(new Date(value));
};

export const formatTime = (value: Date | string | null | undefined) => {
  if (!value) {
    return "-";
  }

  return timeFormat.format(new Date(value));
};

export const toDateInputValue = (value: Date | string | null | undefined) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return date.toISOString().slice(0, 10);
};

export const toDateTimeLocalValue = (
  value: Date | string | null | undefined
) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const getMonthRange = (month: Date) => {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
};

export const getMonthKey = (month: Date) =>
  `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;

export const minutesToTimeInput = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const timeInputToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};
