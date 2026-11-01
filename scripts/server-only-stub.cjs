// Para los smokes por tsx: "server-only" lo resuelve Next al compilar y no
// está instalado como paquete. Con --require este archivo ocupa su lugar
// (no hace nada), así un script puede importar módulos marcados server-only.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- --require carga CommonJS
const Module = require("node:module");

const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === "server-only") return __filename;
  return resolve.call(this, request, ...rest);
};
