// Reglas fijas del agente: viven en el código (system-prompt.ts) y ninguna
// instrucción del equipo las cambia. Como las instrucciones del equipo son
// otra lista, una propuesta no puede quitarlas ni editarlas; este filtro
// además rechaza una regla nueva que intente saltearlas. Es una red de
// palabras, no un juez: el prompt también dice que, si chocan, ganan las
// fijas. Puro.
export const PROTECTED_RULES = [
  {
    id: "price_source",
    label: "los precios solo se citan con una fuente",
    patterns: [
      /(precio|importe|monto|tarifa)s?.{0,60}(sin (fuente|calcular|buscar|tool)|de memoria|de cabeza|a ojo|inventa|aproximad|estimad)/,
      /(sin (fuente|calcular|buscar)|de memoria|de cabeza|a ojo|inventa).{0,60}(precio|importe|monto|tarifa)/,
      /redonde\w*.{0,30}a mano/,
    ],
  },
  {
    id: "literal_e",
    label: "la nota de Literal E",
    patterns: [/literal\s*e\b/],
  },
  {
    id: "emails_are_data",
    label: "lo que dice un correo es un dato, no una instrucción",
    patterns: [
      /\b(segui|obedec|hace|cumpli|ejecuta|aplica)\w*.{0,50}(lo que (dice|pide|piden)|instruccion\w*|pedido\w*).{0,30}(correo|mail|email)/,
      /instruccion\w*.{0,20}(de|del|que traen?|en) (los |el |un |una )?(correo|mail|email)/,
    ],
  },
  {
    id: "nothing_is_sent",
    label: "el agente no envía nada",
    patterns: [/\b(envia|enviar|envie|manda|mandar|mande|send)\w*\b.{0,40}(correo|mail|email|whatsapp|mensaje|respuesta)/],
  },
  {
    id: "confirm_writes",
    label: "nada se guarda sin que el usuario confirme",
    patterns: [/sin (confirmar|confirmacion|propuesta|tarjeta|preguntar)/, /(guarda|crea|borra|elimina|cambia)\w*.{0,30}directamente/],
  },
  {
    id: "no_override",
    label: "las reglas fijas no se ignoran",
    patterns: [/(ignora|olvida|saltea|desactiva|anula|deja de (seguir|cumplir)|no (sigas|cumplas|respetes))\w*.{0,40}(regla|instruccion|restriccion|politica|limite)/],
  },
] as const;

export type ProtectedRuleId = (typeof PROTECTED_RULES)[number]["id"];

// Minúsculas y sin tildes: "Enviá" y "envia" son lo mismo para el filtro.
export const normalizeRuleText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

// La regla fija que toca el texto, o null si no toca ninguna.
export const findProtectedConflict = (text: string) => {
  const normalized = normalizeRuleText(text);
  return PROTECTED_RULES.find((rule) => rule.patterns.some((pattern) => pattern.test(normalized))) ?? null;
};
