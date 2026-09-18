// Qué ve el usuario cuando falla un turno. Los errores de configuración (una
// clave o una variable AI_* mal puesta) se muestran tal cual porque dicen qué
// arreglar y no tienen secretos; el resto queda en el log del servidor.
const CONFIG_ERROR_PATTERN = /^(Falta configurar |AI_[A-Z0-9_]+ )/;

export const toAgentErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : "";
  if (CONFIG_ERROR_PATTERN.test(message)) return message;
  if (error instanceof Error && error.name === "AbortError") return "Se detuvo la respuesta.";
  return "El asistente no pudo responder. Probá de nuevo en un momento.";
};
