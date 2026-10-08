"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { transcribeRecording } from "@/components/agent/agent-uploads";
import {
  AGENT_AUDIO_MAX_BYTES,
  AGENT_MAX_RECORDING_SECONDS,
  AUDIO_TOO_LARGE_MESSAGE,
  RECORDING_BITS_PER_SECOND,
  RECORDING_MIME_TYPES,
} from "@/lib/agent/attachment-rules";
import type { AgentMode } from "@/lib/ai/modes";

export type VoiceStatus = "idle" | "starting" | "recording" | "transcribing";

// Menos que esto es un toque sin querer: no se manda a transcribir.
const MIN_RECORDING_SECONDS = 0.7;

const pickMimeType = () => RECORDING_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));

const microphoneError = (error: unknown) => {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError") return "Permití el micrófono para dictar.";
  if (name === "NotFoundError") return "No se encontró un micrófono.";
  return "No se pudo usar el micrófono.";
};

// Graba una nota de voz (hasta 2 minutos), la transcribe con gpt-transcribe
// y entrega el texto: el usuario lo revisa en el composer antes de enviar.
export const useVoiceRecorder = (input: {
  getRequest: () => { mode: AgentMode; conversationId: string };
  onText: (text: string) => void;
}) => {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const cancelled = useRef(false);
  const unmounted = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef(input);
  useEffect(() => {
    latest.current = input;
  });

  const transcribe = async (audio: Blob, seconds: number) => {
    if (seconds < MIN_RECORDING_SECONDS) return setStatus("idle");
    if (audio.size > AGENT_AUDIO_MAX_BYTES) {
      toast.error(AUDIO_TOO_LARGE_MESSAGE);
      return setStatus("idle");
    }
    setStatus("transcribing");
    try {
      const text = await transcribeRecording({ audio, durationSeconds: seconds, ...latest.current.getRequest() });
      latest.current.onText(text);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo transcribir el audio.");
    } finally {
      setStatus("idle");
    }
  };

  const start = async () => {
    if (status !== "idle") return;
    // Sin https (por ejemplo, la PC por IP en la red local) no hay micrófono.
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Este navegador no permite grabar audio acá (hace falta https).");
      return;
    }
    setStatus("starting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      toast.error(microphoneError(error));
      return setStatus("idle");
    }
    // Se cerró mientras pedía permiso: se suelta el micrófono.
    if (unmounted.current) return stream.getTracks().forEach((track) => track.stop());
    const mimeType = pickMimeType();
    const media = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      audioBitsPerSecond: RECORDING_BITS_PER_SECOND,
    });
    const chunks: Blob[] = [];
    const startedAt = performance.now();
    cancelled.current = false;
    media.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    media.onstop = () => {
      window.clearInterval(timer.current);
      stream.getTracks().forEach((track) => track.stop());
      recorder.current = null;
      if (cancelled.current) return setStatus("idle");
      const seconds = (performance.now() - startedAt) / 1000;
      void transcribe(new Blob(chunks, { type: media.mimeType || mimeType || "audio/webm" }), seconds);
    };
    recorder.current = media;
    media.start();
    setElapsed(0);
    setStatus("recording");
    // A los 2 minutos se corta y se transcribe lo grabado.
    timer.current = window.setInterval(() => {
      const seconds = (performance.now() - startedAt) / 1000;
      setElapsed(Math.min(seconds, AGENT_MAX_RECORDING_SECONDS));
      if (seconds >= AGENT_MAX_RECORDING_SECONDS && media.state === "recording") media.stop();
    }, 250);
  };

  const stop = () => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  };

  const cancel = () => {
    cancelled.current = true;
    stop();
  };

  // Salir de la pantalla o cerrar el Sheet descarta la grabación y libera el
  // micrófono. (En desarrollo React monta dos veces: se vuelve a marcar.)
  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
      cancelled.current = true;
      if (recorder.current?.state === "recording") recorder.current.stop();
      window.clearInterval(timer.current);
    };
  }, []);

  return { status, elapsed, start, stop, cancel };
};
