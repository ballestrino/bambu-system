import { JobOccurrencesPage } from "@/components/ops/jobs/job-occurrences-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <JobOccurrencesPage jobId={id} />;
}
