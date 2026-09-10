-- Nombre que ve la empleada en el cronograma, distinto del nombre interno.
-- El del trabajo aplica a todas sus visitas; el de la visita lo sobreescribe.
ALTER TABLE "Job" ADD COLUMN "scheduleName" TEXT;
ALTER TABLE "JobOccurrence" ADD COLUMN "scheduleLabel" TEXT;
