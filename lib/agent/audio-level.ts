// Nivel de la voz para la onda del dictado. Puro: lo prueba el check.

// Debajo de este RMS es ruido de fondo: la barra queda como un punto.
export const NOISE_FLOOR = 0.012;

// Una ventana de muestras de 8 bits del AnalyserNode (128 = silencio) → 0..1.
// La raíz agranda las voces bajas, que si no casi no se ven; un grito llega
// a 1.
export const measureLevel = (samples: ArrayLike<number>) => {
  if (!samples.length) return 0;
  let sum = 0;
  for (let index = 0; index < samples.length; index++) {
    const value = (samples[index] - 128) / 128;
    sum += value * value;
  }
  const rms = Math.sqrt(sum / samples.length);
  return rms <= NOISE_FLOOR ? 0 : Math.min(1, Math.sqrt(rms - NOISE_FLOOR) * 2.2);
};

// La onda corre hacia la izquierda: el nivel nuevo entra por la derecha y el
// más viejo sale.
export const pushLevel = (levels: readonly number[], level: number) => [...levels.slice(1), level];
