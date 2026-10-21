-- Aditiva: propuestas del agente para cambiar y eliminar (archivar) una
-- visita. No toca filas existentes.
ALTER TYPE "AgentProposalKind" ADD VALUE 'UPDATE_VISIT';
ALTER TYPE "AgentProposalKind" ADD VALUE 'ARCHIVE_VISIT';
