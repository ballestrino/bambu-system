import bcrypt from "bcryptjs";

import { db } from "@/lib/db";

// Datos ficticios para probar Formularios web (feature 75) en un Postgres local
// descartable. Se niega a correr contra otra base.
// pnpm exec tsx --require ./scripts/server-only-stub.cjs scripts/smoke-web-forms-seed.ts
// Usuario de prueba: smoke-forms@bambu.test / smoke-forms-2026
const EMAIL = "smoke-forms@bambu.test";
const PASSWORD = "smoke-forms-2026";

const services = ["Limpieza Doméstica", "Limpieza de Oficinas y Comercial", "Limpieza de Final de Obra", "Otro"];
const zones = ["Pocitos", "Carrasco", "Punta del Este", "Cordón", "Malvín"];
const names = ["Ana Pérez", "Bruno Silva", "Carla Méndez", "Diego Rossi", "Elena Castro", "Fabián Núñez", "Gabriela Ríos", "Hugo Martínez"];

const main = async () => {
  const url = process.env.DATABASE_URL ?? "";
  if (!/localhost|127\.0\.0\.1/.test(url)) throw new Error("Solo corre contra un Postgres local");

  await db.user.upsert({
    create: { email: EMAIL, emailVerified: new Date(), name: "Smoke formularios", password: await bcrypt.hash(PASSWORD, 10), role: "ADMIN" },
    update: {},
    where: { email: EMAIL },
  });

  const now = Date.now();
  for (let index = 0; index < 24; index += 1) {
    const name = names[index % names.length];
    const lookingForWork = index % 6 === 2;
    await db.webFormSubmission.create({
      data: {
        externalId: `smoke-${index}-${now}`,
        kind: index % 5 === 4 ? "JOB_APPLICATION" : "CONTACT",
        status: index < 16 ? "NEW" : index < 21 ? "REPLIED" : "ARCHIVED",
        name,
        email: `${name.split(" ")[0].toLowerCase()}${index}@ejemplo.test`,
        phone: `09${String(1000000 + index * 7919).slice(0, 7)}`,
        service: services[index % services.length],
        location: zones[index % zones.length],
        message: lookingForWork
          ? "Hola, soy limpiadora con 5 años de experiencia en casas y oficinas. Quería saber si están tomando personal."
          : `Necesito un presupuesto para limpieza ${index % 2 ? "semanal" : "una vez"} de un apartamento de ${2 + (index % 3)} dormitorios. ¿Tienen disponibilidad?`,
        fromTrebol: index % 7 === 0,
        createdAt: new Date(now - index * 5 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`Listo: 24 formularios y ${EMAIL}`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
