// Feature 27c: visits generated before generatedStartAt existed have it in
// null, so "Generar visitas" could still refill the start of one that was
// moved. This one-off script fills it where the original start is certain:
//   1. rule visits never touched by hand (updatedById null): their start is
//      the one the rule gave them;
//   2. touched rule visits whose start is still one of their rule's starts.
// The rest (detached, or moved off their rule's starts) are only listed, and
// so are the days where a job has a touched visit next to an untouched rule
// visit: possible duplicates already generated. Nothing is fixed for those.
// Dry run by default. Writes only with --apply --expect=<rows> in one
// transaction, and rolls back if the count differs from the reviewed one.
import "dotenv/config";

import { db } from "../lib/db";
import { buildCandidateStarts, getRuleGenerationWindow } from "../lib/ops/job-occurrence-recurrence";
import { DEFAULT_OPS_TIMEZONE, startOfZonedDay } from "../lib/ops/timezone";

const DAY_MS = 86_400_000;
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const expected = Number(args.find((arg) => arg.startsWith("--expect="))?.slice(9));
// Montevideo is UTC-3 all year.
const local = (date: Date) => new Date(date.getTime() - 3 * 3_600_000).toISOString().slice(0, 16).replace("T", " ");
const localDay = (date: Date) => local(date).slice(0, 10);

const findVisits = () =>
  db.jobOccurrence.findMany({
    where: { generatedStartAt: null, OR: [{ scheduleRuleId: { not: null } }, { isDetached: true }] },
    select: {
      archivedAt: true,
      id: true,
      isDetached: true,
      job: { select: { name: true } },
      jobId: true,
      scheduleRule: true,
      scheduledStartAt: true,
      updatedById: true,
    },
    orderBy: { scheduledStartAt: "asc" },
  });

type Visit = Awaited<ReturnType<typeof findVisits>>[number];

const isRuleStart = (visit: Visit) => {
  if (!visit.scheduleRule) return false;
  const start = startOfZonedDay(visit.scheduledStartAt, visit.scheduleRule.timezone || DEFAULT_OPS_TIMEZONE);
  const window = getRuleGenerationWindow(visit.scheduleRule, { end: new Date(start.getTime() + DAY_MS - 1), start });
  return Boolean(window && buildCandidateStarts(visit.scheduleRule, window).some((candidate) => candidate.getTime() === visit.scheduledStartAt.getTime()));
};

const describe = (visit: { job: { name: string }; scheduledStartAt: Date; archivedAt?: Date | null }) =>
  `${local(visit.scheduledStartAt)}  ${visit.job.name}${visit.archivedAt ? " (archivada)" : ""}`;

const findPossibleDuplicates = async () => {
  const visits = await db.jobOccurrence.findMany({
    where: { archivedAt: null, job: { archivedAt: null } },
    select: { id: true, isDetached: true, job: { select: { name: true } }, jobId: true, scheduleRuleId: true, scheduledStartAt: true, updatedById: true },
    orderBy: { scheduledStartAt: "asc" },
  });
  const days = new Map<string, typeof visits>();
  for (const visit of visits) {
    const key = `${visit.jobId} ${localDay(visit.scheduledStartAt)}`;
    days.set(key, [...(days.get(key) ?? []), visit]);
  }
  return [...days.values()].filter(
    (day) =>
      day.some((visit) => visit.scheduleRuleId && !visit.updatedById) &&
      day.some((visit) => visit.isDetached || visit.updatedById)
  );
};

const main = async () => {
  const visits = await findVisits();
  const untouched = visits.filter((visit) => !visit.updatedById && !visit.isDetached);
  const touched = visits.filter((visit) => visit.updatedById || visit.isDetached);
  const onRuleStart = touched.filter(isRuleStart);
  const unknown = touched.filter((visit) => !onRuleStart.includes(visit));
  const fill = [...untouched, ...onRuleStart];

  console.log(`Visitas de regla sin generatedStartAt: ${visits.length}`);
  console.log(`  1. Sin tocar (se completa con su inicio): ${untouched.length}`);
  console.log(`  2. Tocadas, todavía en un inicio de su regla (se completa): ${onRuleStart.length}`);
  console.log(`  3. Separadas o movidas fuera de su regla (quedan en null): ${unknown.length}`);
  unknown.forEach((visit) => console.log(`     ${describe(visit)}${visit.isDetached ? " · separada" : " · movida"}`));

  const duplicates = await findPossibleDuplicates();
  console.log(`\nDías con una visita tocada junto a una de regla sin tocar (posibles duplicados): ${duplicates.length}`);
  duplicates.forEach((day) => {
    console.log(`  ${localDay(day[0].scheduledStartAt)}  ${day[0].job.name}`);
    day.forEach((visit) =>
      console.log(`     ${local(visit.scheduledStartAt).slice(11)}  ${visit.isDetached ? "separada" : visit.updatedById ? "tocada" : "de regla, sin tocar"}  ${visit.id}`)
    );
  });

  if (!apply) {
    console.log(`\nVista previa: no se escribió nada. Para aplicar: --apply --expect=${fill.length}`);
    return;
  }
  if (expected !== fill.length) {
    throw new Error(`--expect=${expected} no coincide con las ${fill.length} filas a completar. No se escribió nada.`);
  }

  // Raw SQL: copies the column without touching updatedAt or updatedById, so
  // the visits keep counting as untouched for replacement.
  const ids = fill.map((visit) => visit.id);
  await db.$transaction(async (tx) => {
    const count = await tx.$executeRaw`UPDATE "JobOccurrence" SET "generatedStartAt" = "scheduledStartAt" WHERE "id" = ANY(${ids}) AND "generatedStartAt" IS NULL`;
    if (count !== fill.length) {
      throw new Error(`Se actualizaron ${count} (esperado ${fill.length}). Se revirtió todo.`);
    }
  });
  console.log(`\nListo: ${fill.length} visitas con generatedStartAt.`);
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
