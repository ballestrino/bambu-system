import type { OpsStatusConfig } from "@/components/ops/shared/ops-theme";

// Nombres y enlaces de los formularios web. Puro: lo usan la pantalla y el check.
export const WEB_FORM_KIND_LABELS = {
  CONTACT: "Pedido de servicio",
  JOB_APPLICATION: "Trabajá con nosotros",
} as const;

export const webFormStatus = {
  NEW: { label: "Nuevo", tone: "active" },
  REPLIED: { label: "Respondido", tone: "success" },
  ARCHIVED: { label: "Archivado", tone: "archived" },
} satisfies Record<string, OpsStatusConfig>;

// Teléfonos de Uruguay: 09X XXX XXX o 2XXX XXXX pasan a +598. Otro formato con
// prefijo internacional se deja como está.
export const toWhatsAppNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+")) return digits.length >= 8 ? digits : null;
  if (digits.startsWith("598") && digits.length >= 11) return digits;
  if (/^09\d{7}$/.test(digits)) return `598${digits.slice(1)}`;
  if (/^9\d{7}$/.test(digits)) return `598${digits}`;
  return null;
};

export const whatsAppUrl = (phone: string) => {
  const number = toWhatsAppNumber(phone);
  return number ? `https://wa.me/${number}` : null;
};

export const formatFileSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
