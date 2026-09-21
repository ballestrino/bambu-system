import {
  agentFormContextValuesSchema,
  type AgentFormContextValues,
} from "@/schemas/agent";

// Los valores del formulario de crear que viajan como contexto del agente.
// Mientras se edita puede haber campos inválidos (empleadas vacía, un número
// a medio escribir): esos no viajan y el servidor usa el valor por defecto,
// en vez de rechazar todo el pedido con un 400. Puro: lo usan el Sheet y el
// check.
export const sanitizeFormContextValues = (values: Record<string, unknown>): AgentFormContextValues => {
  const shape = agentFormContextValuesSchema.shape;
  const clean: Record<string, unknown> = {};
  Object.entries(values).forEach(([key, value]) => {
    if (!Object.hasOwn(shape, key)) return;
    const parsed = shape[key as keyof typeof shape].safeParse(value);
    if (parsed.success && parsed.data !== undefined) clean[key] = parsed.data;
  });
  return clean as AgentFormContextValues;
};
