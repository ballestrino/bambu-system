import { createHash, timingSafeEqual } from "crypto";

// La web pública se identifica con WEB_FORMS_SECRET (el mismo valor en los dos
// proyectos de Vercel). Sin la variable, la ruta no acepta nada.
const MIN_SECRET_LENGTH = 32;

const digest = (value: string) => createHash("sha256").update(value).digest();

export const getWebFormsSecret = (env: Record<string, string | undefined> = process.env) => {
  const secret = env.WEB_FORMS_SECRET?.trim();
  return secret && secret.length >= MIN_SECRET_LENGTH ? secret : null;
};

// Compara los hashes para que el largo del valor recibido no cambie el tiempo.
export const isWebFormsRequestAuthorized = (authorization: string | null, secret: string | null) => {
  if (!secret || !authorization?.startsWith("Bearer ")) return false;
  return timingSafeEqual(digest(authorization.slice("Bearer ".length).trim()), digest(secret));
};
