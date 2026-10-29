// Cuándo un turno sigue solo: el tramo terminó sin terminar la tarea. Puro,
// con prueba (check:agent-tools).
//
// - "steps": llegó al tope de pasos con una tool como último paso (pasaba al
//   preparar 8 propuestas: el turno cerraba sin una palabra).
// - "length": la respuesta se cortó por el tope de tokens de salida.
// - "empty": el modelo cerró sin texto (a veces solo razonaba y paraba).
//
// Tope de 3 por turno, por si el modelo entra en un bucle.
export const MAX_AUTO_CONTINUES = 3;

export type ContinueReason = "steps" | "length" | "empty";

type SegmentStep = { finishReason: string; text: string };

export const getContinueReason = (steps: SegmentStep[], maxSteps: number): ContinueReason | null => {
  const last = steps.at(-1);
  if (!last) return null;
  if (last.finishReason === "length") return "length";
  if (last.finishReason === "tool-calls" && steps.length >= maxSteps) return "steps";
  if (last.finishReason === "stop" && !last.text.trim()) return "empty";
  return null;
};

// El mensaje que recibe el modelo antes del tramo siguiente. No se guarda en
// la conversación: el usuario ve una sola respuesta.
export const CONTINUE_PROMPTS: Record<ContinueReason, string> = {
  steps:
    "(Aviso del sistema: se terminaron los pasos de este tramo.) Seguí con la tarea desde donde quedaste, sin repetir lo que ya hiciste. Cuando termines, respondé al usuario con el resumen.",
  length:
    "(Aviso del sistema: tu respuesta se cortó por largo.) Seguí exactamente desde donde se cortó, sin repetir lo anterior.",
  empty:
    "(Aviso del sistema: terminaste sin responder.) Si falta algo de la tarea, hacelo; si no, respondé al usuario con lo que encontraste.",
};

// "Siguió sola 2 veces", para la línea de uso de la respuesta.
export const formatAutoContinues = (count: number | undefined) =>
  count ? `siguió sola ${count === 1 ? "1 vez" : `${count} veces`}` : null;
