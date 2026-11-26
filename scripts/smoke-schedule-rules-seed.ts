import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { generateOccurrences } from "@/lib/ops/job-occurrence-generator";
import { resolveOccurrenceGenerationRange } from "@/lib/ops/occurrence-generation-range";
import { dayStartUtc } from "@/lib/ops/schedule-rule-cleanup-window";
import { getTodayKey } from "@/lib/ops/occurrence-generation-presets";

// Datos ficticios para probar la vista de reglas de calendario (feature 73) en
// un Postgres local descartable. Se niega a correr contra otra base.
// pnpm exec tsx --require ./scripts/server-only-stub.cjs scripts/smoke-schedule-rules-seed.ts
// Usuario de prueba: smoke-rules@bambu.test / smoke-rules-2026
const EMAIL = "smoke-rules@bambu.test";
const PASSWORD = "smoke-rules-2026";

type RuleSeed = { days?: number[]; dom?: number; end?: string; freq: "DAILY" | "WEEKLY" | "MONTHLY"; minutes: number; start: string; time: number };
const jobs: { address: string; name: string; rules: RuleSeed[] }[] = [
  { address: "Oficinas · Ciudad Vieja", name: "Godoy", rules: [{ days: [1, 3, 5], freq: "WEEKLY", minutes: 180, start: "2026-09-01", time: 480 }] },
  { address: "Áreas comunes · Punta Carretas", name: "Edificio Rambla 2410", rules: [{ days: [1, 2, 3, 4, 5], freq: "WEEKLY", minutes: 120, start: "2026-08-03", time: 420 }] },
  { address: "Consultorios · Pocitos", name: "Clínica Pocitos", rules: [{ freq: "DAILY", minutes: 120, start: "2026-10-01", time: 390 }] },
  {
    address: "Hall y escaleras · Prado",
    name: "Torre Prado",
    rules: [
      { days: [1, 4], freq: "WEEKLY", minutes: 120, start: "2026-07-06", time: 540 },
      { days: [1], freq: "WEEKLY", minutes: 90, start: "2026-11-02", time: 570 },
    ],
  },
  { address: "Consultorio · Cordón", name: "Consultorio Gómez", rules: [{ days: [5], end: "2026-10-31", freq: "WEEKLY", minutes: 90, start: "2026-05-08", time: 960 }] },
  { address: "Limpieza profunda · Carrasco", name: "Casa Martínez", rules: [{ dom: 15, freq: "MONTHLY", minutes: 240, start: "2026-04-15", time: 600 }] },
  { address: "Galpón · La Teja", name: "Depósito Logística Sur", rules: [] },
];

const main = async () => {
  const url = process.env.DATABASE_URL ?? "";
  if (!/localhost|127\.0\.0\.1/.test(url)) throw new Error("Solo corre contra un Postgres local");

  const user = await db.user.upsert({
    create: { email: EMAIL, emailVerified: new Date(), name: "Smoke reglas", password: await bcrypt.hash(PASSWORD, 10), role: "ADMIN" },
    update: {},
    where: { email: EMAIL },
  });
  const ana = await db.employee.create({ data: { createdById: user.id, name: "Ana Smoke" } });

  for (const seed of jobs) {
    const job = await db.job.create({
      data: { createdById: user.id, name: seed.name, serviceAddress: seed.address, status: "ACTIVE" },
    });
    await db.jobEmployeeAssignment.create({
      data: { assignedFrom: dayStartUtc("2026-01-01"), createdById: user.id, employeeId: ana.id, jobId: job.id },
    });
    for (const rule of seed.rules) {
      const created = await db.jobScheduleRule.create({
        data: {
          createdById: user.id, dayOfMonth: rule.dom ?? null, durationMinutes: rule.minutes,
          endDate: rule.end ? dayStartUtc(rule.end) : null, frequency: rule.freq, jobId: job.id,
          startDate: dayStartUtc(rule.start), startTimeMinutes: rule.time, weekdays: rule.days ?? [],
        },
      });
      const range = resolveOccurrenceGenerationRange("2026-10-01", "2027-01-31");
      if (range) await generateOccurrences(range, { scheduleRuleId: created.id }, user.id);
    }
  }

  // Lo pasado queda realizado salvo una de cada cuatro, que queda pendiente.
  const past = await db.jobOccurrence.findMany({
    where: { scheduledStartAt: { lt: dayStartUtc(getTodayKey()) } },
    orderBy: { scheduledStartAt: "asc" },
  });
  for (const [index, visit] of past.entries()) {
    if (index % 4 === 3) continue;
    await db.jobOccurrence.update({
      data: { actualEndAt: visit.scheduledEndAt, actualStartAt: visit.scheduledStartAt, status: "DONE" },
      where: { id: visit.id },
    });
  }
  const total = await db.jobOccurrence.count();
  console.log(`Sembrado: ${jobs.length} trabajos, ${total} visitas (${past.length} pasadas).`);
};

main().finally(() => db.$disconnect());
