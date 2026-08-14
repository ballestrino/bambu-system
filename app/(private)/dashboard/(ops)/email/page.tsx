import { MailWorkspace } from "@/components/mail/mail-workspace";
import { getMailWorkspace, type MailboxView } from "@/data/mail-workspace";

type Props = {
  searchParams: Promise<{
    view?: string;
    q?: string;
    thread?: string;
    folder?: string;
  }>;
};

const getView = (value?: string): MailboxView =>
  value === "sent" || value === "archive" || value === "folder" ? value : "inbox";

export default async function MailPage({ searchParams }: Props) {
  const params = await searchParams;
  const view = getView(params.view);
  const data = await getMailWorkspace({
    view,
    query: params.q,
    threadId: params.thread,
    folderKey: view === "folder" ? params.folder : undefined,
  });
  return (
    <MailWorkspace
      data={data}
      view={view}
      query={params.q}
      folderKey={view === "folder" ? params.folder : undefined}
    />
  );
}
