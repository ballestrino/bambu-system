import { format } from "date-fns";
import { es } from "date-fns/locale";

// Los grupos del historial del agente, como en el diseño (2a y 2b): Fijados,
// Hoy, Ayer y Anteriores. Puro: recibe "ahora" (lo prueba check:agent-page).
// Las fechas llegan en ISO UTC (toISOString), que se ordenan como texto.
type GroupableConversation = {
  pinnedAt: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConversationGroupKey = "pinned" | "today" | "yesterday" | "older";

const GROUP_ORDER: ConversationGroupKey[] = ["pinned", "today", "yesterday", "older"];

export const CONVERSATION_GROUP_LABELS: Record<ConversationGroupKey, string> = {
  pinned: "Fijados",
  today: "Hoy",
  yesterday: "Ayer",
  older: "Anteriores",
};

// La última actividad: el último mensaje o, si todavía no hay, cuando se creó.
// Renombrar o fijar no la cambian (sí cambian updatedAt).
export const conversationActivity = (conversation: GroupableConversation) =>
  conversation.lastMessageAt ?? conversation.createdAt;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

// El día se cuenta en la zona del navegador: la de quien mira.
export const conversationDayGroup = (iso: string, now: Date): Exclude<ConversationGroupKey, "pinned"> => {
  const day = startOfDay(new Date(iso));
  const today = startOfDay(now);
  if (day >= today) return "today";
  const yesterday = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  return day >= yesterday ? "yesterday" : "older";
};

// Cada grupo con lo más reciente arriba; los vacíos no se muestran.
export const groupConversations = <T extends GroupableConversation>(items: T[], now: Date) => {
  const groups: Record<ConversationGroupKey, T[]> = { pinned: [], today: [], yesterday: [], older: [] };
  items.forEach((item) =>
    groups[item.pinnedAt ? "pinned" : conversationDayGroup(conversationActivity(item), now)].push(item)
  );
  return GROUP_ORDER.filter((key) => groups[key].length > 0).map((key) => ({
    key,
    label: CONVERSATION_GROUP_LABELS[key],
    items: groups[key].sort((a, b) => conversationActivity(b).localeCompare(conversationActivity(a))),
  }));
};

// "14:32" hoy y ayer (el grupo ya dice el día), "6 oct" este año y
// "6 oct 2025" antes.
export const formatConversationTime = (iso: string, now: Date) => {
  const date = new Date(iso);
  if (conversationDayGroup(iso, now) !== "older") return format(date, "HH:mm");
  return format(date, date.getFullYear() === now.getFullYear() ? "d MMM" : "d MMM yyyy", { locale: es });
};

// La que retoma el Sheet de un presupuesto: la última que se tocó, aunque la
// lista traiga primero las fijadas.
export const latestConversationId = (items: (GroupableConversation & { id: string })[]) =>
  items.reduce<(GroupableConversation & { id: string }) | null>(
    (latest, item) => (!latest || item.updatedAt > latest.updatedAt ? item : latest),
    null
  )?.id ?? null;
