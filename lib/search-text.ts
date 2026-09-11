// "guarani" tiene que encontrar "Guaraní": saca acentos y mayúsculas para que
// el buscador no dependa de como se escribio el nombre. Sin "server-only": lo
// usan tanto los selects y tablas del cliente como las queries de data/.
export const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-UY")
    .trim();

// Normaliza la query una sola vez y devuelve el predicado, para filtrar listas
// sin repetir el trabajo en cada fila. Una query vacía matchea todo.
export const createSearchMatcher = (query: string) => {
  const needle = normalizeSearchText(query);

  return (fields: (string | null | undefined)[]) =>
    !needle ||
    fields.some((field) => field && normalizeSearchText(field).includes(needle));
};

export const matchesSearchText = (
  query: string,
  fields: (string | null | undefined)[]
) => createSearchMatcher(query)(fields);
