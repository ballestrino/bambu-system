-- Aditiva: los modos de Claude (Haiku 5.5, Sonnet 5.5 y Opus 5.5 con su
-- esfuerzo). No toca filas existentes.
ALTER TYPE "AgentMode" ADD VALUE 'HAIKU_HIGH';
ALTER TYPE "AgentMode" ADD VALUE 'HAIKU_XHIGH';
ALTER TYPE "AgentMode" ADD VALUE 'SONNET_HIGH';
ALTER TYPE "AgentMode" ADD VALUE 'OPUS_MEDIUM';
