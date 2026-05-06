import "server-only";

export const hasOwnKey = <T extends object>(
  value: T,
  key: PropertyKey
): key is keyof T => Object.prototype.hasOwnProperty.call(value, key);

export const getPatchedValue = <T extends object, K extends keyof T>(
  patch: T,
  key: K,
  currentValue: T[K]
) => (hasOwnKey(patch, key) ? patch[key] : currentValue);

export const getPatchedDbValue = <T extends object, K extends keyof T>(
  patch: T,
  key: K
) => (hasOwnKey(patch, key) ? patch[key] : undefined);
