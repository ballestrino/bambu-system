// Feature 12: payroll is tracked from the hours of August 2026. This one-off
// script cleans the data from before that:
//   1. archives DONE visits before 2026-08-01 that have no actual times, like
//      the app's "Eliminar" does;
//   2. sets the period of the August payments that paid July to 1-31 July;
//   3. moves the 28/8 advance to payment month September (period August).
// Dry run by default. Writes only with --apply --actor=<admin email>, in one
// transaction, and aborts if the rows found differ from the reviewed ones.
import "dotenv/config";

import { db } from "../lib/db";

const EXPECTED = { advances: 1, julyPayments: 7, visits: 259 };
// Local Montevideo boundaries (UTC-3), stored as the app stores them.
const TRACKING_START = new Date("2026-08-01T03:00:00.000Z");
const JULY_PERIOD = {
  periodEnd: new Date("2026-08-01T02:59:59.000Z"),
  periodStart: new Date("2026-07-01T03:00:00.000Z"),
};
const AUGUST_ASSIGNED = new Date("2026-08-01T00:00:00.000Z");
const SEPTEMBER_ASSIGNED = new Date("2026-09-01T00:00:00.000Z");
const ADVANCE_DATE = new Date("2026-08-28T03:00:00.000Z");

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const actorEmail = args.find((arg) => arg.startsWith("--actor="))?.slice(8);
const day = (date: Date) =>
  new Date(date.getTime() - 3 * 3_600_000).toISOString().slice(0, 10);
const money = (value: unknown) => `$ ${Number(value).toLocaleString("es-UY")}`;

const findTargets = async () => {
  const visits = await db.jobOccurrence.findMany({
    where: {
      archivedAt: null,
      scheduledStartAt: { lt: TRACKING_START },
      status: "DONE",
      OR: [{ actualStartAt: null }, { actualEndAt: null }],
    },
    select: {
      _count: { select: { employees: true, timeEntries: true } },
      id: true,
      job: { select: { name: true } },
      scheduledStartAt: true,
    },
    orderBy: { scheduledStartAt: "asc" },
  });
  const augustPayments = await db.employeePayment.findMany({
    where: { assignedMonth: AUGUST_ASSIGNED, status: "RECORDED" },
    include: { employee: { select: { name: true } } },
    orderBy: { paymentDate: "asc" },
  });
  const isAdvance = (payment: (typeof augustPayments)[number]) =>
    payment.paymentDate.getTime() === ADVANCE_DATE.getTime() &&
    Number(payment.amount) === 504 &&
    /ADELANTO/i.test(payment.notes ?? "");
  return {
    advances: augustPayments.filter(isAdvance),
    julyPayments: augustPayments.filter((payment) => !isAdvance(payment)),
    visits,
  };
};

const printPlan = (targets: Awaited<ReturnType<typeof findTargets>>) => {
  const byMonth = new Map<string, Map<string, number>>();
  for (const visit of targets.visits) {
    const month = day(visit.scheduledStartAt).slice(0, 7);
    const jobs = byMonth.get(month) ?? new Map<string, number>();
    jobs.set(visit.job.name, (jobs.get(visit.job.name) ?? 0) + 1);
    byMonth.set(month, jobs);
  }
  console.log(`\n1. Archivar ${targets.visits.length} visitas DONE sin hora real, antes del 1/8:`);
  for (const [month, jobs] of byMonth) {
    const total = [...jobs.values()].reduce((sum, count) => sum + count, 0);
    const detail = [...jobs].map(([name, count]) => `${name} (${count})`).join(", ");
    console.log(`   ${month}: ${total} → ${detail}`);
  }
  const linked = targets.visits.filter(
    (visit) => visit._count.employees > 0 || visit._count.timeEntries > 0
  );
  console.log(`   Con empleada u horas cargadas: ${linked.length}`);

  const printPayments = (title: string, rows: typeof targets.julyPayments) => {
    const total = rows.reduce((sum, row) => sum + Number(row.amount), 0);
    console.log(`\n${title} (${rows.length}, ${money(total)}):`);
    for (const row of rows) {
      console.log(
        `   ${day(row.paymentDate)} ${row.employee.name} ${money(row.amount)} | período ${day(row.periodStart)}→${day(row.periodEnd)}${row.notes ? ` | ${row.notes.replace(/\s+/g, " ")}` : ""}`
      );
    }
  };
  printPayments("2. Período → 2026-07-01→2026-07-31, pagos de agosto que pagaron julio", targets.julyPayments);
  printPayments("3. Mes de pago → septiembre (período agosto se mantiene)", targets.advances);
};

const main = async () => {
  const targets = await findTargets();
  printPlan(targets);
  const mismatches = (Object.keys(EXPECTED) as (keyof typeof EXPECTED)[]).filter(
    (key) => targets[key].length !== EXPECTED[key]
  );
  if (mismatches.length) {
    throw new Error(
      `Los datos cambiaron desde la revisión: ${mismatches
        .map((key) => `${key} ${targets[key].length} (esperado ${EXPECTED[key]})`)
        .join(", ")}. No se escribió nada.`
    );
  }
  if (!apply) {
    console.log("\nVista previa: no se escribió nada. Para aplicar: --apply --actor=<email>");
    return;
  }

  const actor = actorEmail
    ? await db.user.findUnique({ where: { email: actorEmail }, select: { id: true, role: true } })
    : null;
  if (!actor || actor.role !== "ADMIN") {
    throw new Error("--apply requiere --actor=<email> de un usuario ADMIN. No se escribió nada.");
  }

  const now = new Date();
  // Any count off the reviewed one throws inside the transaction, which rolls
  // every write back.
  const assertCount = (key: keyof typeof EXPECTED, count: number) => {
    if (count !== EXPECTED[key]) {
      throw new Error(`${key}: se actualizaron ${count} (esperado ${EXPECTED[key]}). Se revirtió todo.`);
    }
  };
  await db.$transaction(async (tx) => {
    const visits = await tx.jobOccurrence.updateMany({
      where: { archivedAt: null, id: { in: targets.visits.map(({ id }) => id) } },
      data: { archivedAt: now, updatedById: actor.id },
    });
    assertCount("visits", visits.count);
    const julyPayments = await tx.employeePayment.updateMany({
      where: { id: { in: targets.julyPayments.map(({ id }) => id) }, status: "RECORDED" },
      data: { ...JULY_PERIOD, updatedById: actor.id },
    });
    assertCount("julyPayments", julyPayments.count);
    const advances = await tx.employeePayment.updateMany({
      where: { id: { in: targets.advances.map(({ id }) => id) }, status: "RECORDED" },
      data: { assignedMonth: SEPTEMBER_ASSIGNED, updatedById: actor.id },
    });
    assertCount("advances", advances.count);
  });
  console.log(
    `\nAplicado: ${EXPECTED.visits} visitas archivadas, ${EXPECTED.julyPayments} períodos corregidos y ${EXPECTED.advances} adelanto movido.`
  );
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
