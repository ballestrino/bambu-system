import type { WebFormKindValue } from "@/lib/web-forms/reply-text";

// Ordenar el buzón de contacto@ (feature 75): los avisos que manda la web
// ("Petición de servicio Web", "Trabaja con nosotros") salen de la Bandeja de
// entrada a la carpeta de su tipo. El tipo es el del formulario en el sistema
// (Detectar currículums lo puede haber cambiado). Puro: lo usan el
// movimiento (sort-mail.ts) y el check.
export const WEB_FORM_MAIL_FOLDERS: Record<WebFormKindValue, string> = {
  CONTACT: "Solicitudes de presupuesto",
  JOB_APPLICATION: "Trabaja con nosotros",
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

// La carpeta por su nombre, sin importar mayúsculas, tildes ni el prefijo
// ("INBOX.Trabaja con nosotros" en Hostinger).
export const findFolderPath = (boxes: { path: string; name: string }[], folder: string) => {
  const target = normalize(folder);
  return boxes.find((box) => normalize(box.name) === target)?.path ?? null;
};

// El tipo que dice el asunto del aviso; null si no es un aviso de la web.
export const noticeKindFromSubject = (subject: string): WebFormKindValue | null => {
  const value = normalize(subject);
  if (value === "peticion de servicio web") return "CONTACT";
  if (value === "trabaja con nosotros") return "JOB_APPLICATION";
  return null;
};

export type MailNotice = { uid: number; subject: string; replyTo: string | null; date: Date | null };
export type KnownSubmission = { email: string; createdAt: Date; kind: WebFormKindValue };

// El aviso sale a la vez que el formulario: misma persona y menos de 2 días.
const MATCH_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

const matchSubmission = (notice: MailNotice, submissions: KnownSubmission[]) => {
  if (!notice.replyTo || !notice.date) return null;
  const email = notice.replyTo.toLowerCase();
  const time = notice.date.getTime();
  let best: KnownSubmission | null = null;
  for (const submission of submissions) {
    if (submission.email.toLowerCase() !== email) continue;
    const distance = Math.abs(submission.createdAt.getTime() - time);
    if (distance > MATCH_WINDOW_MS) continue;
    if (!best || distance < Math.abs(best.createdAt.getTime() - time)) best = submission;
  }
  return best;
};

// Qué avisos van a la carpeta de `kind`. Un pedido de servicio sin formulario
// en el sistema queda donde está (podría ser un currículum): se cuenta aparte.
export const planMailSort = (notices: MailNotice[], submissions: KnownSubmission[], kind: WebFormKindValue) => {
  const uids: number[] = [];
  let unmatched = 0;
  for (const notice of notices) {
    const subjectKind = noticeKindFromSubject(notice.subject);
    if (!subjectKind) continue;
    const resolved = matchSubmission(notice, submissions)?.kind ?? (subjectKind === "JOB_APPLICATION" ? subjectKind : null);
    if (!resolved) unmatched += 1;
    else if (resolved === kind) uids.push(notice.uid);
  }
  return { uids, unmatched };
};
