import { createHash } from "node:crypto";

const replyPrefix = /^\s*((re|fw|fwd|rv|enc)\s*:\s*)+/i;

export const normalizeEmailAddress = (value: string) =>
  value.trim().toLocaleLowerCase("en-US");

export const normalizeMailSubject = (value: string) =>
  value
    .replace(replyPrefix, "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("es-UY");

export const normalizeMailBody = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/^ +| +$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .toLocaleLowerCase("es-UY");

export const hashMailInput = (subject: string, body: string) =>
  createHash("sha256")
    .update(`${normalizeMailSubject(subject)}\n${normalizeMailBody(body)}`)
    .digest("hex");

export const buildThreadParticipants = (values: string[]) =>
  [...new Set(values.map(normalizeEmailAddress).filter(Boolean))].sort();
