import assert from "node:assert/strict";
import { inflateSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";

import { bambuLogoImage } from "../lib/pdf/bambu-logo-asset";
import { buildSimplePdf } from "../lib/pdf/simple-pdf";
import {
  buildEmployeeSchedulePdf,
  buildTeamSchedulePdf,
} from "../components/ops/schedules/schedule-pdf";
import { buildFixtureSchedule } from "./schedule-fixture";

const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

// Un offset desfasado produce un PDF que pasa cualquier assert de texto y aun
// asi no abre en un visor: esta es la guarda que lo detecta.
const assertXrefOffsets = (source: string, label: string) => {
  const xrefAt = source.lastIndexOf("\nxref\n") + 1;
  const rows = source.slice(xrefAt).split("\n");
  const total = Number(rows[1].split(" ")[1]);

  for (let id = 1; id < total; id += 1) {
    const match = rows[id + 2]?.match(/^(\d{10}) 00000 n $/);
    assert.ok(match, `${label}: entrada xref invalida para el objeto ${id}`);
    assert.ok(
      source.startsWith(`${id} 0 obj`, Number(match![1])),
      `${label}: el offset del objeto ${id} no apunta a su definicion`
    );
  }
};

const schedule = buildFixtureSchedule();
const employeePdf = buildEmployeeSchedulePdf(schedule.employees[0], schedule);
const source = decode(employeePdf);

assert.ok(source.startsWith("%PDF-1.4"));
assert.equal(employeePdf.length, source.length, "el documento debe quedar en ASCII puro");
assertXrefOffsets(source, "cronograma individual");

assert.match(source, /Cronograma semanal/);
assert.match(source, /Sin visitas asignadas/);
assert.match(source, /HORARIO/);
assert.match(source, /DIRECCI\\323N/, "DIRECCIÓN escapada en WinAnsi");
assert.match(source, /P\\341gina 1 de/, "acentos vivos en el pie");
assert.match(source, /Mar\\355a N\\372\\361ez/, "el nombre conserva tildes y ñ");
assert.doesNotMatch(source, /NaN|undefined/);

// La visita cancelada no viaja en el PDF que recibe la empleada.
assert.doesNotMatch(source, /Visita cancelada/);
assert.match(source, /Turno noche Tres Cruces/);

// Imagen embebida.
assert.match(source, /\/Subtype \/Image/);
assert.match(source, /\/Filter \[\/ASCIIHexDecode \/FlateDecode\]/);
assert.match(source, /\/XObject << \/Im1 \d+ 0 R >>/);
assert.match(source, /cm \/Im1 Do Q/);

const dictAt = source.indexOf("/Subtype /Image");
const declaredLength = Number(source.slice(dictAt).match(/\/Length (\d+) >>/)![1]);
const streamAt = source.indexOf("stream\n", dictAt) + "stream\n".length;
const endAt = source.indexOf("endstream", streamAt);
const stream = source.slice(streamAt, endAt);

assert.equal(declaredLength, stream.length, "/Length debe medir el stream codificado");
assert.ok(stream.endsWith(">\n"), "ASCIIHexDecode necesita su terminador");
assert.match(stream.slice(0, -2), /^[0-9a-f]+$/, "el stream de imagen es hexadecimal");
assert.equal(
  inflateSync(Buffer.from(stream.slice(0, -2), "hex")).length,
  bambuLogoImage.width * bambuLogoImage.height * 3,
  "el logo descomprime al tamaño RGB esperado"
);

// Sin imagenes, el generador compartido no debe cambiar para los otros PDF.
const plain = decode(buildSimplePdf(["BT ET\n"]));
assert.doesNotMatch(plain, /\/XObject/);
assert.match(plain, /\/Resources << \/Font << \/F1 3 0 R \/F2 4 0 R >> >>/);
assertXrefOffsets(plain, "documento sin imagenes");

const teamPdf = buildTeamSchedulePdf(schedule);
const teamSource = decode(teamPdf);
const pageCount = (teamSource.match(/\/Type \/Page\b/g) ?? []).length;

assertXrefOffsets(teamSource, "cronograma de equipo");
assert.ok(
  pageCount >= schedule.employees.length + 1,
  "portada mas al menos una pagina por empleada"
);
assert.equal((teamSource.match(/\/Subtype \/Image/g) ?? []).length, 1, "un solo XObject");
assert.match(teamSource, /Cronogramas del equipo/);
assert.match(teamSource, /Luc\\355a Fern\\341ndez/);
assert.doesNotMatch(teamSource, /NaN|undefined/);

// Semana cargada: fuerza cortes de pagina y la repeticion del encabezado de dia.
const denseSchedule = buildFixtureSchedule();
denseSchedule.employees[0].days.forEach((day) => {
  day.visits = Array.from({ length: 6 }, (_, index) => ({
    address: `Camino Carrasco ${1000 + index}, entre Veracierto y Chimborazo, local ${index}`,
    displayName: `Servicio integral de limpieza para oficinas ${index + 1}`,
    endLabel: "13:00",
    id: `${day.dateKey}-${index}`,
    jobId: `dense-${index}`,
    jobName: `Servicio integral de limpieza para oficinas ${index + 1}`,
    startAt: `${day.dateKey}T12:00:00.000Z`,
    startLabel: "09:00",
    status: "SCHEDULED" as const,
    teammates: ["Ana Belén Rodríguez", "Lucía Fernández"],
  }));
});
const densePdf = buildEmployeeSchedulePdf(denseSchedule.employees[0], denseSchedule);
const denseSource = decode(densePdf);
const densePages = (denseSource.match(/\/Type \/Page\b/g) ?? []).length;

assertXrefOffsets(denseSource, "cronograma denso");
assert.ok(densePages >= 3, `una semana cargada debe paginar, salieron ${densePages}`);
assert.equal(
  (denseSource.match(/P\\341gina \d+ de \d+/g) ?? []).length,
  densePages,
  "cada pagina lleva su pie numerado"
);
// Siete dias con visitas, mas una repeticion por cada corte de pagina.
assert.ok(
  (denseSource.match(/HORARIO/g) ?? []).length > 7,
  "el encabezado de columnas se repite al cortar pagina"
);
assert.doesNotMatch(denseSource, /NaN|undefined/);

const main = async () => {
  if (process.argv.includes("--write-sample")) {
    await mkdir("tmp/pdfs", { recursive: true });
    await writeFile("tmp/pdfs/cronograma-individual.pdf", employeePdf);
    await writeFile("tmp/pdfs/cronograma-equipo.pdf", teamPdf);
    await writeFile("tmp/pdfs/cronograma-paginacion.pdf", densePdf);
    console.log("Samples written to tmp/pdfs/");
  }

  console.log("Schedule PDF checks passed");
};

void main();
