import { createHash } from "node:crypto";

import OpenAI from "openai";

let openAiClient: OpenAI | undefined;

export const getMailOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Falta configurar OPENAI_API_KEY");
  openAiClient ??= new OpenAI({ apiKey });
  return openAiClient;
};

export const getMailSafetyIdentifier = (actorId: string) =>
  createHash("sha256").update(`bambu-mail:${actorId}`).digest("hex").slice(0, 64);
