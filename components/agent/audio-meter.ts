import { measureLevel } from "@/lib/agent/audio-level";

// Mide el volumen del micrófono para la onda del dictado (Web Audio). No
// toca lo que se graba: el AnalyserNode solo lee el stream.
export type AudioMeter = {
  connect: (stream: MediaStream) => void;
  read: () => number;
  close: () => void;
};

// Se crea en el toque del micrófono, antes de pedir permiso: Safari en iOS
// solo arranca un AudioContext desde un gesto del usuario. null si el
// navegador no tiene Web Audio: se graba igual, con la onda plana.
export const createAudioMeter = (): AudioMeter | null => {
  if (typeof AudioContext === "undefined") return null;
  const context = new AudioContext();
  const analyser = context.createAnalyser();
  analyser.fftSize = 2048;
  const samples = new Uint8Array(analyser.fftSize);
  return {
    connect: (stream) => {
      context.createMediaStreamSource(stream).connect(analyser);
      void context.resume();
    },
    read: () => {
      analyser.getByteTimeDomainData(samples);
      return measureLevel(samples);
    },
    close: () => {
      if (context.state !== "closed") void context.close().catch(() => undefined);
    },
  };
};
