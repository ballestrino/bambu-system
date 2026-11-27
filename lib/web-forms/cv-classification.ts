import { z } from "zod";

// "Detectar currículums" (feature 75): Haiku lee los pedidos de servicio nuevos
// y marca los que en realidad son de alguien que busca trabajo (lo escriben en
// el formulario de servicio en vez de Trabajá con nosotros). Puro: el prompt,
// la salida y su validación; la llamada está en classify-cvs.ts.
export type CvCandidate = {
  id: string;
  name: string;
  service: string | null;
  location: string | null;
  message: string;
};

// Cada pedido va con una referencia corta (P1, P2…): el modelo no copia ids.
const refOf = (index: number) => `P${index + 1}`;

const MESSAGE_LIMIT = 1500;

export const cvClassificationOutputSchema = z.object({
  curriculums: z.array(z.object({ ref: z.string(), reason: z.string() })),
});

export type CvClassificationOutput = z.infer<typeof cvClassificationOutputSchema>;

export const CV_CLASSIFICATION_INSTRUCTIONS = [
  "Clasificás formularios de la web de Bambú Servicios Integrales, una empresa uruguaya de limpieza.",
  "Cada uno llegó por el formulario de pedido de servicio. Algunos son de personas que en realidad buscan trabajo: se postulan, ofrecen sus servicios como empleadas o limpiadoras, mandan su experiencia o preguntan si hay vacantes.",
  "Devolvé en curriculums solo los que son búsqueda de trabajo, con una razón de pocas palabras. Un cliente que pide limpieza, un presupuesto o pregunta precios NO es un currículum, aunque cuente detalles personales.",
  "Si no estás seguro, no lo incluyas.",
].join("\n");

export const buildCvClassificationPrompt = (candidates: CvCandidate[]) =>
  candidates
    .map((candidate, index) =>
      [
        `${refOf(index)}. ${candidate.name}`,
        candidate.service ? `Servicio elegido: ${candidate.service}` : null,
        candidate.location ? `Zona: ${candidate.location}` : null,
        `Mensaje: ${candidate.message.trim().slice(0, MESSAGE_LIMIT) || "(sin mensaje)"}`,
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n\n");

// Los ids de los marcados, sin repetidos ni referencias inventadas.
export const pickCvIds = (candidates: CvCandidate[], output: CvClassificationOutput | null | undefined) => {
  const byRef = new Map(candidates.map((candidate, index) => [refOf(index), candidate.id]));
  const ids = new Set<string>();
  for (const item of output?.curriculums ?? []) {
    const id = byRef.get(item.ref.trim().toUpperCase());
    if (id) ids.add(id);
  }
  return [...ids];
};
