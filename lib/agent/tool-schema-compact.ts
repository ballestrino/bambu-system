import { asSchema, jsonSchema, type JSONSchema7, type Tool } from "ai";

// Las definiciones de las tools van en cada paso y eran unos 28k de los 34k
// tokens del prefijo: el JSON que genera zod repite mucho. Acá se compacta
// sin cambiar lo que se acepta, y la validación sigue siendo la de zod:
// - sin `$schema` en cada tool;
// - sin los topes de `Number.MAX_SAFE_INTEGER` que zod pone a los enteros;
// - `anyOf [X, null]` pasa a `type: [X, "null"]` (y el null se suma al enum).
// Puro: lo prueba check:agent-tools.
type Node = Record<string, unknown>;

const isNode = (value: unknown): value is Node => typeof value === "object" && value !== null && !Array.isArray(value);

const mergeNullable = (node: Node): Node | null => {
  const options = node.anyOf;
  if (!Array.isArray(options) || options.length !== 2) return null;
  const nullIndex = options.findIndex((option) => isNode(option) && option.type === "null" && Object.keys(option).length === 1);
  const other = options[1 - nullIndex];
  if (nullIndex < 0 || !isNode(other) || typeof other.type !== "string" || "anyOf" in other) return null;
  const { anyOf: _anyOf, ...rest } = node;
  void _anyOf;
  return {
    ...other,
    ...rest,
    type: [other.type, "null"],
    ...(Array.isArray(other.enum) ? { enum: [...other.enum, null] } : {}),
  };
};

export const compactJsonSchema = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(compactJsonSchema);
  if (!isNode(value)) return value;
  const node = mergeNullable(value) ?? value;
  const result: Node = {};
  for (const [key, child] of Object.entries(node)) {
    if (key === "$schema") continue;
    if (key === "maximum" && child === Number.MAX_SAFE_INTEGER) continue;
    if (key === "minimum" && child === Number.MIN_SAFE_INTEGER) continue;
    result[key] = compactJsonSchema(child);
  }
  return result;
};

export const compactToolSchemas = <T extends Record<string, Tool>>(tools: T): T =>
  Object.fromEntries(
    Object.entries(tools).map(([name, tool]) => {
      if (!tool.inputSchema) return [name, tool];
      const original = asSchema(tool.inputSchema);
      const inputSchema = jsonSchema(
        async () => compactJsonSchema(await original.jsonSchema) as JSONSchema7,
        original.validate ? { validate: original.validate } : undefined
      );
      return [name, { ...tool, inputSchema }];
    })
  ) as T;
