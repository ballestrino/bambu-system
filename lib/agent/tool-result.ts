// Forma estable de toda salida de tool: el modelo y la UI distinguen éxito y
// error sin leer excepciones, y todo es JSON plano (sin Decimal ni Date).
export type ToolError = { code: string; message: string };

export type ToolResult<T> = { ok: true; data: T } | { ok: false; error: ToolError };

export const toolOk = <T>(data: T): ToolResult<T> => ({ ok: true, data });

export const toolError = (code: string, message: string): ToolResult<never> => ({
  ok: false,
  error: { code, message },
});

export type PlainJson =
  | string
  | number
  | boolean
  | null
  | PlainJson[]
  | { [key: string]: PlainJson };

// Decimal de Prisma (decimal.js) sin importar @prisma/client: tiene toNumber
// y los campos internos s/e/d.
const isDecimalLike = (value: object): value is { toString(): string } =>
  "toNumber" in value && "d" in value && "e" in value && "s" in value;

export const toPlainJson = (value: unknown): PlainJson => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return Number(value);
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (Array.isArray(value)) return value.map(toPlainJson);
  if (typeof value === "object") {
    if (isDecimalLike(value)) return Number(value.toString());
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined && typeof item !== "function")
        .map(([key, item]) => [key, toPlainJson(item)])
    );
  }
  return null;
};

export const roundMoney = (value: number) => Math.round(value * 100) / 100;

// toModelOutput de las tools que devuelven campos solo para la UI (los valores
// completos de un presupuesto, para editarlo): el modelo ya tiene los insumos
// y esos campos solo le sumarían tokens. Un error pasa entero.
export const hideFromModel =
  (...keys: string[]) =>
  ({ output }: { output: unknown }) => {
    const result = output as ToolResult<Record<string, PlainJson>>;
    const value = result?.ok
      ? { ...result, data: Object.fromEntries(Object.entries(result.data).filter(([key]) => !keys.includes(key))) }
      : result;
    return { type: "json" as const, value: value as PlainJson };
  };

// La salida de una tool como JSON plano: aunque una lectura empiece a devolver
// Decimal o Date, lo que llega al modelo y se guarda es JSON.
export const toPlainResult = <T>(result: ToolResult<T>): ToolResult<T> =>
  result.ok ? { ok: true, data: toPlainJson(result.data) as T } : result;

// Toda tool corre dentro de esto: un error inesperado vuelve como resultado
// y el modelo puede explicarlo o reintentar, en vez de cortar el turno.
export const runTool = async <T>(
  toolName: string,
  execute: () => Promise<ToolResult<T>>
): Promise<ToolResult<T>> => {
  try {
    return toPlainResult(await execute());
  } catch (error) {
    console.error(`Agent tool ${toolName} failed:`, error);
    return toolError("internal_error", "No se pudo completar la consulta. Probá de nuevo.");
  }
};
