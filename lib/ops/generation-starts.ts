export type GeneratedStartVisit = {
  generatedStartAt: Date | null;
  scheduledStartAt: Date;
};

// A rule start is taken when a visit of the job sits there now or was
// generated there and then moved, detached or archived. Archived visits count
// too, so generating again never brings back a visit the user removed.
export const getMissingStarts = (starts: Date[], visits: GeneratedStartVisit[]) => {
  const taken = new Set(
    visits.flatMap((visit) => [
      visit.scheduledStartAt.getTime(),
      ...(visit.generatedStartAt ? [visit.generatedStartAt.getTime()] : []),
    ])
  );

  return starts.filter((start) => !taken.has(start.getTime()));
};
