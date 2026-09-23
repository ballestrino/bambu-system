// Forma de los ids de conversación y de mensaje que genera el AI SDK en el
// cliente. Sin dependencias: la usan el schema de la ruta y la dirección de la
// página (que importa el sidebar).
export const AGENT_CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export const isAgentClientId = (value: unknown): value is string =>
  typeof value === "string" && AGENT_CLIENT_ID_PATTERN.test(value);
