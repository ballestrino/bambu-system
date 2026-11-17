// Las iniciales del círculo de la cuenta: la primera letra de las dos primeras
// palabras del nombre ("Nacho Pérez" → "NP", "Nacho" → "N"); sin nombre, la
// del correo. Puro.
export const userInitials = (name?: string | null, email?: string | null) => {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => word[0]).join("");
  return (letters || email?.trim()[0] || "?").toUpperCase();
};

export const userRoleLabel = (role?: string | null) =>
  role === "ADMIN" ? "Administrador" : "Usuario";
