// Un salto de línea simple del modelo es un salto de línea, no un espacio: en
// un correo o en una lista de precios cambia lo que se lee. Markdown lo
// junta con la línea anterior, así que se convierte en un salto duro (dos
// espacios al final), salvo dentro de los bloques de código. Puro: lo usan el
// Markdown del Sheet y el check.
export const withHardLineBreaks = (content: string) =>
  content
    .split(/(```[\s\S]*?```)/g)
    .map((chunk, index) => (index % 2 ? chunk : chunk.replace(/([^\n])\n(?=[^\n])/g, "$1  \n")))
    .join("");
